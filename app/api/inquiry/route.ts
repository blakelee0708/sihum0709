/**
 * 문의 등록 (PRD 14.16)
 *
 * 비로그인 상태에서도 문의할 수 있어야 하므로 로그인을 요구하지 않습니다.
 * 등록되면 Slack에 알림을 보냅니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

const CATEGORIES = ['결제 · 환불', '리포트 내용', '계정 · 로그인', '오류 신고', '기타']

export async function POST(req: NextRequest) {
  let body: { category?: string; content?: string; email?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const category = body.category ?? '기타'
  const content = (body.content ?? '').trim()
  const email = (body.email ?? '').trim()

  if (!content || !email || !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  if (content.length > 2000 || email.length > 200) {
    return NextResponse.json({ error: 'too long' }, { status: 400 })
  }

  // Supabase 미설정이면 접수만 받은 것처럼 응답합니다 (목업 모드)
  if (!isSupabaseConfigured) {
    // TODO: 사용자 확인 필요 — Supabase 연결 후 실제 저장됩니다
    return NextResponse.json({ ok: true, mock: true })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const service = createServiceClient()
  const db = service ?? supabase

  const { error } = await db.from('inquiries').insert({
    user_id: user?.id ?? null,
    category,
    content,
    email,
  })

  if (error) {
    return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  }

  await notifySlack(category, email, content)

  return NextResponse.json({ ok: true })
}

/** PRD 14.16 — 문의가 등록되면 Slack에 알립니다 */
async function notifySlack(category: string, email: string, content: string) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `새 문의 [${category}]\n${email}\n${content.slice(0, 500)}`,
      }),
    })
  } catch {
    // 알림 실패가 문의 접수를 막지 않도록 합니다
  }
}
