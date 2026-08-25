/**
 * 문의 답변 (PRD 22.10)
 *
 * 답변을 작성하면 status를 answered로 바꿉니다.
 *
 * TODO: 사용자 확인 필요
 * 이메일 발송 서비스(Resend, SendGrid 등)를 붙이면 답변을 메일로 보냅니다.
 * 지금은 DB에만 기록하므로 관리자가 직접 회신해야 합니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { adminDb, requireAdmin, UnauthorizedError } from '@/lib/admin/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
    }
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  const { id } = await params

  let body: { reply?: string; status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const db = adminDb()

  // 완료 처리만 하는 경우 답변 없이 상태만 바꿉니다
  if (body.status === 'closed' && !body.reply) {
    await db.from('inquiries').update({ status: 'closed' }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  const reply = (body.reply ?? '').trim()
  if (!reply) return NextResponse.json({ error: '답변 내용을 입력해 주십시오' }, { status: 400 })

  const { error } = await db
    .from('inquiries')
    .update({
      reply: reply.slice(0, 4000),
      replied_at: new Date().toISOString(),
      replied_by: admin.email,
      status: 'answered',
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: '저장하지 못했습니다' }, { status: 500 })

  return NextResponse.json({ ok: true, emailSent: false })
}
