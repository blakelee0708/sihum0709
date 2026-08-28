/**
 * 쿠폰 조회와 사용 (PRD 12.6)
 *
 * 결제 라우트 안에 있던 것을 꺼냈습니다. 안내를 띄우려고 미리 확인하는
 * 자리(로그인·결제 화면)와 실제로 쓰는 자리(결제)가 나뉘었기 때문입니다.
 *
 * 확인과 사용을 반드시 나눠야 합니다. 확인할 때 사용 횟수를 올리면
 * 결제하지 않고 화면만 본 사람의 쿠폰이 소진됩니다.
 *
 * coupons 테이블은 RLS 정책이 없어 anon 키로는 아무것도 못 읽습니다.
 * 반드시 service_role로 다룹니다 (PRD 13.2).
 */

import { PRICE } from './coupon'
import { createServiceClient } from './supabase/server'

export { PRICE }

interface CouponRow {
  code: string
  discount_type: string
  discount_value: number
  max_uses: number | null
  used_count: number | null
  valid_until: string | null
}

export interface CouponPreview {
  valid: boolean
  amount: number
  free: boolean
  code: string | null
}

const INVALID: CouponPreview = { valid: false, amount: PRICE, free: false, code: null }

function discounted(row: CouponRow): number {
  return row.discount_type === 'percent'
    ? Math.max(0, Math.round(PRICE * (1 - row.discount_value / 100)))
    : Math.max(0, PRICE - row.discount_value)
}

/** 사용 횟수를 올리지 않고 확인만 합니다 */
export async function previewCoupon(code: string | null): Promise<CouponPreview> {
  if (!code) return INVALID

  const service = createServiceClient()
  if (!service) return INVALID

  const { data } = await service
    .from('coupons')
    .select('code, discount_type, discount_value, max_uses, used_count, valid_until')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle<CouponRow>()

  if (!data) return INVALID
  if (data.valid_until && new Date(data.valid_until) < new Date()) return INVALID
  if (data.max_uses !== null && (data.used_count ?? 0) >= data.max_uses) return INVALID

  const amount = discounted(data)
  return { valid: true, amount, free: amount === 0, code: data.code }
}

/** 확인하고 사용 횟수를 올립니다. 결제 시점에만 부릅니다 */
export async function consumeCoupon(
  code: string | null
): Promise<{ amount: number; couponCode: string | null }> {
  const preview = await previewCoupon(code)
  if (!preview.valid || !preview.code) return { amount: PRICE, couponCode: null }

  const service = createServiceClient()
  if (!service) return { amount: PRICE, couponCode: null }

  // 읽은 값에 1을 더하는 대신 DB에서 다시 세지 않습니다. 동시 사용이
  // 몰리는 규모가 아니고, max_uses 초과는 위 preview가 막습니다.
  const { data } = await service
    .from('coupons')
    .select('used_count')
    .eq('code', preview.code)
    .maybeSingle<{ used_count: number | null }>()

  await service
    .from('coupons')
    .update({ used_count: (data?.used_count ?? 0) + 1 })
    .eq('code', preview.code)

  return { amount: preview.amount, couponCode: preview.code }
}
