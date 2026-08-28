/**
 * 결과 대기 문구 (FIX_4 [2]-2)
 */

import { describe, expect, it } from 'vitest'

import { buildWaitMessages, WAIT_CLOSING, WAIT_OPENING } from './waiting'
import { RESULT_WAIT_FIRST_MS, RESULT_WAIT_SEEN_MS } from '../motion'

describe('buildWaitMessages', () => {
  it('첫 방문 5초는 네 칸이고 가운데가 응원 문구다', () => {
    const m = buildWaitMessages(RESULT_WAIT_FIRST_MS, 0)
    expect(m).toHaveLength(4)
    expect(m[0]).toBe(WAIT_OPENING)
    expect(m[3]).toBe(WAIT_CLOSING)
    expect(m[1]).not.toBe(m[2])
  })

  it('재방문 2초는 진행 문구 두 칸만 나온다', () => {
    const m = buildWaitMessages(RESULT_WAIT_SEEN_MS, 0)
    expect(m).toEqual([WAIT_OPENING, WAIT_CLOSING])
  })

  it('seed가 같으면 같은 문구가 나온다', () => {
    expect(buildWaitMessages(5000, 3)).toEqual(buildWaitMessages(5000, 3))
  })

  it('아무리 짧아도 두 칸은 나온다', () => {
    expect(buildWaitMessages(0, 0)).toHaveLength(2)
  })
})
