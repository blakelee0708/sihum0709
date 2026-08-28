/**
 * 쿠폰 확인 (FIX_4 [4]-3, [5]-2)
 *
 * 사용 횟수를 올리지 않고 "이 코드를 쓰면 얼마인지"만 돌려줍니다.
 * 로그인 화면의 무료권 안내와 결제 화면의 자동 입력이 이것을 씁니다.
 *
 * 로그인 전에도 불러야 하므로 인증을 요구하지 않습니다. 코드가 맞는지
 * 여부와 금액만 나가고 발급 대상이나 사용 이력은 나가지 않습니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { previewCoupon } from '@/lib/coupon-server'
import { PRICE } from '@/lib/coupon'
import { isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (!isSupabaseConfigured || !code) {
    return NextResponse.json({ valid: false, amount: PRICE, free: false })
  }

  const preview = await previewCoupon(code)

  return NextResponse.json({
    valid: preview.valid,
    amount: preview.amount,
    free: preview.free,
  })
}
