/**
 * 결과 대기 문구 (FIX_4 [2]-2)
 *
 * 계산은 즉시 끝나지만 5초(재방문 2초)를 기다립니다. 그 시간에 볼 것이
 * 있어야 기다림이 아니라 콘텐츠가 됩니다.
 *
 *   0.0s  사주를 보고 있어요
 *   1.5s  "떨리는 건 진심이라는 뜻입니다"
 *   3.0s  "오늘도 늦게까지 앉아 있던 당신"
 *   4.5s  거의 다 됐어요
 *
 * 처음과 끝은 진행 상태, 가운데는 응원 문구입니다. 진행만 있으면 지루하고
 * 응원만 있으면 뭘 하는 중인지 모릅니다.
 */

import { QUOTES } from './fragments'
import { WAIT_MESSAGE_INTERVAL_MS } from '../motion'

export const WAIT_OPENING = '사주를 보고 있어요'
export const WAIT_CLOSING = '거의 다 됐어요'

/**
 * 대기 시간을 문구 목록으로 나눕니다.
 *
 * 첫 칸은 진행, 마지막 칸은 마무리, 사이는 응원 문구입니다. 2초처럼
 * 짧으면 응원 문구 없이 두 칸만 나옵니다.
 *
 * seed를 주면 같은 입력에 같은 문구가 나옵니다. 대기 화면은 결과 화면과
 * 달리 매번 달라도 되지만, 테스트에서 결과를 고정하려면 필요합니다.
 */
export function buildWaitMessages(waitMs: number, seed?: number): string[] {
  const slots = Math.max(2, Math.ceil(waitMs / WAIT_MESSAGE_INTERVAL_MS))
  const middle = slots - 2

  const list = QUOTES.quotes
  const start =
    seed === undefined
      ? Math.floor(Math.random() * list.length)
      : Math.abs(Math.trunc(seed)) % list.length

  const quotes: string[] = []
  for (let i = 0; i < middle; i += 1) {
    // 같은 문구가 연달아 나오지 않게 순서대로 집습니다
    quotes.push(list[(start + i) % list.length])
  }

  return [WAIT_OPENING, ...quotes, WAIT_CLOSING]
}
