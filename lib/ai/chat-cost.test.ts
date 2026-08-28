/**
 * 대화 원가 상한 (FIX_4 [3]-2)
 */

import { describe, expect, it } from 'vitest'

import {
  CHAT_COST_LIMIT,
  MIN_TURNS,
  isExhausted,
  remainingRatio,
  turnCost,
} from './chat-cost'

describe('turnCost', () => {
  it('지시받은 계산식 그대로다', () => {
    // (1000 * 2 + 500 * 10) / 1_000_000 * 1400
    expect(turnCost(1000, 500)).toBeCloseTo(9.8, 6)
  })

  it('턴당 40~50원 수준이다 (FIX_4 [3]-11)', () => {
    // 리포트 전문이 실린 입력 12,000토큰 + 답변 400토큰
    const cost = turnCost(12_000, 400)
    expect(cost).toBeGreaterThan(30)
    expect(cost).toBeLessThan(60)
  })
})

describe('게이지와 소진', () => {
  it('처음에는 가득 차 있다', () => {
    expect(remainingRatio({ totalCost: 0, turnCount: 0 })).toBe(1)
  })

  it('원가가 쌓이면 줄어든다', () => {
    const half = remainingRatio({ totalCost: CHAT_COST_LIMIT / 2, turnCount: 5 })
    expect(half).toBeCloseTo(0.5, 6)
  })

  it('상한을 넘겨도 최소 4턴은 답한다', () => {
    const over = { totalCost: CHAT_COST_LIMIT + 100, turnCount: 3 }
    expect(isExhausted(over)).toBe(false)
    // 아직 답할 수 있는데 게이지가 비어 있으면 사용자가 먼저 나갑니다
    expect(remainingRatio(over)).toBeGreaterThan(0)
  })

  it('4턴을 채우고 상한을 넘기면 끝난다', () => {
    const done = { totalCost: CHAT_COST_LIMIT, turnCount: MIN_TURNS }
    expect(isExhausted(done)).toBe(true)
    expect(remainingRatio(done)).toBe(0)
  })

  it('턴이 많아도 원가가 남아 있으면 계속된다', () => {
    expect(isExhausted({ totalCost: 100, turnCount: 9 })).toBe(false)
  })
})
