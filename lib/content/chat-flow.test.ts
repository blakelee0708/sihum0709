/**
 * 대화 흐름 검증 (PRD 14.7, 14.8)
 */

import { describe, expect, it } from 'vitest'

import {
  formatAnswer,
  getSteps,
  inferType,
  isComplete,
  normalizeExamName,
  resetFrom,
  toUserInput,
  type Answers,
  type StepId,
} from './chat-flow'

function ids(answers: Answers): StepId[] {
  return getSteps(answers).map((s) => s.id)
}

describe('필기 흐름 (PRD 14.7)', () => {
  it('대분류만 고르면 시험명까지 나온다', () => {
    expect(ids({ category: 'gov' })).toEqual(['category', 'examName'])
  })

  it('defaultType이 있으면 방식 질문을 건너뛴다', () => {
    const a: Answers = { category: 'gov', examName: '9급 공채' }
    expect(ids(a)).toEqual(['category', 'examName', 'examDate'])
  })

  it('끝까지 채우면 done이 나온다', () => {
    const a: Answers = {
      category: 'gov',
      examName: '9급 공채',
      examDate: '2026-09-12',
      startTime: '10:00',
      birthDate: '1995-06-15',
      birthTime: '14:30',
      name: '김민준',
    }
    expect(ids(a)).toEqual([
      'category',
      'examName',
      'examDate',
      'startTime',
      'birthDate',
      'birthTime',
      'name',
      'done',
    ])
    expect(isComplete(a)).toBe(true)
  })

  it('건너뛴 값(null)도 답변으로 인정한다', () => {
    const a: Answers = {
      category: 'gov',
      examName: '9급 공채',
      examDate: '2026-09-12',
      startTime: null,
      birthDate: '1995-06-15',
      birthTime: null,
      name: null,
    }
    expect(isComplete(a)).toBe(true)
  })
})

describe('면접 흐름 (PRD 14.7)', () => {
  const base: Answers = {
    category: 'corp-interview',
    examName: '대기업 1차 면접',
  }

  it('기업 규모 → 일의 성격 → 직무명 순으로 묻는다', () => {
    expect(ids(base)).toEqual(['category', 'examName', 'companyScale'])
    expect(ids({ ...base, companyScale: '대기업' })).toContain('workType')
    expect(
      ids({ ...base, companyScale: '대기업', workType: '분석하고만드는일' })
    ).toContain('jobTitle')
  })

  it('면접도 시험명을 받는다 (methodIntro 조각이 {exam}을 쓴다)', () => {
    expect(ids({ category: 'corp-interview' })).toContain('examName')
  })

  it('끝까지 채우면 done이 나온다', () => {
    const a: Answers = {
      ...base,
      companyScale: '대기업',
      workType: '분석하고만드는일',
      jobTitle: '반도체 공정기술',
      examDate: '2026-09-12',
      startTime: '14:30',
      birthDate: '1995-06-15',
      birthTime: '14:30',
      name: '김민준',
    }
    expect(isComplete(a)).toBe(true)
    expect(toUserInput(a).examType).toBe('면접')
  })
})

describe('기타 분류', () => {
  it('freeInputOnly면 시험명이 자유 입력이다', () => {
    const steps = getSteps({ category: 'etc' })
    expect(steps[1].widget).toBe('text')
  })

  it('defaultType이 없으면 방식을 묻는다', () => {
    const a: Answers = { category: 'etc', examName: '사내 승진 시험' }
    expect(ids(a)).toEqual(['category', 'examName', 'examType'])
  })

  it('방식을 고르면 그다음으로 넘어간다', () => {
    const a: Answers = {
      category: 'etc',
      examName: '사내 승진 시험',
      examType: '실기',
    }
    expect(ids(a)).toContain('examDate')
  })
})

describe('답변 수정 (PRD 14.6)', () => {
  it('되돌아간 단계 이후 답변이 초기화된다', () => {
    const a: Answers = {
      category: 'gov',
      examName: '9급 공채',
      examDate: '2026-09-12',
      startTime: '10:00',
      birthDate: '1995-06-15',
    }
    const next = resetFrom(a, 'examDate')
    expect(next.category).toBe('gov')
    expect(next.examName).toBe('9급 공채')
    expect(next.examDate).toBeUndefined()
    expect(next.startTime).toBeUndefined()
    expect(next.birthDate).toBeUndefined()
  })
})

describe('답변 표시 (PRD 14.6)', () => {
  const a: Answers = {
    category: 'gov',
    examName: '9급 공채',
    examDate: '2026-09-12',
    startTime: null,
    birthDate: '1995-06-15',
    birthTime: null,
    name: null,
  }
  const steps = getSteps(a)
  const byId = (id: StepId) => steps.find((s) => s.id === id)!

  it('대분류는 라벨로 보여준다', () => {
    expect(formatAnswer(byId('category'), a)).toBe('공무원 · 고시')
  })

  it('날짜는 한국어 표기로 보여준다', () => {
    expect(formatAnswer(byId('examDate'), a)).toBe('2026년 9월 12일')
  })

  it('건너뛴 항목은 건너뛴 문구로 보여준다', () => {
    expect(formatAnswer(byId('startTime'), a)).toBe('아직 몰라요')
    expect(formatAnswer(byId('birthTime'), a)).toBe('모르겠어요')
    expect(formatAnswer(byId('name'), a)).toBe('괜찮아요')
  })
})

describe('완료 문구 (PRD 21.10)', () => {
  it('이름이 있으면 이름을 넣는다', () => {
    const a: Answers = {
      category: 'gov',
      examName: '9급 공채',
      examDate: '2026-09-12',
      startTime: '10:00',
      birthDate: '1995-06-15',
      birthTime: '14:30',
      name: '김민준',
    }
    const done = getSteps(a).find((s) => s.id === 'done')!
    expect(done.question.join(' ')).toContain('김민준님')
  })

  it('이름을 건너뛰면 호명이 빠진다', () => {
    const a: Answers = {
      category: 'gov',
      examName: '9급 공채',
      examDate: '2026-09-12',
      startTime: '10:00',
      birthDate: '1995-06-15',
      birthTime: '14:30',
      name: null,
    }
    const done = getSteps(a).find((s) => s.id === 'done')!
    expect(done.question).toEqual(['다 됐어요!', '결과를 보여드릴게요.'])
  })

  it('면접은 전용 완료 문구를 쓴다', () => {
    const a: Answers = {
      category: 'corp-interview',
      examName: '대기업 1차 면접',
      companyScale: '대기업',
      workType: '분석하고만드는일',
      jobTitle: null,
      examDate: '2026-09-12',
      startTime: '14:30',
      birthDate: '1995-06-15',
      birthTime: '14:30',
      name: '김민준',
    }
    const done = getSteps(a).find((s) => s.id === 'done')!
    expect(done.question).toEqual(['다 됐어요!', '면접운을 보여드릴게요.'])
  })
})

describe('결과 입력 변환', () => {
  it('태어난 시간을 모르면 hasBirthTime이 false다', () => {
    const a: Answers = {
      category: 'gov',
      examName: '9급 공채',
      examDate: '2026-09-12',
      startTime: '10:00',
      birthDate: '1995-06-15',
      birthTime: null,
      name: null,
    }
    expect(toUserInput(a).hasBirthTime).toBe(false)
  })

  it('defaultType이 examType으로 들어간다', () => {
    const a: Answers = { category: 'gov', examName: '9급 공채' }
    expect(toUserInput(a).examType).toBe('필기')
  })
})

describe('선택지 배치 (PRD 21.11)', () => {
  it('대분류 8개는 2열 대상이다 (6개 초과)', () => {
    const steps = getSteps({})
    expect(steps[0].options!.length).toBeGreaterThan(6)
  })

  it('기업 규모는 6개라 1열이다', () => {
    const steps = getSteps({
      category: 'corp-interview',
      examName: '대기업 1차 면접',
    })
    const scale = steps.find((s) => s.id === 'companyScale')!
    expect(scale.options).toHaveLength(6)
  })
})

describe('대분류 10개와 방식 4분류 (PRD 10.1 ~ 10.4)', () => {
  it('자격증 · 어학은 하위 그룹을 먼저 묻는다', () => {
    const steps = getSteps({ category: 'cert-lang' })
    expect(steps[steps.length - 1].id).toBe('subGroup')
    expect(steps[steps.length - 1].options?.map((o) => o.label)).toEqual([
      '자격증',
      '어학',
    ])
  })

  it('하위 그룹을 고르면 그 그룹의 시험명만 나온다', () => {
    const steps = getSteps({ category: 'cert-lang', subGroup: 'lang' })
    const examStep = steps.find((s) => s.id === 'examName')!
    expect(examStep.options?.map((o) => o.value)).toContain('토익')
    expect(examStep.options?.map((o) => o.value)).not.toContain('정보처리기사')
  })

  it('하위 그룹이 없는 대분류는 바로 시험명을 묻는다', () => {
    const steps = getSteps({ category: 'gov' })
    expect(steps.map((s) => s.id)).not.toContain('subGroup')
    expect(steps[steps.length - 1].id).toBe('examName')
  })

  it('대학교 시험만 시험 기간을 묻는다', () => {
    const school = getSteps({ category: 'school', examName: '대학 중간고사' })
    expect(school[school.length - 1].id).toBe('examPeriod')
    expect(school[school.length - 1].options?.map((o) => o.value)).toEqual([
      '하루',
      '2~3일',
      '4~7일',
      '일주일 이상',
    ])

    const gov = getSteps({ category: 'gov', examName: '9급 공채' })
    expect(gov.map((s) => s.id)).not.toContain('examPeriod')
  })

  it('시험명에서 방식을 추론한다 (PRD 10.2)', () => {
    expect(inferType('승진 면접', null)).toBe('면접')
    expect(inferType('보컬 오디션', '오디션')).toBe('오디션')
    expect(inferType('미술 실기', '오디션')).toBe('실기')
    expect(inferType('9급 공채', '필기')).toBe('필기')
    // 어학은 전부 필기입니다
    expect(inferType('토익 스피킹', '필기')).toBe('필기')
    // 추론도 못 하고 기본값도 없으면 물어야 합니다
    expect(inferType('사내 자격시험', null)).toBeNull()
  })

  it('방식을 추론하지 못하면 4개 버튼으로 묻는다', () => {
    const steps = getSteps({ category: 'promo', examName: '사내 자격시험' })
    const typeStep = steps[steps.length - 1]
    expect(typeStep.id).toBe('examType')
    expect(typeStep.options?.map((o) => o.value)).toEqual([
      '필기',
      '면접',
      '실기',
      '오디션',
    ])
  })

  it('시험명이 방식을 말해주면 묻지 않는다', () => {
    const steps = getSteps({ category: 'promo', examName: '승진 면접' })
    expect(steps.map((s) => s.id)).not.toContain('examType')
    // 면접이므로 기업 규모로 넘어갑니다
    expect(steps[steps.length - 1].id).toBe('companyScale')
  })

  it('시험명을 정규화한다 (PRD 10.3)', () => {
    expect(normalizeExamName('  국가직   9급  ')).toBe('국가직 9급')
    expect(normalizeExamName('토익(TOEIC)')).toBe('토익TOEIC')
    expect(normalizeExamName('컴활（1급）')).toBe('컴활1급')
  })

  it('오디션도 결과 입력으로 넘어간다', () => {
    const input = toUserInput({
      category: 'audition',
      examName: '보컬 오디션',
      examDate: '2027-03-15',
      startTime: null,
      birthDate: '1995-06-15',
      birthTime: null,
      name: null,
    })
    expect(input.examType).toBe('오디션')
  })

  it('대학교 시험 기간이 입력으로 넘어간다', () => {
    const input = toUserInput({
      category: 'school',
      examName: '대학 기말고사',
      examPeriod: '2~3일',
      examDate: '2027-06-15',
      startTime: null,
      birthDate: '1995-06-15',
      birthTime: null,
      name: null,
    })
    expect(input.examPeriod).toBe('2~3일')
  })
})

describe('하위 그룹 문구 (PRD 10.3)', () => {
  it('하위 그룹을 고르면 그 이름으로 물어본다', () => {
    const lang = getSteps({ category: 'cert-lang', subGroup: 'lang' })
    const step = lang.find((s) => s.id === 'examName')!
    expect(step.question[0]).toBe('어학시군요!')

    const cert = getSteps({ category: 'cert-lang', subGroup: 'cert' })
    expect(cert.find((s) => s.id === 'examName')!.question[0]).toBe('자격증시군요!')
  })

  it('하위 그룹이 없으면 대분류 앞부분을 쓴다', () => {
    const gov = getSteps({ category: 'gov' })
    expect(gov.find((s) => s.id === 'examName')!.question[0]).toBe('공무원시군요!')
  })
})
