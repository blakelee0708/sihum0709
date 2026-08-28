/**
 * 추천 질문 (FIX_4 [3]-3, [3]-4, [3]-5)
 */

import { describe, expect, it } from 'vitest'

import {
  FREE_INPUT_ID,
  getChatQuestions,
  remainingQuestions,
} from './chat-questions'

describe('추천 질문', () => {
  it('추천 6개와 직접 입력 1개가 나온다', () => {
    const q = getChatQuestions('필기', 30)
    expect(q).toHaveLength(7)
    expect(q[6].id).toBe(FREE_INPUT_ID)
  })

  it('7일 플랜 질문은 넣지 않는다', () => {
    for (const type of ['필기', '면접'] as const) {
      for (const label of getChatQuestions(type, 10).map((q) => q.label)) {
        expect(label).not.toContain('7일')
      }
    }
  })

  it('D-day 구간에 따라 필기 3번이 바뀐다', () => {
    const at = (dday: number) => getChatQuestions('필기', dday)[2].label
    expect(at(30)).toBe('남은 기간 뭐부터 해야 할까?')
    expect(at(5)).toBe('지금 뭘 버려야 할까?')
    expect(at(1)).toBe('오늘 밤 뭘 하면 좋을까?')
    expect(at(0)).toBe('지금 당장 뭘 하면 좋을까?')
  })

  it('시험 당일에는 5번이 시험 이후로 바뀐다', () => {
    expect(getChatQuestions('필기', 0)[4].label).toBe('시험 끝나고 뭘 하면 좋을까?')
    expect(getChatQuestions('필기', 3)[4].label).toBe('다음 시험은 언제가 좋을까?')
  })

  it('면접은 D-day로 바뀌지 않는다', () => {
    expect(getChatQuestions('면접', 0).map((q) => q.label)).toEqual(
      getChatQuestions('면접', 30).map((q) => q.label)
    )
  })

  it('이미 물어본 항목은 빠지고 직접 입력은 남는다', () => {
    const all = getChatQuestions('필기', 30)
    const left = remainingQuestions(all, ['w1', 'w3'])
    expect(left.map((q) => q.id)).toEqual(['w2', 'w4', 'w5', 'w6', FREE_INPUT_ID])
  })
})
