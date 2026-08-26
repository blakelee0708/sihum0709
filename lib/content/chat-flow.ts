/**
 * 대화형 입력 흐름 (PRD 10.1 ~ 10.4, 14.6, 14.7)
 *
 * 자유 대화가 아니라 합격이가 안내하는 형식입니다.
 * 버튼, 달력, 시간 선택기만 제공하며 사용자가 예상 밖의 입력을 할 수 없습니다.
 *
 * 대분류 10개 중 자격증·어학만 하위 그룹을 한 번 더 묻고(10.3),
 * 대학교 시험만 시험 기간을 묻습니다(10.4).
 */

import {
  COMPANY_SCALES,
  EXAM_TYPES,
  WORK_TYPES,
  WORK_TYPE_LABEL,
  type CompanyScale,
  type ExamType,
  type WorkType,
} from '../saju/constants'
import { EXAM_PERIODS, type ExamPeriod } from './assemble'
import {
  COMMON_SCRIPTS,
  DONE_WITHOUT_NAME,
  INTERVIEW_SCRIPTS,
} from './chat-scripts'
import {
  PRESET_CATEGORIES,
  getCategory,
  getExamOptions,
  getSubGroup,
} from './fragments'

export type StepId =
  | 'category'
  | 'subGroup'
  | 'examName'
  | 'examType'
  | 'examPeriod'
  | 'companyScale'
  | 'workType'
  | 'jobTitle'
  | 'examDate'
  | 'startTime'
  | 'birthDate'
  | 'birthTime'
  | 'name'
  | 'done'

export type WidgetKind =
  | 'options'
  | 'optionsWithFreeInput'
  | 'text'
  | 'date'
  | 'time'
  | 'finish'

export interface Answers {
  category?: string
  /** 자격증 · 어학에서만 씁니다 (PRD 10.3) */
  subGroup?: string
  examName?: string
  /** 프리셋 버튼이 아니라 직접 입력한 경우의 원본 (PRD 10.3) */
  examNameRaw?: string
  examType?: ExamType
  /** 대학교 시험에서만 씁니다 (PRD 10.4) */
  examPeriod?: ExamPeriod
  companyScale?: CompanyScale
  workType?: WorkType
  /** 건너뛰면 null */
  jobTitle?: string | null
  examDate?: string
  /** 모르면 null */
  startTime?: string | null
  birthDate?: string
  /** 모르면 null */
  birthTime?: string | null
  /** 건너뛰면 null */
  name?: string | null
}

export interface StepOption {
  value: string
  label: string
}

export interface Step {
  id: StepId
  /** 합격이 말풍선 (한 줄씩) */
  question: string[]
  widget: WidgetKind
  options?: StepOption[]
  /** 텍스트 입력 자리 표시 */
  placeholder?: string
  /** 건너뛰기 버튼 문구. 없으면 건너뛸 수 없습니다 */
  skipLabel?: string
  /** 위젯을 여는 버튼에 붙는 아이콘 (PRD 14.6 위젯 표) */
  icon?: 'keyboard' | 'calendar' | 'clock'
}

/**
 * 방식 선택 질문.
 *
 * PRD 21.10에는 방식 확인 문구가 "필기 시험 맞으시죠?" 하나뿐인데,
 * 이는 defaultType이 정해진 경우의 확인 문구입니다. PRD 14.7이
 * "defaultType이 있으면 방식 질문을 건너뜁니다"라고 했으므로 확인 문구가
 * 쓰일 자리는 없고, 실제로 물어야 하는 경우(기타 분류, defaultType=null)에는
 * 쓸 문구가 없습니다. 그래서 이 한 줄만 새로 넣었습니다.
 * PROGRESS.md의 "확인이 필요한 판단"에 적어두었습니다.
 */
const EXAM_TYPE_QUESTION = ['어떤 방식으로 보세요?']

/** PRD 10.2 방식 4분류 */
const EXAM_TYPE_OPTIONS: StepOption[] = EXAM_TYPES.map((t) => ({
  value: t,
  label: t,
}))

/**
 * 시험명에서 방식을 추론합니다 (PRD 10.2).
 *
 * 대분류의 defaultType이 있어도 시험명이 방식을 말해주면 그쪽을 씁니다.
 * "승진 면접"은 승진·사내시험 분류지만 면접이고, "미술 실기"는
 * 오디션·실기 분류지만 실기입니다.
 *
 * 어학은 전부 필기로 처리합니다. 토익 스피킹이나 오픽이 말하기 시험이지만
 * 심사 성격이 오디션과 다르고 사용자도 필기로 인식하는 경우가 많습니다.
 */
export function inferType(
  examName: string,
  categoryDefault: ExamType | null
): ExamType | null {
  if (examName.includes('면접')) return '면접'
  if (examName.includes('오디션')) return '오디션'
  if (examName.includes('실기')) return '실기'
  return categoryDefault
}

/**
 * 시험명 정규화 (PRD 10.3).
 *
 * 같은 시험을 사람마다 다르게 입력합니다. 관리자 화면에서 집계해 프리셋에
 * 추가하려면 표기를 맞춰야 합니다. 원본은 examNameRaw에 따로 남깁니다.
 */
export function normalizeExamName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').replace(/[()（）]/g, '')
}

/** 현재까지의 답변으로 다음에 물어야 할 단계 목록을 만듭니다 */
export function getSteps(answers: Answers): Step[] {
  const steps: Step[] = []

  // 1. 대분류
  steps.push({
    id: 'category',
    question: [...COMMON_SCRIPTS.category],
    widget: 'options',
    options: PRESET_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
  })

  const category = answers.category ? getCategory(answers.category) : undefined
  if (!category) return steps

  // 2. 하위 그룹. 자격증 · 어학만 나옵니다 (PRD 10.3)
  if (category.subGroups) {
    steps.push({
      id: 'subGroup',
      question: [...COMMON_SCRIPTS.subGroup],
      widget: 'options',
      options: category.subGroups.map((g) => ({ value: g.id, label: g.label })),
    })
    if (!answers.subGroup) return steps
  }

  // 3. 시험명
  // 면접도 {exam} 변수를 쓰는 조각(methodIntro)이 있어 시험명을 받습니다.
  if (category.freeInputOnly) {
    steps.push({
      id: 'examName',
      question: [...COMMON_SCRIPTS.examNameFree],
      widget: 'text',
      placeholder: '예) 국가직 9급 공무원, LEET, 토익',
      icon: 'keyboard',
    })
  } else {
    steps.push({
      id: 'examName',
      question: COMMON_SCRIPTS.examName.map((s) =>
        // 하위 그룹을 골랐으면 그 이름을 씁니다. 어학을 고르고
        // "자격증시군요!"가 나오면 안 됩니다 (PRD 10.3)
        s.replace(
          '{category}',
          getSubGroup(category, answers.subGroup)?.label ??
            stripCategoryLabel(category.label)
        )
      ),
      widget: 'optionsWithFreeInput',
      options: getExamOptions(category, answers.subGroup).map((e) => ({
        value: e,
        label: e,
      })),
      placeholder: '예) 국가직 9급 공무원, LEET, 토익',
      icon: 'keyboard',
    })
  }
  if (!answers.examName) return steps

  // 4. 방식. 시험명이 방식을 말해주면 그것을, 아니면 defaultType을 씁니다 (PRD 10.2)
  const inferred = inferType(answers.examName, category.defaultType ?? null)
  const type = answers.examType ?? inferred ?? undefined
  if (!inferred) {
    steps.push({
      id: 'examType',
      question: EXAM_TYPE_QUESTION,
      widget: 'options',
      options: EXAM_TYPE_OPTIONS,
    })
    if (!answers.examType) return steps
  }
  if (!type) return steps

  const isInterview = type === '면접'

  // 5. 시험 기간. 대학교 시험만 나옵니다 (PRD 10.4)
  if (category.hasExamPeriod) {
    steps.push({
      id: 'examPeriod',
      question: [...COMMON_SCRIPTS.examPeriod],
      widget: 'options',
      options: EXAM_PERIODS.map((p) => ({ value: p, label: p })),
    })
    if (!answers.examPeriod) return steps
  }

  // 4-6. 면접 전용
  if (isInterview) {
    steps.push({
      id: 'companyScale',
      question: [...INTERVIEW_SCRIPTS.companyScale],
      widget: 'options',
      options: COMPANY_SCALES.map((s) => ({ value: s, label: s })),
    })
    if (!answers.companyScale) return steps

    steps.push({
      id: 'workType',
      question: [...INTERVIEW_SCRIPTS.workType],
      widget: 'options',
      options: WORK_TYPES.map((w) => ({ value: w, label: WORK_TYPE_LABEL[w] })),
    })
    if (!answers.workType) return steps

    steps.push({
      id: 'jobTitle',
      question: [...INTERVIEW_SCRIPTS.jobTitle],
      widget: 'text',
      placeholder: '예) 반도체 공정기술',
      skipLabel: '건너뛸게요',
      icon: 'keyboard',
    })
    if (answers.jobTitle === undefined) return steps
  }

  // 7. 시험 날짜
  steps.push({
    id: 'examDate',
    question: isInterview
      ? [...INTERVIEW_SCRIPTS.examDate]
      : [...COMMON_SCRIPTS.examDate],
    widget: 'date',
    icon: 'calendar',
  })
  if (!answers.examDate) return steps

  // 8. 시작 시간
  steps.push({
    id: 'startTime',
    question: isInterview
      ? [...INTERVIEW_SCRIPTS.startTime]
      : [...COMMON_SCRIPTS.startTime],
    widget: 'time',
    skipLabel: isInterview ? '아직 안 나왔어요' : '모르겠어요',
    icon: 'clock',
  })
  if (answers.startTime === undefined) return steps

  // 9. 생년월일
  steps.push({
    id: 'birthDate',
    question: [...COMMON_SCRIPTS.birthDate],
    widget: 'date',
    icon: 'calendar',
  })
  if (!answers.birthDate) return steps

  // 10. 태어난 시간
  steps.push({
    id: 'birthTime',
    question: [...COMMON_SCRIPTS.birthTime],
    widget: 'time',
    skipLabel: '모르겠어요',
    icon: 'clock',
  })
  if (answers.birthTime === undefined) return steps

  // 11. 이름
  steps.push({
    id: 'name',
    question: [...COMMON_SCRIPTS.name],
    widget: 'text',
    placeholder: '이름',
    skipLabel: '괜찮아요',
    icon: 'keyboard',
  })
  if (answers.name === undefined) return steps

  // 12. 완료
  steps.push({
    id: 'done',
    question: getDoneScript(answers.name, isInterview),
    widget: 'finish',
  })

  return steps
}

/** PRD 21.10 — 이름을 건너뛴 경우 완료 문구가 바뀝니다 */
export function getDoneScript(
  name: string | null | undefined,
  isInterview: boolean
): string[] {
  if (isInterview) return [...INTERVIEW_SCRIPTS.done]
  if (!name) return [...DONE_WITHOUT_NAME]
  return COMMON_SCRIPTS.done.map((s) => s.replace('{name}', name))
}

/** '공무원 · 고시' → '공무원' (문구가 "{대분류}시군요!"로 이어집니다) */
function stripCategoryLabel(label: string): string {
  return label.split('·')[0].trim()
}

/** 대화가 끝났는지 */
export function isComplete(answers: Answers): boolean {
  const steps = getSteps(answers)
  return steps[steps.length - 1]?.id === 'done'
}

/** 사용자 답변을 말풍선에 보여줄 문자열로 (PRD 14.6 이전 답변이 위에 쌓임) */
export function formatAnswer(step: Step, answers: Answers): string | null {
  switch (step.id) {
    case 'category': {
      const c = answers.category ? getCategory(answers.category) : undefined
      return c?.label ?? null
    }
    case 'subGroup': {
      const c = answers.category ? getCategory(answers.category) : undefined
      return c?.subGroups?.find((g) => g.id === answers.subGroup)?.label ?? null
    }
    case 'examName':
      return answers.examName ?? null
    case 'examType':
      return answers.examType ?? null
    case 'examPeriod':
      return answers.examPeriod ?? null
    case 'companyScale':
      return answers.companyScale ?? null
    case 'workType':
      return answers.workType ? WORK_TYPE_LABEL[answers.workType] : null
    case 'jobTitle':
      return answers.jobTitle === null ? '건너뛸게요' : answers.jobTitle ?? null
    case 'examDate':
      return answers.examDate ? formatDateLabel(answers.examDate) : null
    case 'startTime':
      return answers.startTime === null
        ? '아직 몰라요'
        : answers.startTime
          ? formatTimeLabel(answers.startTime)
          : null
    case 'birthDate':
      return answers.birthDate ? formatDateLabel(answers.birthDate) : null
    case 'birthTime':
      return answers.birthTime === null
        ? '모르겠어요'
        : answers.birthTime
          ? formatTimeLabel(answers.birthTime)
          : null
    case 'name':
      return answers.name === null ? '괜찮아요' : answers.name ?? null
    default:
      return null
  }
}

export function formatDateLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일`
}

export function formatTimeLabel(time: string): string {
  const [hh, mm] = time.split(':').map(Number)
  const period = hh < 12 ? '오전' : '오후'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return mm === 0 ? `${period} ${h12}시` : `${period} ${h12}시 ${mm}분`
}

/** 특정 단계로 되돌아갈 때 그 이후 답변을 지웁니다 (PRD 14.6 답변 수정) */
const STEP_ORDER: StepId[] = [
  'category',
  'subGroup',
  'examName',
  'examType',
  'examPeriod',
  'companyScale',
  'workType',
  'jobTitle',
  'examDate',
  'startTime',
  'birthDate',
  'birthTime',
  'name',
]

export function resetFrom(answers: Answers, stepId: StepId): Answers {
  const idx = STEP_ORDER.indexOf(stepId)
  if (idx < 0) return answers

  const next: Answers = { ...answers }
  for (const id of STEP_ORDER.slice(idx)) {
    delete next[id as keyof Answers]
  }
  return next
}

/** 완성된 답변을 결과 계산 입력으로 바꿉니다 */
export function toUserInput(answers: Answers) {
  const category = answers.category ? getCategory(answers.category) : undefined
  const examName = answers.examName ?? ''
  const examType = (answers.examType ??
    inferType(examName, category?.defaultType ?? null) ??
    '필기') as ExamType

  return {
    name: answers.name ?? null,
    examName,
    examNameRaw: answers.examNameRaw ?? null,
    examCategory: answers.category ?? null,
    examType,
    examPeriod: answers.examPeriod ?? null,
    examDate: answers.examDate ?? '',
    startTime: answers.startTime ?? null,
    birthDate: answers.birthDate ?? '',
    birthTime: answers.birthTime ?? null,
    hasBirthTime: answers.birthTime !== null && answers.birthTime !== undefined,
    companyScale: answers.companyScale ?? null,
    workType: answers.workType ?? null,
    jobTitle: answers.jobTitle ?? null,
  }
}

export const SESSION_KEY = 'chat'

/** 유료 추가 입력(면접) 저장 키 (PRD 14.10) */
export const PAID_SESSION_KEY = 'chat-paid'
