/**
 * 쿠폰 (PRD 12.6, FIX_4 [4]-3, [5]-2)
 *
 * 457deep에서 발급한 무료권 링크로 들어오면 코드를 세션에 담아 두고
 * 결제 화면까지 들고 갑니다. 사용자가 코드를 복사해서 붙여넣을 필요가
 * 없어야 합니다.
 *
 * sessionStorage를 쓰는 이유는 탭을 닫으면 사라져야 하기 때문입니다.
 * 다음에 링크 없이 들어온 사람에게 남의 코드가 붙어 있으면 안 됩니다.
 *
 * 브라우저에서만 쓰는 값이라 서버 모듈을 import하지 않습니다.
 */

import { PRICE } from './pricing'

export const COUPON_SESSION_KEY = 'coupon'

/** 링크의 쿼리 파라미터 이름. 짧아야 링크가 지저분해지지 않습니다 */
export const COUPON_PARAM = 'c'

/** 정가는 lib/pricing.ts 하나에서 옵니다 (FIX_4 [6]) */
export { PRICE }

export function saveCoupon(code: string): void {
  try {
    sessionStorage.setItem(COUPON_SESSION_KEY, code.trim().toUpperCase())
  } catch {
    // 사생활 보호 모드 등. 저장 못 하면 결제 화면에서 직접 입력하면 됩니다
  }
}

export function readCoupon(): string | null {
  try {
    return sessionStorage.getItem(COUPON_SESSION_KEY)
  } catch {
    return null
  }
}

export function clearCoupon(): void {
  try {
    sessionStorage.removeItem(COUPON_SESSION_KEY)
  } catch {
    // 못 지워도 다음 방문에는 남지 않습니다
  }
}

export interface CouponCheck {
  valid: boolean
  /** 이 쿠폰을 적용했을 때 결제 금액 */
  amount: number
  /** 0원이면 무료권입니다 */
  free: boolean
}

/**
 * 코드가 유효한지 서버에 물어봅니다.
 *
 * 사용 횟수를 올리지 않습니다. 결제 화면과 로그인 화면이 안내를 띄우려고
 * 부르는 것이라, 여기서 올리면 결제하지 않은 쿠폰이 소진됩니다.
 */
export async function checkCoupon(code: string): Promise<CouponCheck> {
  try {
    const res = await fetch(`/api/coupon/check?code=${encodeURIComponent(code)}`)
    if (!res.ok) return { valid: false, amount: PRICE, free: false }
    return (await res.json()) as CouponCheck
  } catch {
    return { valid: false, amount: PRICE, free: false }
  }
}
