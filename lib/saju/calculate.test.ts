/**
 * 만세력 계산 검증 (PRD 17장)
 *
 * ─────────────────────────────────────────────────────────────
 * 기대값이 아직 비어 있습니다.
 *
 * test/saju-output.md 에 10건의 계산 결과가 표로 정리되어 있습니다.
 * 다른 만세력 서비스와 대조한 뒤 아래 EXPECTED 표의 TODO 자리에
 * 정답을 채워 넣으시면 이 테스트가 실제 검증으로 바뀝니다.
 *
 * 값을 채우기 전까지는 "계산이 터지지 않고 형식이 맞는지"만 확인합니다.
 * ─────────────────────────────────────────────────────────────
 */

import { describe, expect, it } from 'vitest'

import {
  calculateCompanySaju,
  calculateSaju,
  getHourBranchIndex,
  parseLocalDateTime,
  adjustBirthTime,
} from './calculate'
import { getElementProfile } from './elements'
import { attachParticle, render } from './particle'
import { VERIFICATION_CASES } from './verification-cases'

/**
 * 아침에 채울 기대값.
 *
 * 각 항목은 사례 id를 키로 하며, 확인한 값만 적으면 됩니다.
 * 적지 않은 항목(undefined)은 검사를 건너뜁니다.
 *
 * 예시
 *   1: { year: '을사', month: '기축', day: '무자', hour: '무오' },
 */
type Expected = {
  year?: string
  month?: string
  day?: string
  /** 태어난 시간을 모르는 사례는 null */
  hour?: string | null
  strong?: string
  weak?: string
}

const EXPECTED: Record<number, Expected> = {
  // TODO: 입춘 직전 출생 (2026-02-03 12:00)
  1: {},
  // TODO: 입춘 당일 05:45 (PRD 명시)
  2: {},
  // TODO: 입춘 당일 05:47 (PRD 명시)
  3: {},
  // TODO: 보정 후 입춘 직전 (2026-02-04 05:31)
  4: {},
  // TODO: 보정 후 입춘 직후 (2026-02-04 05:33)
  5: {},
  // TODO: 자시 경계 22:59 (1995-06-15)
  6: {},
  // TODO: 자시 경계 23:01 (1995-06-15)
  7: {},
  // TODO: 서머타임 기간 출생 (1988-06-15 14:30)
  8: {},
  // TODO: 태어난 시간 모름 (1990-05-15)
  9: {},
  // TODO: 기업 설립일 (1969-01-13 삼성전자)
  10: {},
}

describe('PRD 17장 검증 사례 10건', () => {
  for (const c of VERIFICATION_CASES) {
    describe(`${c.id}. ${c.label}`, () => {
      if (c.isCompany) {
        const saju = calculateCompanySaju(c.birthDate)
        const exp = EXPECTED[c.id] ?? {}

        it('3기둥이 모두 계산된다', () => {
          expect(saju.year.name).toMatch(/^.{2}$/)
          expect(saju.month.name).toMatch(/^.{2}$/)
          expect(saju.day.name).toMatch(/^.{2}$/)
        })

        it('년주', () => {
          if (exp.year === undefined) return // TODO 미입력
          expect(saju.year.name).toBe(exp.year)
        })
        it('월주', () => {
          if (exp.month === undefined) return // TODO 미입력
          expect(saju.month.name).toBe(exp.month)
        })
        it('일주', () => {
          if (exp.day === undefined) return // TODO 미입력
          expect(saju.day.name).toBe(exp.day)
        })
        return
      }

      const saju = calculateSaju({
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        hasBirthTime: c.hasBirthTime,
      })
      const profile = getElementProfile(saju)
      const exp = EXPECTED[c.id] ?? {}

      it('4기둥 형식이 맞다', () => {
        expect(saju.year.name).toMatch(/^.{2}$/)
        expect(saju.month.name).toMatch(/^.{2}$/)
        expect(saju.day.name).toMatch(/^.{2}$/)
        if (c.hasBirthTime) expect(saju.hour?.name).toMatch(/^.{2}$/)
        else expect(saju.hour).toBeNull()
      })

      it('년주', () => {
        if (exp.year === undefined) return // TODO 미입력
        expect(saju.year.name).toBe(exp.year)
      })
      it('월주', () => {
        if (exp.month === undefined) return // TODO 미입력
        expect(saju.month.name).toBe(exp.month)
      })
      it('일주', () => {
        if (exp.day === undefined) return // TODO 미입력
        expect(saju.day.name).toBe(exp.day)
      })
      it('시주', () => {
        if (exp.hour === undefined) return // TODO 미입력
        expect(saju.hour?.name ?? null).toBe(exp.hour)
      })
      it('강한 오행', () => {
        if (exp.strong === undefined) return // TODO 미입력
        expect(profile.strong).toBe(exp.strong)
      })
      it('약한 오행', () => {
        if (exp.weak === undefined) return // TODO 미입력
        expect(profile.weak).toBe(exp.weak)
      })
    })
  }
})

/* ── 기대값 없이도 지금 검증할 수 있는 항목 ── */

describe('시간 보정 (PRD 4.2 0단계)', () => {
  it('평상시에는 30분을 뺀다', () => {
    const raw = parseLocalDateTime('1995-06-15', '14:30')
    const adj = adjustBirthTime(raw, true)
    expect(adj.getHours()).toBe(14)
    expect(adj.getMinutes()).toBe(0)
  })

  it('서머타임 기간에는 90분을 뺀다', () => {
    const raw = parseLocalDateTime('1988-06-15', '14:30')
    const adj = adjustBirthTime(raw, true)
    expect(adj.getHours()).toBe(13)
    expect(adj.getMinutes()).toBe(0)
  })

  it('서머타임 종료 다음 날은 30분만 뺀다', () => {
    const raw = parseLocalDateTime('1988-10-10', '14:30')
    const adj = adjustBirthTime(raw, true)
    expect(adj.getHours()).toBe(14)
    expect(adj.getMinutes()).toBe(0)
  })

  it('태어난 시간을 모르면 보정하지 않는다 (PRD 4.3.3)', () => {
    const raw = parseLocalDateTime('1988-06-15', null)
    const adj = adjustBirthTime(raw, false)
    expect(adj.getTime()).toBe(raw.getTime())
  })
})

describe('시지 구간 (PRD 4.2 4단계)', () => {
  const cases: [string, number][] = [
    ['23:00', 0], ['23:59', 0], ['00:00', 0], ['00:59', 0],
    ['01:00', 1], ['02:59', 1],
    ['03:00', 2], ['04:59', 2],
    ['05:00', 3], ['06:59', 3],
    ['07:00', 4], ['08:59', 4],
    ['09:00', 5], ['10:59', 5],
    ['11:00', 6], ['12:59', 6],
    ['13:00', 7], ['14:59', 7],
    ['15:00', 8], ['16:59', 8],
    ['17:00', 9], ['18:59', 9],
    ['19:00', 10], ['20:59', 10],
    ['21:00', 11], ['22:59', 11],
  ]

  for (const [time, expected] of cases) {
    it(`${time} → 지지 ${expected}`, () => {
      const d = parseLocalDateTime('2000-01-01', time)
      expect(getHourBranchIndex(d)).toBe(expected)
    })
  }
})

describe('일주 기준일 (PRD 4.1.2)', () => {
  it('1900-01-01은 갑술일이다', () => {
    const saju = calculateSaju({
      birthDate: '1900-01-01',
      birthTime: null,
      hasBirthTime: false,
    })
    expect(saju.day.name).toBe('갑술')
  })

  it('1936-02-12는 갑자일이다 (독립 대조용 기준일)', () => {
    const saju = calculateSaju({
      birthDate: '1936-02-12',
      birthTime: null,
      hasBirthTime: false,
    })
    expect(saju.day.name).toBe('갑자')
  })

  it('일주는 하루마다 1씩 진행한다', () => {
    const a = calculateSaju({ birthDate: '2026-08-24', birthTime: null, hasBirthTime: false })
    const b = calculateSaju({ birthDate: '2026-08-25', birthTime: null, hasBirthTime: false })
    expect((a.dayPillarIndex + 1) % 60).toBe(b.dayPillarIndex)
  })
})

describe('조사 처리 (PRD 3.8)', () => {
  it('받침 있는 한글', () => {
    expect(attachParticle('국가직', '은는')).toBe('국가직은')
    expect(attachParticle('국가직', '이가')).toBe('국가직이')
    expect(attachParticle('국가직', '을를')).toBe('국가직을')
  })

  it('받침 없는 한글', () => {
    expect(attachParticle('토익 스피커', '은는')).toBe('토익 스피커는')
    expect(attachParticle('수의사', '이가')).toBe('수의사가')
  })

  it('영문은 받침 있음으로 처리한다', () => {
    expect(attachParticle('GSAT', '은는')).toBe('GSAT은')
    expect(attachParticle('LEET', '은는')).toBe('LEET은')
  })
})

describe('변수 치환 (README render)', () => {
  it('이름이 있으면 그대로 넣는다', () => {
    expect(render('{name}님은 갑목입니다.', { name: '김민준' })).toBe(
      '김민준님은 갑목입니다.'
    )
  })

  it('이름이 없으면 호명 부분을 제거한다', () => {
    expect(render('{name}님은 갑목입니다.', {})).toBe('갑목입니다.')
  })

  it('나머지 변수를 치환한다', () => {
    expect(render('{exam}{examParticle} 어렵습니다.', { exam: 'GSAT', examParticle: '은' })).toBe(
      'GSAT은 어렵습니다.'
    )
  })
})
