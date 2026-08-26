/**
 * 리포트 생성 파이프라인 검증 (PRD 8장)
 *
 * API 키 없이 목업 모드로 돌려 구성과 재료가 제대로 만들어지는지 확인합니다.
 * 외부 호출은 일어나지 않습니다.
 */

import { describe, expect, it } from 'vitest'

import { runPipeline } from './pipeline'
import { buildMaterial, getHoursUntilStart } from './prompt'
import { getReportSpec } from './spec'
import { buildFreeResult, type UserInput } from '../content/assemble'

const WRITTEN: UserInput = {
  name: '김민준',
  examName: '국가직 9급 공무원',
  examType: '필기',
  examDate: '2027-03-15',
  startTime: '10:00',
  birthDate: '1995-06-15',
  birthTime: '14:30',
  hasBirthTime: true,
}

const INTERVIEW: UserInput = {
  name: '이서아',
  examName: '대기업 1차 면접',
  examType: '면접',
  examDate: '2027-03-15',
  startTime: '14:30',
  birthDate: '1998-03-22',
  birthTime: '09:10',
  hasBirthTime: true,
  companyScale: '대기업',
  workType: '분석하고만드는일',
  jobTitle: '반도체 공정기술',
}

describe('파이프라인 (목업 모드)', () => {
  it('필기 리포트를 만든다', async () => {
    const out = await runPipeline({ userInput: WRITTEN })

    expect(out.reportType).toBe('필기')
    expect(out.generated.mock).toBe(true)
    expect(out.spec.sections.length).toBeGreaterThan(0)

    // 계산 섹션을 뺀 나머지가 모두 채워져야 합니다
    for (const s of out.spec.sections) {
      if (s.source === 'calc') continue
      expect(out.generated.content[s.key], s.key).toBeTruthy()
    }
  })

  it('면접은 기업명이 있어도 설립일을 못 찾으면 위치 섹션으로 바뀐다', async () => {
    const out = await runPipeline({ userInput: INTERVIEW, companyName: '삼성전자' })

    expect(out.reportType).toBe('면접')
    // 검색 미연동이라 설립일이 확인되지 않습니다. 추측하지 않습니다 (PRD 8.7)
    expect(out.foundedDate).toBeNull()
    expect(out.compatibility).toBeNull()

    const compat = out.spec.sections.find((s) => s.key === 'compatibility')!
    expect(compat.title).toBe('이 조직에서 나의 위치')
  })

  it('필기는 검색하지 않는다 (PRD 8.12)', async () => {
    const written = await runPipeline({ userInput: WRITTEN })
    expect(written.searchLogs).toHaveLength(0)
    expect(written.searchCredits).toBe(0)
  })

  it('면접만 검색 2회를 쓴다 (PRD 8.12, 22.14)', async () => {
    const interview = await runPipeline({
      userInput: INTERVIEW,
      companyName: '삼성전자',
    })
    expect(interview.searchLogs).toHaveLength(2)
    expect(interview.searchLogs.every((l) => l.queryType === 'company')).toBe(true)
  })

  it('실기는 유료 상품을 만들지 않는다 (PRD 8.2)', async () => {
    await expect(
      runPipeline({ userInput: { ...WRITTEN, examType: '실기' } })
    ).rejects.toThrow()
  })
})

describe('프롬프트 재료 (PRD 8.15)', () => {
  const result = buildFreeResult(WRITTEN, new Date(2027, 0, 10))
  const spec = getReportSpec('필기', 'normal', 2027)
  const material = buildMaterial({ result, spec })

  it('PRD 8.15의 구조를 따른다', () => {
    expect(material.reportType).toBe('필기')
    expect(material.ddayRange).toBe('normal')
    expect(material.sectionSpec).toEqual(spec.sections.map((s) => s.key))
    expect(material.user.dayStem).toBeTruthy()
    expect(Object.keys(material.user.elements)).toHaveLength(5)
    expect(material.fortune.weekFlow).toHaveLength(8)
    expect(material.fortune.monthFlow).toHaveLength(12)
    expect(Object.keys(material.fortune.methodFit)).toHaveLength(4)
  })

  it('계산된 값만 담고 문장은 담지 않는다', () => {
    // AI는 문장만 생성하며 숫자와 판정을 만들지 않습니다
    expect(typeof material.fortune.examDayScore).toBe('number')
    expect(material.fortune.examDayScore).toBeGreaterThanOrEqual(0)
    expect(material.fortune.examDayScore).toBeLessThanOrEqual(100)
  })

  it('면접에서 설립일이 없으면 대체 조각이 들어간다 (PRD 8.7)', () => {
    const r = buildFreeResult(INTERVIEW, new Date(2027, 0, 10))
    const s = getReportSpec('면접', 'normal', 2027)
    const m = buildMaterial({ result: r, spec: s })

    expect(m.fragments.position).toBeTruthy()
    expect(m.fragments.compatibility).toBeUndefined()
  })
})

describe('D-DAY 구성과 시각 재료 (PRD 8.8, 8.16)', () => {
  const now = new Date(2027, 2, 15, 7, 30) // 시험 당일 아침 7시 30분

  it('남은 시간을 시간 단위로 넣는다', () => {
    // 07:30 → 10:00 은 2.5시간
    expect(getHoursUntilStart('2027-03-15', '10:00', now)).toBe(2.5)
  })

  it('시작 시각이 지났으면 음수다', () => {
    const after = new Date(2027, 2, 15, 12, 0)
    expect(getHoursUntilStart('2027-03-15', '10:00', after)).toBe(-2)
  })

  it('시작 시각을 모르면 null이다', () => {
    expect(getHoursUntilStart('2027-03-15', null, now)).toBeNull()
  })

  it('재료에 현재 시각과 남은 시간이 들어간다', () => {
    const result = buildFreeResult(WRITTEN, now)
    const spec = getReportSpec('필기', 'dday', 2027)
    const m = buildMaterial({ result, spec, now })

    expect(m.exam.now).toBe('2027-03-15T07:30:00+09:00')
    expect(m.exam.hoursUntilStart).toBe(2.5)
    expect(m.ddayRange).toBe('dday')
  })

  it('시간을 모르면 timeSlots가 비고 startTimeRelation이 없다', () => {
    const noTime: UserInput = { ...WRITTEN, startTime: null }
    const result = buildFreeResult(noTime, now)
    const spec = getReportSpec('필기', 'normal', 2027, { hasStartTime: false })
    const m = buildMaterial({ result, spec, now })

    expect(m.timeSlots).toEqual([])
    expect(m.fortune.startTimeRelation).toBeNull()
  })

  it('십신과 발휘 지수가 재료에 들어간다 (PRD 5.6, 8.7)', () => {
    const result = buildFreeResult(WRITTEN, now)
    const spec = getReportSpec('필기', 'normal', 2027)
    const m = buildMaterial({ result, spec, now })

    expect(Object.keys(m.user.shipsin)).toHaveLength(5)
    expect(Object.keys(m.user.shipsinPosition)).toHaveLength(5)
    expect(m.fortune.potentialScore).toBeGreaterThanOrEqual(70)
    expect(m.fortune.potentialScore).toBeLessThanOrEqual(120)
    expect(m.fragments.shipsin).toBeTruthy()
    expect(m.fragments.pattern).toBeTruthy()
  })

  it('필기 재료에 과목 검색 결과가 없다 (PRD 8.12)', () => {
    const result = buildFreeResult(WRITTEN, now)
    const spec = getReportSpec('필기', 'normal', 2027)
    const m = buildMaterial({ result, spec, now })

    expect(m.search).toEqual({})
  })
})
