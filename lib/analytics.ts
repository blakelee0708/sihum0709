/**
 * 검증 지표 계측 (PRD 19장, 12.8)
 *
 * 외부 분석 서비스를 붙이지 않고 Supabase events 테이블에 직접 쌓습니다.
 * 원가가 들지 않고, 개인정보가 밖으로 나가지 않습니다.
 *
 * ── 무엇을 남기지 않는가 ──
 *
 * 생년월일, 태어난 시간, 이름, 이메일, 시험명은 기록하지 않습니다.
 * 남기는 것은 "어느 단계에서 이탈했는지", "어떤 방식을 골랐는지" 수준입니다.
 *
 * session_id는 브라우저가 만든 임의 문자열이며 sessionStorage에만 있습니다.
 * 브라우저를 닫으면 사라지고 사람과 연결되지 않습니다.
 */

/** PRD 19장 지표를 만들기 위해 필요한 이벤트 */
export type EventName =
  /** 1. 랜딩 이탈률 — 시작하기 클릭 */
  | 'landing_cta_click'
  /** 2. 입력 완주율 — 단계별 이탈 지점 */
  | 'chat_step_answered'
  | 'chat_completed'
  /** 결과 화면 도달 */
  | 'result_viewed'
  /** 3. 공유 버튼 클릭률 */
  | 'share_clicked'
  | 'type_share_clicked'
  /** 결과 저장 */
  | 'save_clicked'
  /** 4. CTA 클릭률 — 결제 화면 진입 */
  | 'paid_cta_click'
  /** 카드 안 부분 잠금에서 진입 (PRD 3.4). 어느 카드가 결제를 만드는지 봅니다 */
  | 'card_lock_click'
  /** 결제 화면 도달 */
  | 'checkout_viewed'
  /** 5. 결제 전환율 */
  | 'payment_completed'
  /** 리포트 열람 */
  | 'report_viewed'
  /** 8. 실기 알림 신청 (PRD 8.2) */
  | 'waitlist_submitted'

export interface EventProps {
  /** 대화 단계 id */
  step?: string
  /** 필기 / 면접 / 실기 / 오디션 — 방식별 분포 (PRD 19) */
  examType?: string
  /** 부분 잠금을 누른 카드 번호 (PRD 3.4) */
  cardId?: number
  /** 강한 오행 — 유형별 분포 (PRD 22.12) */
  strongElement?: string
  /** D-day 구간 — D-day 구간별 결제율 (PRD 22.12) */
  ddayRange?: string
  /** PRD 12.8 가격 테스트. 화면에 보여준 금액 */
  priceShown?: number
  /** 알림 신청 맥락 */
  reason?: string
  [key: string]: string | number | boolean | undefined
}

const SESSION_ID_KEY = 'sid'

/** 브라우저마다 임의 식별자를 하나 만듭니다. 사람과 연결되지 않습니다 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  try {
    const saved = sessionStorage.getItem(SESSION_ID_KEY)
    if (saved) return saved

    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`

    sessionStorage.setItem(SESSION_ID_KEY, id)
    return id
  } catch {
    return ''
  }
}

/**
 * 이벤트를 보냅니다.
 *
 * 실패해도 조용히 넘어갑니다. 계측이 서비스 이용을 막으면 안 됩니다.
 * 화면 전환 중에도 유실되지 않도록 sendBeacon을 먼저 씁니다.
 */
export function track(name: EventName, props: EventProps = {}): void {
  if (typeof window === 'undefined') return

  const body = JSON.stringify({
    name,
    sessionId: getSessionId(),
    props,
  })

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon('/api/event', blob)) return
    }

    void fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // 계측 실패는 무시합니다
  }
}
