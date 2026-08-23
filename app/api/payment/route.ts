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

import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

const PRICE = 3900

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

  const { amount, couponCode } = await applyCoupon(body.couponCode ?? null)

  const { data, error } = await supabase
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

/**
 * 쿠폰 적용 (PRD 12.6).
 * coupons 테이블은 클라이언트에서 접근하지 않으므로 service_role로 읽습니다.
 */
async function applyCoupon(
  code: string | null
): Promise<{ amount: number; couponCode: string | null }> {
  if (!code) return { amount: PRICE, couponCode: null }

  const service = createServiceClient()
  if (!service) return { amount: PRICE, couponCode: null }

  const { data } = await service
    .from('coupons')
    .select('code, discount_type, discount_value, max_uses, used_count, valid_until')
    .eq('code', code)
    .maybeSingle()

  if (!data) return { amount: PRICE, couponCode: null }
  if (data.valid_until && new Date(data.valid_until) < new Date()) {
    return { amount: PRICE, couponCode: null }
  }
  if (data.max_uses !== null && (data.used_count ?? 0) >= data.max_uses) {
    return { amount: PRICE, couponCode: null }
  }

  const amount =
    data.discount_type === 'percent'
      ? Math.max(0, Math.round(PRICE * (1 - data.discount_value / 100)))
      : Math.max(0, PRICE - data.discount_value)

  await service
    .from('coupons')
    .update({ used_count: (data.used_count ?? 0) + 1 })
    .eq('code', data.code)

  return { amount, couponCode: data.code }
}
