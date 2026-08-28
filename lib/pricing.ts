/**
 * 가격 (PRD 8.1, 12.8, FIX_4 [6])
 *
 * **3,900원을 유지합니다.** 정가를 올리고 상시 할인을 거는 방식은 쓰지
 * 않습니다. 세 가지 문제가 있습니다.
 *
 *   정가에 판매한 적이 없으면 거짓 할인 표시가 됩니다
 *   모두가 3,900원에 사면 정가가 무의미합니다
 *   457deep 무료권의 특별함이 사라집니다
 *
 * 신규 가입 혜택은 할인이 아니라 기능으로 줍니다 (SIGNUP_BENEFITS).
 *
 * ── 가격 실험 ──
 *
 * PRD 12.8의 A/B는 출시 후에 켭니다. 지금은 준비만 해두고 끄고 둡니다
 * (FIX_4 [6]). PRICE_TEST_ENABLED가 false인 동안 getPrice는 항상 3,900원을
 * 돌려주므로, 실수로 실험 코드가 화면에 새어 나가지 않습니다.
 *
 * 켤 때는 이 파일의 상수 하나만 바꾸면 됩니다. 배정은 사용자마다 고정돼야
 * 하므로(같은 사람이 새로고침할 때마다 가격이 바뀌면 안 됩니다) 계측 seed를
 * 받아 나눕니다.
 */

/** 판매가. 화면·결제·쿠폰 계산이 모두 이 값을 씁니다 */
export const PRICE = 3900

export type PriceVariant = 'A' | 'B' | 'C'

/** PRD 12.8 실험안. B가 현재 가격입니다 */
export const PRICE_VARIANTS: Record<PriceVariant, number> = {
  A: 1900,
  B: PRICE,
  C: 5900,
}

/** 출시 후에 켭니다. 지금 켜지 마십시오 (FIX_4 [6]) */
export const PRICE_TEST_ENABLED = false

export interface PriceAssignment {
  variant: PriceVariant
  price: number
}

const VARIANT_KEYS: PriceVariant[] = ['A', 'B', 'C']

/**
 * 사용자에게 보여줄 가격.
 *
 * 실험이 꺼져 있으면 seed와 상관없이 B(3,900원)입니다.
 * seed는 같은 사용자에게 항상 같은 안을 주기 위한 값입니다.
 */
export function getPrice(seed?: number): PriceAssignment {
  if (!PRICE_TEST_ENABLED || seed === undefined) {
    return { variant: 'B', price: PRICE }
  }

  const variant = VARIANT_KEYS[Math.abs(Math.trunc(seed)) % VARIANT_KEYS.length]
  return { variant, price: PRICE_VARIANTS[variant] }
}

/**
 * 신규 가입 혜택 (FIX_4 [6]).
 *
 * 할인이 아니라 기능입니다. 로그인 화면에서 "왜 로그인하는가"에 답합니다.
 *
 * 실제로 되는 것만 적습니다. 웹푸시는 아직 발송을 붙이지 않았으므로
 * (PRD 20장 2차 확장, /my/settings 참고) 목록에 넣지 않습니다. 안 되는
 * 것을 혜택으로 적으면 그 자리에서 신뢰를 잃습니다. 발송이 열리면
 * NOTIFY_BENEFIT을 목록에 넣으면 됩니다.
 */
export const SIGNUP_BENEFITS = [
  '결과를 저장해 다음에 입력 없이 볼 수 있어요',
  '오늘의 운을 매일 확인할 수 있어요',
] as const

/** 웹푸시 발송이 열리면 위 목록에 넣습니다 */
export const NOTIFY_BENEFIT = '시험 D-7, D-1에 알려드려요'
