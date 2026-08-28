/**
 * 막대 최소 높이 (FIX_3 [9]-1)
 */

import { describe, expect, it } from 'vitest'

import { barHeight } from './WeekFlowBars'

describe('막대 높이', () => {
  it('표시 축 40~95를 25~100%로 옮긴다 (FIX_4 [1])', () => {
    expect(barHeight(40)).toBe(25)
    expect(barHeight(95)).toBe(100)
  })

  it('낮은 점수도 막대로 보일 높이를 갖는다', () => {
    // 60px 차트에서 최저점이어도 15px는 나옵니다
    expect(barHeight(40) * 0.6).toBeGreaterThan(12)
  })

  it('높낮이 차이는 그대로 남는다', () => {
    expect(barHeight(86)).toBeGreaterThan(barHeight(61))
  })

  it('범위를 벗어난 값은 잘라낸다', () => {
    expect(barHeight(-10)).toBe(25)
    expect(barHeight(140)).toBe(100)
  })
})
