/**
 * 환불 처리 (PRD 22.8)
 *
 * DB 상태 변경만으로는 실제 환불이 되지 않으므로 PG 취소를 먼저 호출하고,
 * 성공한 경우에만 DB에 반영합니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { adminDb, requireAdmin, UnauthorizedError } from '@/lib/admin/auth'
import { cancelPayment } from '@/lib/admin/pg'

export async function POST(req: NextRequest) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
    }
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  let body: { paymentId?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  if (!body.paymentId) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const db = adminDb()

  const { data: payment } = await db
    .from('payments')
    .select('id, payment_id, report_id, refunded_at')
    .eq('id', body.paymentId)
    .maybeSingle()

  if (!payment) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (payment.refunded_at) {
    return NextResponse.json({ error: '이미 환불된 건입니다' }, { status: 409 })
  }

  const reason = (body.reason ?? '').slice(0, 500)

  // 1. PG 취소
  const cancel = await cancelPayment(payment.payment_id, reason)
  if (!cancel.ok) {
    return NextResponse.json({ error: cancel.message ?? 'PG 취소 실패' }, { status: 502 })
  }

  // 2. DB 반영
  await db
    .from('payments')
    .update({
      refunded_at: new Date().toISOString(),
      refund_reason: reason || null,
      refunded_by: admin.email,
    })
    .eq('id', payment.id)

  // 3. 리포트 접근 차단
  if (payment.report_id) {
    await db.from('reports').update({ status: 'refunded' }).eq('id', payment.report_id)
  }

  return NextResponse.json({ ok: true, mock: cancel.mock })
}
