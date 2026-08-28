/**
 * 대화 원가 상한 (FIX_4 [3]-2)
 *
 * 턴 수가 아니라 누적 원가로 제한합니다. 질문 길이에 따라 턴당 원가가
 * 두 배 넘게 차이 나므로, 턴 수로 자르면 짧게 물은 사람이 손해를 보고
 * 길게 문 사람이 상한을 넘깁니다.
 *
 * 사용자에게 원가를 숫자로 보여주지 않습니다. "합격이의 기운" 게이지로만
 * 표시합니다. 남은 금액을 원 단위로 보여주면 대화가 아니라 계량기가 됩니다.
 */

/**
 * 100만 토큰당 단가 (달러).
 *
 * FIX_4 [3]-2가 준 계산식의 계수 2와 10입니다.
 *   cost = (inputTokens * 2 + outputTokens * 10) / 1_000_000 * 1400
 */
export const INPUT_USD_PER_MTOK = 2
export const OUTPUT_USD_PER_MTOK = 10

/** 환율. 실제 청구 통화가 아니라 원가 감을 잡기 위한 환산값입니다 */
export const USD_KRW = 1400

/** 대화 하나의 누적 원가 상한 (원) */
export const CHAT_COST_LIMIT = 250

/**
 * 최소 보장 턴 수 (FIX_4 [3]-2).
 *
 * 긴 질문을 하면 3턴에서 상한에 닿습니다. 그러면 "왜 벌써 끝나?"가 됩니다.
 * 상한을 넘겨도 4턴까지는 답합니다.
 */
export const MIN_TURNS = 4

/** 한 턴의 원가 (원) */
export function turnCost(inputTokens: number, outputTokens: number): number {
  return (
    ((inputTokens * INPUT_USD_PER_MTOK + outputTokens * OUTPUT_USD_PER_MTOK) /
      1_000_000) *
    USD_KRW
  )
}

export interface ChatState {
  totalCost: number
  turnCount: number
}

/**
 * 게이지에 쓸 남은 정도 (0~1).
 *
 * 원가로 계산하되, 최소 보장 턴이 남아 있으면 그만큼은 채워 둡니다.
 * 아직 답할 수 있는데 게이지가 비어 있으면 사용자가 먼저 나갑니다.
 */
export function remainingRatio(state: ChatState): number {
  const byCost = 1 - state.totalCost / CHAT_COST_LIMIT
  const byTurn = (MIN_TURNS - state.turnCount) / MIN_TURNS
  return Math.max(0, Math.min(1, Math.max(byCost, byTurn)))
}

/** 더 답할 수 있는지. 상한을 넘겼어도 최소 턴은 채웁니다 */
export function isExhausted(state: ChatState): boolean {
  return state.totalCost >= CHAT_COST_LIMIT && state.turnCount >= MIN_TURNS
}
