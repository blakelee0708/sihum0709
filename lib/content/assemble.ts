/**
 * 무료 결과 카드 조립 (README 조립 규칙, PRD 3.2 ~ 3.8)
 *
 * 문장 조각을 고르고 변수를 치환해 카드 8개를 만듭니다.
 * AI 호출도 검색도 없고, 같은 입력에는 항상 같은 결과가 나옵니다 (PRD 3.1).
 */

import {
  calculateSaju,
  parseLocalDateTime,
  type Saju,
} from '../saju/calculate'
import {
  getElementProfile,
  getLuckyColor,
  getLuckyColors,
  getLuckyDirection,
  getLuckyHour,
  getLuckyNumber,
  getLuckyNumbers,
  type ElementProfile,
} from '../saju/elements'
import {
  diffDays,
  formatStartTime,
  getDdayRange,
  getExamDayScore,
  getMethodFit,
  getMethodFitScore,
  getPotentialScore,
  getScoreRange,
  getStartTimeRelation,
  getTodayScore,
  getVerdictRange,
  getWeekFlow,
  type DayFlow,
  type MethodFit,
  type StartTimeResult,
} from '../saju/fortune'
import { attachParticle, getParticle, render } from '../saju/particle'
import {
  WORK_TYPE_LABEL,
  type CompanyScale,
  type Element,
  type ExamType,
  type Relation,
  type WorkType,
} from '../saju/constants'
import { getCharacter, getTypeBadge, type CharacterStage, type TypeBadge } from './characters'
import { F } from './fragments'

// ─── 입력 ───

export interface UserInput {
  name?: string | null
  examName: string
  examCategory?: string | null
  examType: ExamType
  /** 'YYYY-MM-DD' */
  examDate: string
  /** 'HH:mm' — 모르면 null (PRD 6.5) */
  startTime?: string | null
  /** 'YYYY-MM-DD' */
  birthDate: string
  /** 'HH:mm' */
  birthTime?: string | null
  hasBirthTime: boolean

  /** 정규화 전 원본 입력 (PRD 10.3). 프리셋 버튼으로 고른 경우 없습니다 */
  examNameRaw?: string | null
  /** 대학교 시험만 값이 있습니다 (PRD 10.4) */
  examPeriod?: ExamPeriod | null

  // 면접 전용
  companyScale?: CompanyScale | null
  workType?: WorkType | null
  jobTitle?: string | null
}

// ─── 출력 ───

export type CardKind = 'text' | 'weekFlow' | 'methodFit'

export interface ResultCard {
  id: number
  title: string
  kind: CardKind
  /** kind가 'text'일 때의 문단들 */
  paragraphs: string[]
}

/** PRD 10.4 대학교 시험 기간 */
export type ExamPeriod = '하루' | '2~3일' | '4~7일' | '일주일 이상'

export const EXAM_PERIODS: ExamPeriod[] = ['하루', '2~3일', '4~7일', '일주일 이상']

export interface FreeResult {
  input: UserInput
  saju: Saju
  profile: ElementProfile

  /** 상단 요약 */
  dday: number
  ddayRange: string
  examDayScore: number
  examDayRelation: Relation
  todayScore: number
  /** PRD 8.7 잠재력 발휘 지수. 무료에서는 잠금으로 가립니다 */
  potentialScore: number
  character: CharacterStage
  badge: TypeBadge
  speechBubble: string
  typeDescription: string

  /** 카드 */
  cards: ResultCard[]
  weekFlow: DayFlowLabeled[]
  methodFit: MethodFit
  startTime: StartTimeResult | null

  /** 파생 값 (공유 이미지, 유료 프롬프트에 사용) */
  luckyNumber: number
  luckyNumbers: [number, number]
  luckyColor: string
  luckyColors: string[]
  luckyDirection: string
  luckyHour: string

  /** 시간 미입력 안내 노출 여부 (PRD 4.3.3) */
  showBirthTimeNotice: boolean
}

export interface DayFlowLabeled extends DayFlow {
  label: string
}

// ─── 방식별 표현 ───

/** 면접이면 '면접', 나머지는 '시험' (PRD 3.3, 21.7) */
export function methodWord(type: ExamType): string {
  return type === '면접' ? '면접' : '시험'
}

/** PRD 3.2, 3.3 카드 제목 */
function cardTitles(type: ExamType): Record<number, string> {
  const w = methodWord(type)
  return {
    1: '{name}님의 시험 날짜 운세는?',
    2: `${w}장에서 주의할 점`,
    3: '{name}님의 행운의 숫자는?',
    4: `${w}일에 뭘 입고 갈까?`,
    5: `${w} 전날 밤에는`,
    6: `${w} 전 7일 기운 흐름`,
    7: '{name}님에게 맞는 시험 유형',
    8: '시작 시간 궁합',
  }
}

/** 이름이 없을 때 제목의 호명을 자연스럽게 지웁니다 */
function renderTitle(template: string, name?: string | null): string {
  if (name) return template.replace(/\{name\}님/g, `${name}님`)
  return template
    .replace(/\{name\}님의\s*/g, '')
    .replace(/\{name\}님에게\s*/g, '')
    .replace(/\{name\}님\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 'YYYY-MM-DD' → '4월 11일' (README {examDate}) */
export function formatExamDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${m}월 ${d}일`
}

/** PRD 3.8 — 직무명이 없으면 일의 성격 라벨로 대체합니다 */
export function getJobPhrase(
  jobTitle?: string | null,
  workType?: WorkType | null
): string {
  if (jobTitle && jobTitle.trim()) return jobTitle.trim()
  if (workType) return WORK_TYPE_LABEL[workType]
  return ''
}

// ─── 조립 ───

export function buildFreeResult(
  input: UserInput,
  today: Date = new Date()
): FreeResult {
  const saju = calculateSaju({
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    hasBirthTime: input.hasBirthTime,
  })
  const profile = getElementProfile(saju)
  const { strong, weak } = profile

  const examDate = parseLocalDateTime(input.examDate, null)
  const dday = diffDays(today, examDate)
  const ddayRange = getDdayRange(dday)

  const exam = getExamDayScore(saju, strong, weak, examDate, input.examType)
  const todayFortune = getTodayScore(saju, strong, weak, input.examType, today)

  const startTime = input.startTime
    ? getStartTimeRelation(strong, input.startTime)
    : null

  // 변수 치환 재료 (README 변수 표)
  const examDateLabel = formatExamDate(input.examDate)
  const vars = {
    name: input.name ?? null,
    exam: input.examName,
    jobPhrase: getJobPhrase(input.jobTitle, input.workType),
    examDate: examDateLabel,
    examParticle: getParticle(examDateLabel, '은는'),
    startTime: input.startTime ? formatStartTime(input.startTime) : '',
    branchName: startTime?.branchName ?? '',
    branchHanja: startTime?.branchHanja ?? '',
  }

  const r = (s: string) => render(s, vars)
  const titles = cardTitles(input.examType)
  const t = (id: number) => renderTitle(titles[id], input.name)

  const variant = saju.dayPillarIndex % 7 // PRD 3.7

  const cards: ResultCard[] = []

  // 카드 1 — 일간 + 강오행 + 약오행 + 일진 관계 + 종합 판정
  cards.push({
    id: 1,
    title: t(1),
    kind: 'text',
    paragraphs: [
      F.dayStem[saju.dayStemName],
      F.strongElement[strong],
      F.weakElement[weak],
      F.dayRelation[exam.relation],
      F.verdict[getVerdictRange(exam.score)],
    ].map(r),
  })

  // 카드 2 — 방식별. 면접은 조각이 4개입니다 (README)
  if (input.examType === '면접') {
    const scale = input.companyScale
    const work = input.workType
    cards.push({
      id: 2,
      title: t(2),
      kind: 'text',
      paragraphs: [
        F.methodIntro['면접'][variant],
        scale ? F.companyScale[scale] : null,
        work ? F.workTypeByStrong[work][strong] : null,
        F.methodByWeak['면접'][weak],
      ]
        .filter((s): s is string => Boolean(s))
        .map(r),
    })
  } else {
    cards.push({
      id: 2,
      title: t(2),
      kind: 'text',
      paragraphs: [
        F.methodIntro[input.examType][variant],
        F.methodByStrong[input.examType][strong],
        F.methodByWeak[input.examType][weak],
      ].map(r),
    })
  }

  // 카드 3 — 행운의 숫자
  cards.push({
    id: 3,
    title: t(3),
    kind: 'text',
    paragraphs: [
      F.luckyNumberByWeak[weak],
      F.numberUseByMethod[input.examType],
    ].map(r),
  })

  // 카드 4 — 복장
  cards.push({
    id: 4,
    title: t(4),
    kind: 'text',
    paragraphs: [
      F.luckyColorByWeak[weak],
      F.outfitByMethod[input.examType],
    ].map(r),
  })

  // 카드 5 — 전날 밤
  cards.push({
    id: 5,
    title: t(5),
    kind: 'text',
    paragraphs: [
      F.eveByStrong[strong],
      F.eveByWeak[weak],
      F.eveByMethod[input.examType],
    ].map(r),
  })

  // 카드 6 — 7일 기운 흐름 (그래프)
  const weekFlow: DayFlowLabeled[] = getWeekFlow(saju, weak, examDate).map(
    (d) => ({ ...d, label: F.flowLabel[getScoreRange(d.score)] })
  )
  cards.push({ id: 6, title: t(6), kind: 'weekFlow', paragraphs: [] })

  // 카드 7 — 방식 궁합 (막대 그래프, 문장 없음)
  const methodFit = getMethodFit(strong)
  cards.push({ id: 7, title: t(7), kind: 'methodFit', paragraphs: [] })

  // 카드 8 — 시작 시간 궁합. 시간을 모르면 표시하지 않습니다 (PRD 6.5)
  if (startTime) {
    cards.push({
      id: 8,
      title: t(8),
      kind: 'text',
      paragraphs: [F.startTimeByRelation[input.examType][startTime.relation]].map(r),
    })
  }

  return {
    input,
    saju,
    profile,

    dday,
    ddayRange,
    examDayScore: exam.score,
    examDayRelation: exam.relation,
    todayScore: todayFortune.score,
    potentialScore: getPotentialScore({
      examDayRelation: exam.relation,
      startTimeRelation: startTime?.relation ?? null,
      methodFitScore: getMethodFitScore(strong, input.examType),
    }),
    character: getCharacter(exam.score),
    badge: getTypeBadge(strong),
    speechBubble: speechBubbleFor(ddayRange, input.examType),
    typeDescription: F.typeDescription[strong],

    cards,
    weekFlow,
    methodFit,
    startTime,

    luckyNumber: getLuckyNumber(weak),
    luckyNumbers: getLuckyNumbers(weak),
    luckyColor: getLuckyColor(weak),
    luckyColors: getLuckyColors(weak),
    luckyDirection: getLuckyDirection(weak),
    luckyHour: getLuckyHour(weak),

    showBirthTimeNotice: !input.hasBirthTime,
  }
}

/**
 * PRD 21.7 말풍선 — 면접인 경우 "시험"을 "면접"으로 치환합니다.
 */
export function speechBubbleFor(ddayRange: string, type: ExamType): string {
  const raw = F.speechBubble[ddayRange] ?? ''
  return type === '면접' ? raw.replace(/시험/g, '면접') : raw
}

/** PRD 6.5 — 시작 시간을 모를 때 카드 8 자리에 넣는 안내 */
export const START_TIME_UNKNOWN_NOTICE = [
  '시험 시간이 나오면 다시 입력해보세요.',
  '시간대에 따라 유리한 조건이 달라집니다.',
]

/** PRD 4.3.3 — 태어난 시간 미입력 안내 */
export const BIRTH_TIME_NOTICE = '태어난 시간을 입력하시면 더 정확한 결과를 볼 수 있습니다.'

/** PRD 18.4 오락 목적 고지 */
export const DISCLAIMER =
  '이 서비스는 사주 명리 해석에 기반한 참고 자료이며, 시험 결과를 예측하거나 보장하지 않습니다.'

export { attachParticle }
