/**
 * 막대 최소 높이 (FIX_3 [9]-1)
 */

import { describe, expect, it } from 'vitest'

import { barHeight } from './WeekFlowBars'

describe('막대 높이', () => {
  it('0~100 점수를 25~100%로 옮긴다', () => {
    expect(barHeight(0)).toBe(25)
    expect(barHeight(100)).toBe(100)
  })

  it('낮은 점수도 막대로 보일 높이를 갖는다', () => {
    // 60px 차트에서 20점이면 예전에는 12px, 지금은 24px입니다
    expect(barHeight(20) * 0.6).toBeGreaterThan(20)
  })

  it('높낮이 차이는 그대로 남는다', () => {
    expect(barHeight(84)).toBeGreaterThan(barHeight(38))
  })

  it('범위를 벗어난 값은 잘라낸다', () => {
    expect(barHeight(-10)).toBe(25)
    expect(barHeight(140)).toBe(100)
  })
})
