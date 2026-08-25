/**
 * 알림 신청 (PRD 8.2 실기 준비 중, 12.7 결제 의사 측정)
 *
 * 실기 사용자는 유료 상품이 없으므로 여기서 이메일만 받아둡니다.
 * 상품이 열리면 이 목록으로 안내합니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

const REASONS = new Set(['practical', 'price'])
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  let body: {
    email?: string
    reason?: string
    examName?: string
    examType?: string
    priceShown?: number
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const reason = body.reason ?? 'practical'

  if (!EMAIL_RE.test(email) || email.length > 200 || !REASONS.has(reason)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  // Supabase 미설정이면 접수만 받은 것처럼 응답합니다 (목업 모드)
  if (!isSupabaseConfigured) return NextResponse.json({ ok: true, mock: true })

  const service = createServiceClient()
  if (!service) return NextResponse.json({ ok: true, mock: true })

  // 같은 사람이 여러 번 눌러도 한 건만 남깁니다
  const { error } = await service.from('waitlist').upsert(
    {
      email,
      reason,
      exam_name: body.examName?.slice(0, 100) ?? null,
      exam_type: body.examType?.slice(0, 10) ?? null,
      price_shown: body.priceShown ?? null,
    },
    { onConflict: 'email,reason' }
  )

  if (error) {
    return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
