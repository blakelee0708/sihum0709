/**
 * 조각 조립 검증 (PRD 3.2 ~ 3.10, 3.7 조각 개수 표)
 *
 * 조각 개수와 키가 PRD 3.7, 8.18 표와 맞는지, 조립 결과에 미치환 변수가
 * 남지 않는지 확인합니다.
 */

import { describe, expect, it } from 'vitest'

import { F, P, PRESET_CATEGORIES } from './fragments'
import { buildFreeResult, type UserInput } from './assemble'
import {
  COMMON_SCRIPTS,
  GENERATING_INTERVAL_SEC,
  GENERATING_NOTICE,
  GENERATING_STEPS,
  GENERATING_TIMEOUT_MS,
  generatingSpanSec,
  fillGenerating,
  INTERVIEW_SCRIPTS,
  PAID_SCRIPTS,
  SCRIPT_COUNT,
} from './chat-scripts'
import { TYPE_BADGES } from './characters'
import { ELEMENTS, WORK_TYPES, COMPANY_SCALES } from '../saju/constants'

const METHODS = ['필기', '면접', '실기', '오디션'] as const
const RELATIONS = ['상생', '비화', '아극', '설기', '상극'] as const

function countLeaf(v: unknown): number {
  if (typeof v === 'string') return 1
  if (Array.isArray(v)) return v.reduce<number>((a, x) => a + countLeaf(x), 0)
  if (v && typeof v === 'object')
    return Object.values(v).reduce<number>((a, x) => a + countLeaf(x), 0)
  return 0
}

describe('문장 조각 개수 (PRD 3.7, 8.18)', () => {
  const expected: Record<string, number> = {
    speechBubble: 5,
    typeDescription: 5,
    dayStem: 10,
    strongElement: 5,
    weakElement: 5,
    dayRelation: 5,
    verdict: 5,
    elementSummary: 5,
    weekFlowSummary: 6,
    flowLabel: 6,
    startTimeByRelation: 20,
    methodIntro: 28,
    methodByStrong: 20,
    methodByWeak: 20,
    workTypeByStrong: 20,
    companyScale: 6,
    luckyNumberByWeak: 5,
    numberUseByMethod: 4,
    avoidColorByStrong: 5,
    eveByStrong: 5,
    eveByWeak: 5,
    eveByMethod: 4,
    lockTeaser: 4,
    luckyColorByWeak: 5,
    outfitByMethod: 4,
    directionByWeak: 5,
    timeSlotByWeak: 5,
  }

  for (const [key, n] of Object.entries(expected)) {
    it(`${key} ${n}개`, () => {
      expect(countLeaf((F as unknown as Record<string, unknown>)[key])).toBe(n)
    })
  }

  it('PRD 3.7 표의 항목을 빠짐없이 센다', () => {
    // 표에 없는 키가 생기면 합계가 어긋나므로 여기서 걸립니다
    const listed = Object.values(expected).reduce((a, n) => a + n, 0)
    expect(listed).toBe(222)
  })

  it('무료 합계 222개', () => {
    expect(countLeaf(F)).toBe(222)
  })

  it('유료 합계 25개', () => {
    expect(countLeaf(P)).toBe(25)
  })

  it('유료 신규 조각 — 십신 10, 반복 패턴 5', () => {
    expect(countLeaf(P.shipsinByDayStem)).toBe(10)
    expect(countLeaf(P.patternByStrong)).toBe(5)
  })
})

describe('조각 키 (README)', () => {
  it('오행 5종 키가 모두 있다', () => {
    for (const key of ['typeDescription', 'strongElement', 'weakElement', 'luckyNumberByWeak', 'luckyColorByWeak', 'eveByStrong', 'eveByWeak'] as const) {
      const obj = (F as unknown as Record<string, Record<string, string>>)[key]
      for (const e of ELEMENTS) expect(obj[e], `${key}.${e}`).toBeTruthy()
    }
  })

  it('방식 4종 × 변형 7개', () => {
    for (const m of METHODS) expect(F.methodIntro[m]).toHaveLength(7)
  })

  it('방식 4종 × 관계 5종', () => {
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

  it('오디션 조각이 방식별 항목에 모두 있다 (PRD 8.2)', () => {
    for (const key of [
      'methodByStrong',
      'methodByWeak',
    ] as const) {
      for (const e of ELEMENTS) expect(F[key]['오디션'][e], `${key}.${e}`).toBeTruthy()
    }
    for (const key of ['numberUseByMethod', 'outfitByMethod', 'eveByMethod'] as const) {
      expect(F[key]['오디션'], key).toBeTruthy()
    }
  })

  it('유료 조각 키', () => {
    for (const rel of RELATIONS) expect(P.compatibility[rel], rel).toBeTruthy()
    for (const e of ELEMENTS) expect(P.positionByStrong[e], e).toBeTruthy()
    for (const e of ELEMENTS) expect(P.patternByStrong[e], e).toBeTruthy()
    for (const stem of Object.keys(F.dayStem))
      expect(P.shipsinByDayStem[stem], stem).toBeTruthy()
  })
})

describe('프리셋 시험 (PRD 10.1, 10.3)', () => {
  it('대분류 10개', () => {
    expect(PRESET_CATEGORIES).toHaveLength(10)
  })

  it('시험명 73개', () => {
    const n = PRESET_CATEGORIES.reduce(
      (a, c) =>
        a +
        (c.exams?.length ?? 0) +
        (c.subGroups?.reduce((b, g) => b + g.exams.length, 0) ?? 0),
      0
    )
    expect(n).toBe(73)
  })

  it('기타 분류는 freeInputOnly', () => {
    const etc = PRESET_CATEGORIES.find((c) => c.id === 'etc')
    expect(etc?.freeInputOnly).toBe(true)
  })

  it('자격증 · 어학은 하위 그룹 2개를 가진다 (PRD 10.3)', () => {
    const c = PRESET_CATEGORIES.find((x) => x.id === 'cert-lang')
    expect(c?.subGroups?.map((g) => g.id)).toEqual(['cert', 'lang'])
    // 하위 그룹이 있으면 상위에 exams를 두지 않습니다
    expect(c?.exams).toBeUndefined()
  })

  it('대학교 시험만 시험 기간을 묻는다 (PRD 10.4)', () => {
    const withPeriod = PRESET_CATEGORIES.filter((c) => c.hasExamPeriod)
    expect(withPeriod.map((c) => c.id)).toEqual(['school'])
  })

  it('오디션 · 실기 분류의 기본 방식은 오디션이다 (PRD 10.2)', () => {
    const c = PRESET_CATEGORIES.find((x) => x.id === 'audition')
    expect(c?.defaultType).toBe('오디션')
  })
})

describe('대화 문구 (PRD 21.11)', () => {
  it('총 39개', () => {
    expect(SCRIPT_COUNT).toBe(39)
  })

  it('공통 12 / 면접 6 / 유료 3 / 생성 중 18', () => {
    expect(Object.keys(COMMON_SCRIPTS)).toHaveLength(12)
    expect(Object.keys(INTERVIEW_SCRIPTS)).toHaveLength(6)
    expect(Object.keys(PAID_SCRIPTS)).toHaveLength(3)
    expect(GENERATING_STEPS.필기.length + GENERATING_STEPS.면접.length).toBe(18)
  })

  it('한 질문에 말풍선 세 개를 넘기지 않는다', () => {
    // 배열의 원소 하나가 말풍선 하나입니다. 넷을 넘기면 답하기까지
    // 기다리는 시간이 길어집니다. 첫 인사만 세 개를 씁니다.
    for (const s of Object.values(COMMON_SCRIPTS)) expect(s.length).toBeLessThanOrEqual(3)
    for (const s of Object.values(INTERVIEW_SCRIPTS)) expect(s.length).toBeLessThanOrEqual(3)
    for (const s of Object.values(PAID_SCRIPTS)) expect(s.length).toBeLessThanOrEqual(3)
  })

  it('한 말풍선은 두 줄을 넘기지 않는다', () => {
    for (const script of [
      ...Object.values(COMMON_SCRIPTS),
      ...Object.values(INTERVIEW_SCRIPTS),
      ...Object.values(PAID_SCRIPTS),
    ]) {
      for (const bubble of script) {
        expect(bubble.split('\n').length, bubble).toBeLessThanOrEqual(2)
      }
    }
  })
})

describe('생성 중 대기 화면 (PRD 14.11, 21.11)', () => {
  it('두 종류 다 문구가 9개다', () => {
    for (const type of ['필기', '면접'] as const) {
      expect(GENERATING_STEPS[type]).toHaveLength(9)
    }
  })

  it('간격이 실측 소요에 맞는다 — 필기 18초, 면접 20초', () => {
    expect(GENERATING_INTERVAL_SEC.필기).toBe(18)
    expect(GENERATING_INTERVAL_SEC.면접).toBe(20)

    // 실측 소요는 필기 144초, 면접 173초입니다 (effort medium)
    expect(generatingSpanSec('필기')).toBe(144)
    expect(generatingSpanSec('면접')).toBe(160)
  })

  it('명식은 2번, 오행 분포는 3번 문구에 붙는다', () => {
    for (const type of ['필기', '면접'] as const) {
      const steps = GENERATING_STEPS[type]
      expect(steps.findIndex((s) => s.card === 'saju')).toBe(1)
      expect(steps.findIndex((s) => s.card === 'elements')).toBe(2)
    }
  })

  it('명식과 오행 분포가 초반 40초 안에 나온다', () => {
    for (const type of ['필기', '면접'] as const) {
      const interval = GENERATING_INTERVAL_SEC[type]
      // 2번 문구는 1×간격, 3번은 2×간격 시점입니다
      expect(interval * 1).toBeLessThanOrEqual(20)
      expect(interval * 2).toBeLessThanOrEqual(40)
    }
  })

  it('타임아웃이 PRD 14.11의 240초이고 마지막 문구보다 넉넉하다', () => {
    expect(GENERATING_TIMEOUT_MS).toBe(240_000)
    for (const type of ['필기', '면접'] as const) {
      expect(GENERATING_TIMEOUT_MS / 1000).toBeGreaterThan(generatingSpanSec(type))
    }
  })

  it('필기 7번 문구가 검색 제거를 반영한다 (PRD 8.12, 21.11)', () => {
    expect(GENERATING_STEPS.필기[6].text).toBe('남은 기간 배분을 계산하는 중이에요')
    // 과목 검색을 없앴으므로 과목이라는 말을 쓰지 않습니다
    expect(GENERATING_STEPS.필기.some((s) => s.text.includes('과목'))).toBe(false)
  })

  it('나가도 된다는 안내가 있다 (PRD 14.12)', () => {
    for (const type of ['필기', '면접'] as const) {
      const notice = GENERATING_NOTICE[type]
      expect(notice).toHaveLength(2)
      // 이 문구가 없으면 나가면 결제 금액을 잃는다고 생각해 억지로 기다립니다
      expect(notice[1]).toContain('닫으셔도')
    }
  })

  it('자리표시자를 남기지 않는다', () => {
    const vars = {
      name: '김민준',
      examDate: '9월 12일',
      exam: '국가직 9급',
      company: '삼성전자',
      jobTitle: '반도체 공정기술',
    }

    for (const type of ['필기', '면접'] as const) {
      for (const step of GENERATING_STEPS[type]) {
        expect(fillGenerating(step.text, vars)).not.toMatch(/[{}]/)
        // 값이 하나도 없어도 자리표시자가 그대로 노출되면 안 됩니다
        expect(fillGenerating(step.text, {})).not.toMatch(/[{}]/)
      }
    }
  })

  it('이름을 건너뛰면 조사까지 지운다', () => {
    expect(fillGenerating('{name}님 명식이 나왔어요', {})).toBe('명식이 나왔어요')
    expect(fillGenerating('{name}님과의 궁합을 보고 있어요', {})).toBe('궁합을 보고 있어요')
    expect(fillGenerating('{name}님 명식이 나왔어요', { name: '김민준' })).toBe(
      '김민준님 명식이 나왔어요'
    )
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

  it('면접 카드 6은 조각 3개 (PRD 3.6, 10.8)', () => {
    const r = buildFreeResult(
      {
        ...BASE,
        examType: '면접',
        examName: '대기업 1차 면접',
        // 기업 규모를 넣어도 조립에 쓰이지 않습니다 (PRD 10.8)
        companyScale: '대기업',
        workType: '분석하고만드는일',
        jobTitle: '영업관리',
      },
      TODAY
    )
    const card6 = r.cards.find((c) => c.id === 6)!
    expect(card6.paragraphs).toHaveLength(3)
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

  it('카드 제목이 방식에 따라 바뀐다 (PRD 3.5)', () => {
    const written = buildFreeResult(BASE, TODAY)
    const interview = buildFreeResult({ ...BASE, examType: '면접' }, TODAY)
    const audition = buildFreeResult({ ...BASE, examType: '오디션' }, TODAY)

    const title = (r: ReturnType<typeof buildFreeResult>, id: number) =>
      r.cards.find((c) => c.id === id)!.title

    expect(title(written, 3)).toBe('시험 전 7일 기운 흐름')
    expect(title(interview, 3)).toBe('면접 전 7일 기운 흐름')
    expect(title(audition, 3)).toBe('오디션 전 7일 기운 흐름')

    expect(title(written, 6)).toBe('시험장에서 주의할 점')
    expect(title(interview, 6)).toBe('면접장에서 주의할 점')
    expect(title(audition, 6)).toBe('심사장에서 주의할 점')

    expect(title(written, 8)).toBe('시험 전날 밤에는')
    expect(title(audition, 8)).toBe('오디션 전날 밤에는')

    // 카드 1의 날짜 표현은 방식과 무관하게 같습니다
    expect(title(written, 1)).toBe(title(interview, 1))
  })

  it('카드 순서가 차별화 우선이다 (PRD 3.2, 3.3)', () => {
    const r = buildFreeResult(BASE, TODAY)
    expect(r.cards.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(r.cards.map((c) => c.kind)).toEqual([
      'text', 'saju', 'weekFlow', 'text', 'methodFit', 'text', 'text', 'text',
    ])
  })

  it('부분 잠금이 카드 2, 3, 4, 7에만 걸린다 (PRD 3.4)', () => {
    const r = buildFreeResult(BASE, TODAY)
    const locked = r.cards.filter((c) => c.lock).map((c) => c.id)
    expect(locked).toEqual([2, 3, 4, 7])

    // 제목만 있으면 무엇인지 모르므로 설명이 함께 있어야 합니다
    for (const c of r.cards.filter((x) => x.lock)) {
      expect(c.lock!.title, String(c.id)).toBeTruthy()
      expect(c.lock!.teaser.length, String(c.id)).toBeGreaterThan(20)
      expect(c.lock!.teaser).not.toMatch(/[{}]/)
    }
  })

  it('시작 시각을 모르면 카드 4가 빠지고 잠금도 셋이 된다 (PRD 6.5)', () => {
    const r = buildFreeResult({ ...BASE, startTime: null }, TODAY)
    expect(r.cards.map((c) => c.id)).not.toContain(4)
    expect(r.cards.filter((c) => c.lock).map((c) => c.id)).toEqual([2, 3, 7])
  })

  it('카드 7은 피해야 할 색을 강한 오행으로 고른다 (PRD 3.4)', () => {
    const r = buildFreeResult(BASE, TODAY)
    const card7 = r.cards.find((c) => c.id === 7)!
    expect(card7.paragraphs).toHaveLength(3)
    expect(card7.paragraphs[2]).toBe(F.avoidColorByStrong[r.profile.strong])
  })

  it('카드 2는 강한 오행의 요약을 쓴다 (PRD 3.6)', () => {
    const r = buildFreeResult(BASE, TODAY)
    const card2 = r.cards.find((c) => c.id === 2)!
    expect(card2.paragraphs[0]).toBe(F.elementSummary[r.profile.strong])
  })
})

describe('카드 4 제목의 조사 (PRD 3.5)', () => {
  const at = (time: string) =>
    buildFreeResult({ ...BASE, startTime: time }, TODAY).cards.find((c) => c.id === 4)!
      .title

  it('받침 없는 시각은 "는"을 붙인다', () => {
    expect(at('10:00')).toBe('오전 10시는 맞는 시간일까')
  })

  it('받침 있는 시각은 "은"을 붙인다', () => {
    expect(at('14:30')).toBe('오후 2시 30분은 맞는 시간일까')
  })
})
