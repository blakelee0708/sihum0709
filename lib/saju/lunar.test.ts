/**
 * 음력 → 양력 변환 (FIX_3 [3]-2)
 */

import { describe, expect, it } from 'vitest'

import { formatLunarDate, hasLeapMonth, lunarToSolar } from './lunar'

describe('음력 변환', () => {
  it('평달을 양력으로 바꾼다', () => {
    // 라이브러리 README의 검증 예시
    expect(lunarToSolar({ year: 1956, month: 1, day: 21, isLeapMonth: false })).toBe(
      '1956-03-03'
    )
  })

  it('윤달을 양력으로 바꾼다', () => {
    // 2017년 음력 5월은 윤달이 있습니다
    expect(lunarToSolar({ year: 2017, month: 5, day: 1, isLeapMonth: true })).toBe(
      '2017-06-24'
    )
    // 같은 날짜라도 평달이면 다른 양력입니다
    expect(lunarToSolar({ year: 2017, month: 5, day: 1, isLeapMonth: false })).toBe(
      '2017-05-26'
    )
  })

  it('없는 윤달을 요청하면 null이다', () => {
    expect(lunarToSolar({ year: 2017, month: 3, day: 1, isLeapMonth: true })).toBeNull()
  })

  it('윤달 유무를 알려준다', () => {
    expect(hasLeapMonth(2017, 5)).toBe(true)
    expect(hasLeapMonth(2017, 3)).toBe(false)
  })

  it('음력 원본을 YYYY-MM-DD로 만든다', () => {
    expect(formatLunarDate({ year: 1990, month: 4, day: 5, isLeapMonth: false })).toBe(
      '1990-04-05'
    )
  })
})
