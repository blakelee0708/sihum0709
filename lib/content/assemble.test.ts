/**
 * 조각 조립 검증 (README 조립 규칙, PRD 3.2 ~ 3.8)
 *
 * 조각 개수와 키가 README 표와 맞는지, 조립 결과에 미치환 변수가
 * 남지 않는지 확인합니다.
 */

import { describe, expect, it } from 'vitest'

import { F, P, PRESET_CATEGORIES } from './fragments'
import { buildFreeResult, type UserInput } from './assemble'
import {
  COMMON_SCRIPTS,
  GENERATING_SCRIPTS,
  INTERVIEW_SCRIPTS,
  PAID_SCRIPTS,
  SCRIPT_COUNT,
} from './chat-scripts'
import { TYPE_BADGES } from './characters'
import { ELEMENTS, WORK_TYPES, COMPANY_SCALES } from '../saju/constants'

const METHODS = ['필기', '면접', '실기'] as const
const RELATIONS = ['상생', '비화', '아극', '설기', '상극'] as const

function countLeaf(v: unknown): number {
  if (typeof v === 'string') return 1
  if (Array.isArray(v)) return v.reduce<number>((a, x) => a + countLeaf(x), 0)
  if (v && typeof v === 'object')
    return Object.values(v).reduce<number>((a, x) => a + countLeaf(x), 0)
  return 0
}

describe('문장 조각 개수 (README)', () => {
  const expected: Record<string, number> = {
    speechBubble: 5,
    typeDescription: 5,
    dayStem: 10,
    strongElement: 5,
    weakElement: 5,
    dayRelation: 5,
    verdict: 5,
    methodIntro: 21,
    methodByStrong: 15,
    methodByWeak: 15,
    workTypeByStrong: 20,
    companyScale: 6,
    luckyNumberByWeak: 5,
    numberUseByMethod: 3,
    luckyColorByWeak: 5,
    outfitByMethod: 3,
    eveByStrong: 5,
    eveByWeak: 5,
    eveByMethod: 3,
    flowLabel: 6,
    startTimeByRelation: 15,
  }

  for (const [key, n] of Object.entries(expected)) {
    it(`${key} ${n}개`, () => {
      expect(countLeaf((F as unknown as Record<string, unknown>)[key])).toBe(n)
    })
  }

  it('무료 합계 167개', () => {
    expect(countLeaf(F)).toBe(167)
  })

  it('유료 합계 10개', () => {
    expect(countLeaf(P)).toBe(10)
  })
})

describe('조각 키 (README)', () => {
  it('오행 5종 키가 모두 있다', () => {
    for (const key of ['typeDescription', 'strongElement', 'weakElement', 'luckyNumberByWeak', 'luckyColorByWeak', 'eveByStrong', 'eveByWeak'] as const) {
      const obj = (F as unknown as Record<string, Record<string, string>>)[key]
      for (const e of ELEMENTS) expect(obj[e], `${key}.${e}`).toBeTruthy()
    }
  })

  it('방식 3종 × 변형 7개', () => {
    for (const m of METHODS) expect(F.methodIntro[m]).toHaveLength(7)
  })

  it('방식 3종 × 관계 5종', () => {
    for (const m of METHODS)
      for (const rel of RELATIONS)
        expect(F.startTimeByRelation[m][rel], `${m}.${rel}`).toBeTruthy()
  })

  it('일의 성격 4종 × 오행 5종', () => {
    for (const w of WORK_TYPES)
      for (const e of ELEMENTS)
        expect(F.workTypeByStrong[w][e], `${w}.${e}`).toBeTruthy()
  })

  it('기업 규모 6종', () => {
    for (const s of COMPANY_SCALES) expect(F.companyScale[s], s).toBeTruthy()
  })

  it('유료 조각 키', () => {
    for (const rel of RELATIONS) expect(P.compatibility[rel], rel).toBeTruthy()
    for (const e of ELEMENTS) expect(P.positionByStrong[e], e).toBeTruthy()
  })
})

describe('프리셋 시험 (PRD 14.7)', () => {
  it('대분류 8개', () => {
    expect(PRESET_CATEGORIES).toHaveLength(8)
  })

  it('시험명 52개', () => {
    const n = PRESET_CATEGORIES.reduce((a, c) => a + c.exams.length, 0)
    expect(n).toBe(52)
  })

  it('기타 분류는 freeInputOnly', () => {
    const etc = PRESET_CATEGORIES.find((c) => c.id === 'etc')
    expect(etc?.freeInputOnly).toBe(true)
  })
})

describe('대화 문구 (PRD 21.10)', () => {
  it('총 27개', () => {
    expect(SCRIPT_COUNT).toBe(27)
  })

  it('공통 10 / 면접 6 / 유료 3 / 생성 중 8', () => {
    expect(Object.keys(COMMON_SCRIPTS)).toHaveLength(10)
    expect(Object.keys(INTERVIEW_SCRIPTS)).toHaveLength(6)
    expect(Object.keys(PAID_SCRIPTS)).toHaveLength(3)
    expect(GENERATING_SCRIPTS.필기.length + GENERATING_SCRIPTS.면접.length).toBe(8)
  })

  it('말풍선은 두 줄을 넘기지 않는다', () => {
    for (const s of Object.values(COMMON_SCRIPTS)) expect(s.length).toBeLessThanOrEqual(2)
    for (const s of Object.values(INTERVIEW_SCRIPTS)) expect(s.length).toBeLessThanOrEqual(2)
    for (const s of Object.values(PAID_SCRIPTS)) expect(s.length).toBeLessThanOrEqual(2)
  })
})

describe('유형 뱃지 (PRD 7.3)', () => {
  it('오행 5종 정의', () => {
    expect(Object.keys(TYPE_BADGES)).toHaveLength(5)
  })

  it('PRD 표의 색상과 유형명이 일치한다', () => {
    expect(TYPE_BADGES.목).toMatchObject({ name: '흡수형', color: '#4CAF7D' })
    expect(TYPE_BADGES.화).toMatchObject({ name: '몰입형', color: '#E5533D' })
    expect(TYPE_BADGES.토).toMatchObject({ name: '지구력형', color: '#C9A227' })
    expect(TYPE_BADGES.금).toMatchObject({ name: '정리형', color: '#8E9AAF' })
    expect(TYPE_BADGES.수).toMatchObject({ name: '응용형', color: '#3D5AE5' })
  })
})

// ─── 조립 결과 ───

const BASE: UserInput = {
  name: '김민준',
  examName: '국가직 9급 공무원',
  examType: '필기',
  examDate: '2026-09-12',
  startTime: '10:00',
  birthDate: '1995-06-15',
  birthTime: '14:30',
  hasBirthTime: true,
}

const TODAY = new Date(2026, 7, 24) // 고정해서 결정론을 확인합니다

describe('무료 결과 조립', () => {
  it('필기는 카드 8개가 나온다', () => {
    const r = buildFreeResult(BASE, TODAY)
    expect(r.cards).toHaveLength(8)
    expect(r.cards.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('시작 시간을 모르면 카드 8을 빼고 7개', () => {
    const r = buildFreeResult({ ...BASE, startTime: null }, TODAY)
    expect(r.cards).toHaveLength(7)
    expect(r.startTime).toBeNull()
  })

  it('면접 카드 2는 조각 4개', () => {
    const r = buildFreeResult(
      {
        ...BASE,
        examType: '면접',
        examName: '대기업 1차 면접',
        companyScale: '대기업',
        workType: '분석하고만드는일',
        jobTitle: '반도체 공정기술',
      },
      TODAY
    )
    const card2 = r.cards.find((c) => c.id === 2)!
    expect(card2.paragraphs).toHaveLength(4)
  })

  it('미치환 변수가 남지 않는다', () => {
    for (const type of METHODS) {
      const r = buildFreeResult(
        {
          ...BASE,
          examType: type,
          companyScale: '대기업',
          workType: '분석하고만드는일',
          jobTitle: '반도체 공정기술',
        },
        TODAY
      )
      for (const c of r.cards)
        for (const p of c.paragraphs)
          expect(p, `${type} 카드${c.id}`).not.toMatch(/\{[a-zA-Z]+\}/)
    }
  })

  it('이름이 없으면 호명이 사라지고 님이 남지 않는다', () => {
    const r = buildFreeResult({ ...BASE, name: null }, TODAY)
    for (const c of r.cards) {
      expect(c.title).not.toContain('님')
      for (const p of c.paragraphs) expect(p).not.toMatch(/^님/)
    }
  })

  it('같은 입력에는 같은 결과가 나온다 (PRD 3.1 결정론)', () => {
    const a = buildFreeResult(BASE, TODAY)
    const b = buildFreeResult(BASE, TODAY)
    expect(JSON.stringify(a.cards)).toBe(JSON.stringify(b.cards))
    expect(a.examDayScore).toBe(b.examDayScore)
  })

  it('7일 흐름은 8일치(D-7 ~ D-0)이고 라벨이 붙는다', () => {
    const r = buildFreeResult(BASE, TODAY)
    expect(r.weekFlow).toHaveLength(8)
    expect(r.weekFlow[0].dday).toBe(7)
    expect(r.weekFlow[7].dday).toBe(0)
    for (const d of r.weekFlow) expect(d.label).toBeTruthy()
  })

  it('점수는 0-100 범위 안에 있다', () => {
    const r = buildFreeResult(BASE, TODAY)
    expect(r.examDayScore).toBeGreaterThanOrEqual(0)
    expect(r.examDayScore).toBeLessThanOrEqual(100)
    expect(r.todayScore).toBeGreaterThanOrEqual(0)
    expect(r.todayScore).toBeLessThanOrEqual(100)
    for (const d of r.weekFlow) {
      expect(d.score).toBeGreaterThanOrEqual(0)
      expect(d.score).toBeLessThanOrEqual(100)
    }
  })

  it('면접이면 말풍선의 시험이 면접으로 바뀐다 (PRD 21.7)', () => {
    const r = buildFreeResult({ ...BASE, examType: '면접' }, TODAY)
    expect(r.speechBubble).not.toContain('시험')
  })

  it('태어난 시간을 모르면 안내를 노출한다 (PRD 4.3.3)', () => {
    const r = buildFreeResult(
      { ...BASE, birthTime: null, hasBirthTime: false },
      TODAY
    )
    expect(r.showBirthTimeNotice).toBe(true)
    expect(r.saju.hour).toBeNull()
  })

  it('카드 제목이 방식에 따라 바뀐다 (PRD 3.3)', () => {
    const written = buildFreeResult(BASE, TODAY)
    const interview = buildFreeResult({ ...BASE, examType: '면접' }, TODAY)

    expect(written.cards.find((c) => c.id === 2)!.title).toBe('시험장에서 주의할 점')
    expect(interview.cards.find((c) => c.id === 2)!.title).toBe('면접장에서 주의할 점')
    expect(written.cards.find((c) => c.id === 4)!.title).toBe('시험일에 뭘 입고 갈까?')
    expect(interview.cards.find((c) => c.id === 4)!.title).toBe('면접일에 뭘 입고 갈까?')
    expect(written.cards.find((c) => c.id === 6)!.title).toBe('시험 전 7일 기운 흐름')
    expect(interview.cards.find((c) => c.id === 6)!.title).toBe('면접 전 7일 기운 흐름')
  })
})
