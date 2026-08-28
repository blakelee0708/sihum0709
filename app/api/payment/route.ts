/**
 * 결제 콜백 (PRD 12장)
 *
 * PG 계약 전이라 더미 결제를 기록합니다.
 *
 * TODO: 사용자 확인 필요
 * 포트원 또는 토스페이먼츠 연동 후 이 라우트에서 PG 거래 검증을 해야 합니다.
 * 지금은 서버가 결제 성공을 그대로 믿고 기록하므로 실제 서비스에 그대로 쓰면 안 됩니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { consumeCoupon } from '@/lib/coupon-server'
import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  let body: { queryId?: string; productType?: string; couponCode?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  if (!body.queryId || !body.productType) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: query } = await supabase
    .from('queries')
    .select('id, user_id')
    .eq('id', body.queryId)
    .maybeSingle()

  if (!query || query.user_id !== user.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  // 확인과 사용을 나눠 뒀습니다. 여기가 실제로 쓰는 자리입니다 (lib/coupon-server.ts)
  const { amount, couponCode } = await consumeCoupon(body.couponCode ?? null)

  // payments는 사용자 정책이 select 전용입니다 (PRD 13.2).
  // 사용자가 결제 기록을 직접 만들 수 없어야 하므로 service_role로 씁니다.
  const service = createServiceClient()
  if (!service) {
    return NextResponse.json({ error: 'service key required' }, { status: 503 })
  }

  const { data, error } = await service
    .from('payments')
    .insert({
      user_id: user.id,
      report_id: null,
      payment_id: `MOCK-${Date.now()}`,
      amount,
      product_type: body.productType,
      payment_method: '더미 결제',
      coupon_code: couponCode,
      is_granted: amount === 0,
      paid_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, amount })
}
