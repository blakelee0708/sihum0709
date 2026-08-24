/**
 * 만세력 계산 검증 (PRD 17장)
 *
 * 아래 EXPECTED 값은 계산의 두 입력을 공개 자료와 대조해 확인한 뒤 고정한
 * 기준값입니다.
 *
 *   1. 절기 시각 — 2024 / 2025 / 2026년 절입 12개씩 총 36개가
 *      공표 절기표와 분 단위까지 전부 일치합니다.
 *   2. 일주 기준일 — PRD 4.1.2가 준 1900-01-01 갑술 기준으로 계산한
 *      1969-01-25가 경자일, 1969-02-22가 무진일로 나오며,
 *      두 날짜 모두 공개된 1969년 간지 목록과 일치합니다.
 *
 * 따라서 이 값들은 "지금 동작을 그대로 박제한 것"이 아니라 외부 자료로
 * 검증된 입력에서 나온 결과입니다. 계산 로직을 건드렸을 때 값이 틀어지면
 * 이 테스트가 잡아냅니다.
 *
 * 다만 명리 해석 관점의 최종 확인은 받지 않았습니다. 전문가 검토에서
 * 다른 값이 나오면 이 표를 고치시면 됩니다.
 * 사례별 상세는 test/saju-output.md 에 있습니다.
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
 * 사례별 기대값.
 *
 * 항목을 지우면(undefined) 그 항목만 검사를 건너뜁니다.
 * 전문가 검토에서 다른 값이 나오면 해당 줄만 고치시면 됩니다.
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
  1: { year: '을사', month: '기축', day: '무신', hour: '무오', strong: '토', weak: '수' },
  2: { year: '병오', month: '경인', day: '기유', hour: '정묘', strong: '목', weak: '수' },
  3: { year: '병오', month: '경인', day: '기유', hour: '정묘', strong: '목', weak: '수' },
  4: { year: '을사', month: '기축', day: '기유', hour: '정묘', strong: '토', weak: '수' },
  5: { year: '병오', month: '경인', day: '기유', hour: '정묘', strong: '목', weak: '수' },
  6: { year: '을해', month: '임오', day: '정축', hour: '신해', strong: '화', weak: '금' },
  7: { year: '을해', month: '임오', day: '정축', hour: '신해', strong: '화', weak: '금' },
  8: { year: '무진', month: '무오', day: '신축', hour: '을미', strong: '토', weak: '수' },
  9: { year: '경오', month: '신사', day: '경진', hour: null, strong: '금', weak: '목' },
  10: { year: '무신', month: '을축', day: '무자', hour: null, strong: '토', weak: '화' },
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
          if (exp.year === undefined) return // 값을 비워두면 그 항목만 건너뜁니다
          expect(saju.year.name).toBe(exp.year)
        })
        it('월주', () => {
          if (exp.month === undefined) return // 값을 비워두면 그 항목만 건너뜁니다
          expect(saju.month.name).toBe(exp.month)
        })
        it('일주', () => {
          if (exp.day === undefined) return // 값을 비워두면 그 항목만 건너뜁니다
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
        if (exp.year === undefined) return // 값을 비워두면 그 항목만 건너뜁니다
        expect(saju.year.name).toBe(exp.year)
      })
      it('월주', () => {
        if (exp.month === undefined) return // 값을 비워두면 그 항목만 건너뜁니다
        expect(saju.month.name).toBe(exp.month)
      })
      it('일주', () => {
        if (exp.day === undefined) return // 값을 비워두면 그 항목만 건너뜁니다
        expect(saju.day.name).toBe(exp.day)
      })
      it('시주', () => {
        if (exp.hour === undefined) return // 값을 비워두면 그 항목만 건너뜁니다
        expect(saju.hour?.name ?? null).toBe(exp.hour)
      })
      it('강한 오행', () => {
        if (exp.strong === undefined) return // 값을 비워두면 그 항목만 건너뜁니다
        expect(profile.strong).toBe(exp.strong)
      })
      it('약한 오행', () => {
        if (exp.weak === undefined) return // 값을 비워두면 그 항목만 건너뜁니다
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

  it('조각에 고정된 조사를 받침에 맞게 고친다', () => {
    // 조각 원문이 "{exam}은"이어도 받침 없는 시험명이면 "는"이 되어야 합니다
    expect(render('{exam}은 어렵습니다.', { exam: '9급 공채' })).toBe(
      '9급 공채는 어렵습니다.'
    )
    expect(render('{exam}은 어렵습니다.', { exam: '정보처리기사' })).toBe(
      '정보처리기사는 어렵습니다.'
    )
    expect(render('{exam}은 어렵습니다.', { exam: '수능' })).toBe(
      '수능은 어렵습니다.'
    )
    expect(render('{exam}을 봅니다.', { exam: '토익' })).toBe('토익을 봅니다.')
    expect(render('{exam}을 봅니다.', { exam: '오픽' })).toBe('오픽을 봅니다.')
  })

  it('시각 표기의 조사도 맞춘다', () => {
    // "오후 2시 30분는"이 나오면 안 됩니다
    expect(render('{startTime}는 사시입니다.', { startTime: '오후 2시 30분' })).toBe(
      '오후 2시 30분은 사시입니다.'
    )
    expect(render('{startTime}는 사시입니다.', { startTime: '오전 10시' })).toBe(
      '오전 10시는 사시입니다.'
    )
  })

  it('관형어 뒤 호명은 "분"으로 남긴다', () => {
    expect(render('금 기운이 얕은 {name}님은 선택지를 비교합니다.', {})).toBe(
      '금 기운이 얕은 분은 선택지를 비교합니다.'
    )
    expect(render('화 기운이 강한 {name}님은 몰입도가 높습니다.', {})).toBe(
      '화 기운이 강한 분은 몰입도가 높습니다.'
    )
    expect(render('수 기운이 얕은 {name}님에게는 정리가 필요합니다.', {})).toBe(
      '수 기운이 얕은 분에게는 정리가 필요합니다.'
    )
  })

  it('연결어미 뒤 호명은 그냥 지운다', () => {
    expect(render('정리하면 {name}님은 준비량이 관건입니다.', {})).toBe(
      '정리하면 준비량이 관건입니다.'
    )
  })

  it('이름이 있으면 관형어 뒤에도 이름이 들어간다', () => {
    expect(render('금 기운이 얕은 {name}님은 선택지를 비교합니다.', { name: '김민준' })).toBe(
      '금 기운이 얕은 김민준님은 선택지를 비교합니다.'
    )
  })

  it('님 뒤의 조사는 건드리지 않는다', () => {
    expect(render('{name}님은 갑목입니다.', { name: '이서아' })).toBe(
      '이서아님은 갑목입니다.'
    )
  })
})
