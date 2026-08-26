/**
 * 좀비 레코드 판별 검증 (PRD 14.12)
 */

import { describe, expect, it } from 'vitest'

import { ZOMBIE_AFTER_MS, isZombie } from './run-report'

const NOW = new Date('2026-08-26T12:00:00+09:00')

function ago(ms: number): string {
  return new Date(NOW.getTime() - ms).toISOString()
}

describe('좀비 판별 (PRD 14.12)', () => {
  it('상한은 10분이다', () => {
    expect(ZOMBIE_AFTER_MS).toBe(10 * 60 * 1000)
  })

  it('10분 안이면 아직 만드는 중으로 본다', () => {
    expect(isZombie(ago(30_000), null, NOW)).toBe(false)
    expect(isZombie(ago(9 * 60_000), null, NOW)).toBe(false)
  })

  it('10분을 넘기면 좀비로 본다', () => {
    expect(isZombie(ago(11 * 60_000), null, NOW)).toBe(true)
  })

  it('started_at이 없으면 created_at으로 본다', () => {
    // 005 이전에 만들어진 행은 started_at이 비어 있습니다
    expect(isZombie(null, ago(11 * 60_000), NOW)).toBe(true)
    expect(isZombie(null, ago(60_000), NOW)).toBe(false)
  })

  it('둘 다 없으면 판단하지 않는다', () => {
    // 근거가 없는데 실패로 돌리면 정상 생성 중인 건을 죽입니다
    expect(isZombie(null, null, NOW)).toBe(false)
  })

  it('클라이언트 타임아웃보다 넉넉하다', () => {
    // 클라이언트는 240초에 재시도 화면을 띄우지만, 서버는 계속 만들고 있을
    // 수 있습니다. 좀비 판정은 그보다 한참 뒤여야 합니다.
    expect(ZOMBIE_AFTER_MS).toBeGreaterThan(240_000)
  })
})
