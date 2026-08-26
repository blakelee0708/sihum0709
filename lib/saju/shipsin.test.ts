/**
 * 십신 · 시간대 · 잠재력 발휘 지수 검증 (PRD 5.6, 8.6, 8.7)
 */

import { describe, expect, it } from 'vitest'

import { calculateSaju } from './calculate'
import { getElementProfile } from './elements'
import { getPotentialScore, getTimeSlots } from './fortune'
import {
  SHIPSIN_KEYS,
  getShipsin,
  getShipsinProfile,
  getShipsinScores,
  totalWeight,
} from './shipsin'

describe('십신 판정 (PRD 5.6)', () => {
  // 목생화, 화생토, 토생금, 금생수, 수생목 / 목극토, 토극수, 수극화, 화극금, 금극목
  it('일간이 목일 때 다섯 관계', () => {
    expect(getShipsin('목', '목')).toBe('비겁') // 같은 오행
    expect(getShipsin('목', '화')).toBe('식상') // 내가 생하는
    expect(getShipsin('목', '토')).toBe('재성') // 내가 극하는
    expect(getShipsin('목', '금')).toBe('관성') // 나를 극하는
    expect(getShipsin('목', '수')).toBe('인성') // 나를 생하는
  })

  it('일간이 수일 때 다섯 관계', () => {
    expect(getShipsin('수', '수')).toBe('비겁')
    expect(getShipsin('수', '목')).toBe('식상')
    expect(getShipsin('수', '화')).toBe('재성')
    expect(getShipsin('수', '토')).toBe('관성')
    expect(getShipsin('수', '금')).toBe('인성')
  })

  it('어떤 일간이든 다섯 오행이 다섯 십신에 하나씩 대응한다', () => {
    for (const day of ['목', '화', '토', '금', '수'] as const) {
      const got = (['목', '화', '토', '금', '수'] as const).map((e) =>
        getShipsin(day, e)
      )
      expect(new Set(got).size, day).toBe(5)
    }
  })
})

describe('십신 분포 (PRD 5.6)', () => {
  const saju = calculateSaju({
    birthDate: '1995-06-15',
    birthTime: '14:30',
    hasBirthTime: true,
  })
  const profile = getElementProfile(saju)

  it('오행 합계와 십신 합계가 같다', () => {
    const scores = getShipsinScores(saju.day.stemElement, profile.scores)
    const elementTotal = Object.values(profile.scores).reduce((a, n) => a + n, 0)
    const shipsinTotal = SHIPSIN_KEYS.reduce((a, k) => a + scores[k], 0)

    expect(shipsinTotal).toBe(elementTotal)
    // 5.2 가중치 합 — 시간을 알면 12입니다
    expect(elementTotal).toBe(totalWeight(true))
  })

  it('일간 오행은 비겁으로 들어간다', () => {
    const scores = getShipsinScores(saju.day.stemElement, profile.scores)
    expect(scores.비겁).toBe(profile.scores[saju.day.stemElement])
  })

  it('시간을 모르면 가중치 합이 8이다', () => {
    const noTime = calculateSaju({
      birthDate: '1995-06-15',
      birthTime: null,
      hasBirthTime: false,
    })
    const p = getElementProfile(noTime)
    const total = Object.values(p.scores).reduce((a, n) => a + n, 0)
    expect(total).toBe(totalWeight(false))
  })

  it('위치는 천간·지지·없음·과다 중 하나다', () => {
    const { position } = getShipsinProfile(saju, profile.scores)
    for (const k of SHIPSIN_KEYS) {
      expect(
        ['천간과 지지', '천간에만', '지지에만', '없음', '과다'],
        `${k}=${position[k]}`
      ).toContain(position[k])
    }
  })

  it('점수가 0이면 없음이다', () => {
    const { scores, position } = getShipsinProfile(saju, profile.scores)
    for (const k of SHIPSIN_KEYS) {
      if (scores[k] === 0) expect(position[k], k).toBe('없음')
    }
  })
})

describe('12지지 시간대 (PRD 8.6)', () => {
  it('시작 시각을 모르면 빈 배열이다', () => {
    expect(getTimeSlots('화', null)).toEqual([])
  })

  it('기상부터 시작 이후까지 이어진 구간을 만든다', () => {
    const slots = getTimeSlots('화', '10:00')

    // 07:00 기상 → 진시부터. 사시(09-10)가 시작 구간이고 뒤로 두 칸 더
    expect(slots.length).toBeGreaterThanOrEqual(4)
    expect(slots[0].branch).toBe('진시')
    expect(slots.map((s) => s.branch)).toContain('사시')

    // 구간이 끊기지 않고 이어집니다
    const order = ['진시', '사시', '오시', '미시']
    expect(slots.map((s) => s.branch)).toEqual(order)
  })

  it('각 구간에 지지 오행과 십신 관계가 미리 판정돼 있다', () => {
    const slots = getTimeSlots('화', '10:00')
    const sa = slots.find((s) => s.branch === '사시')!

    expect(sa.hanja).toBe('巳時')
    expect(sa.element).toBe('화')
    // 일간이 화이고 사시도 화이므로 비겁
    expect(sa.relation).toBe('비겁')
    expect(sa.range).toBe('09:00-10:59')
  })

  it('자시가 23시부터 시작한다', () => {
    const slots = getTimeSlots('수', '00:30')
    const ja = slots.find((s) => s.branch === '자시')!
    expect(ja.range).toBe('23:00-00:59')
    expect(ja.element).toBe('수')
  })
})

describe('잠재력 발휘 지수 (PRD 8.7)', () => {
  it('기본 100에서 관계별로 가감한다', () => {
    // 100 + 10(상생) + 8(상생) + (81-70)/5 = 120.2 → 120으로 잘립니다
    expect(
      getPotentialScore({
        examDayRelation: '상생',
        startTimeRelation: '상생',
        methodFitScore: 81,
      })
    ).toBe(120)

    // 100 + 5(비화) + 4(비화) + (70-70)/5 = 109
    expect(
      getPotentialScore({
        examDayRelation: '비화',
        startTimeRelation: '비화',
        methodFitScore: 70,
      })
    ).toBe(109)
  })

  it('70에서 120으로 자른다', () => {
    const low = getPotentialScore({
      examDayRelation: '상극',
      startTimeRelation: '상극',
      methodFitScore: 58,
    })
    expect(low).toBeGreaterThanOrEqual(70)
    expect(low).toBeLessThanOrEqual(120)

    for (const fit of [58, 60, 70, 85]) {
      for (const rel of ['상생', '비화', '아극', '설기', '상극'] as const) {
        const n = getPotentialScore({
          examDayRelation: rel,
          startTimeRelation: rel,
          methodFitScore: fit,
        })
        expect(n).toBeGreaterThanOrEqual(70)
        expect(n).toBeLessThanOrEqual(120)
      }
    }
  })

  it('시작 시각을 모르면 그 항목만 빠진다', () => {
    const withTime = getPotentialScore({
      examDayRelation: '상생',
      startTimeRelation: '비화',
      methodFitScore: 70,
    })
    const without = getPotentialScore({
      examDayRelation: '상생',
      startTimeRelation: null,
      methodFitScore: 70,
    })
    expect(withTime - without).toBe(4)
  })

  it('당일 운과 다른 축이다', () => {
    // 당일 운이 낮아도 발휘 지수는 높을 수 있습니다 (PRD 8.7 예시)
    const n = getPotentialScore({
      examDayRelation: '설기',
      startTimeRelation: '상생',
      methodFitScore: 85,
    })
    expect(n).toBeGreaterThan(100)
  })
})
