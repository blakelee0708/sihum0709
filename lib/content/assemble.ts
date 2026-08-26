/**
 * 무료 결과 카드 조립 (PRD 3.2 ~ 3.10)
 *
 * 문장 조각을 고르고 변수를 치환해 카드 8개를 만듭니다.
 * AI 호출도 검색도 없고, 같은 입력에는 항상 같은 결과가 나옵니다 (PRD 3.1).
 *
 * 카드 1~4가 시험 정보를 계산에 쓴 항목입니다. 일반 사주 서비스가 만들 수 없는
 * 내용을 앞에 둡니다 (PRD 3.3). 그중 2·3·4와 7에 부분 잠금을 겁니다 (PRD 3.4).
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
  getWeekFlowPattern,
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
  /**
   * 'YYYY-MM-DD'. 항상 양력입니다.
   *
   * 사용자가 음력으로 입력했으면 입력 단계에서 이미 변환한 값이
   * 들어옵니다 (lib/saju/lunar.ts). 사주 계산은 양력과 절기만 씁니다.
   */
  birthDate: string
  /** 'HH:mm' */
  birthTime?: string | null
  hasBirthTime: boolean

  /** 음력으로 입력했는지 (FIX_3 [3]-2). 저장용이고 계산에는 쓰지 않습니다 */
  isLunar?: boolean
  /** 윤달이었는지 */
  isLeapMonth?: boolean
  /** 입력한 음력 원본 'YYYY-MM-DD' */
  lunarDate?: string | null

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

export type CardKind = 'text' | 'saju' | 'weekFlow' | 'methodFit'

/** 카드 안 하단에 걸리는 부분 잠금 (PRD 3.4) */
export interface CardLock {
  /** 예: '십신으로 본 시험 패턴' */
  title: string
  /** 제목만 있으면 무엇인지 모르므로 한두 줄 설명을 함께 둡니다 */
  teaser: string
}

export interface ResultCard {
  id: number
  title: string
  kind: CardKind
  /** 문단들. 차트 카드는 비어 있을 수 있습니다 */
  paragraphs: string[]
  lock?: CardLock
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

/**
 * 방식을 가리키는 말 (PRD 3.5).
 * 오디션만 따로 부르고, 필기·실기는 '시험'으로 묶습니다.
 */
export function methodWord(type: ExamType): string {
  if (type === '면접') return '면접'
  if (type === '오디션') return '오디션'
  return '시험'
}

/** 카드 6의 장소 (PRD 3.5) */
function venueWord(type: ExamType): string {
  if (type === '면접') return '면접장'
  if (type === '오디션') return '심사장'
  return '시험장'
}

/** PRD 3.5 카드 제목 */
function cardTitles(type: ExamType, startTimeLabel: string): Record<number, string> {
  const w = methodWord(type)
  return {
    // 카드 1의 날짜 표현은 방식과 무관하게 같습니다 (PRD 3.5)
    1: '{examDate}, {name}님에게 어떤 날인가',
    2: '{name}님의 사주',
    3: `${w} 전 7일 기운 흐름`,
    // "오전 10시는" / "오후 2시 30분은" — 받침에 따라 조사가 달라집니다
    4: `${attachParticle(startTimeLabel, '은는')} 맞는 시간일까`,
    5: '{name}님은 어떤 시험에 강한가',
    6: `${venueWord(type)}에서 주의할 점`,
    7: '행운의 숫자와 피해야 할 색',
    8: `${w} 전날 밤에는`,
  }
}

/** PRD 3.4 부분 잠금 4곳 */
const CARD_LOCKS: Record<number, { title: string; teaserKey: string }> = {
  2: { title: '십신으로 본 시험 패턴', teaserKey: 'saju' },
  3: { title: '날짜별 상세 플랜', teaserKey: 'weekFlow' },
  4: { title: '하루 전체 시간대별 운용', teaserKey: 'startTime' },
  7: { title: '좋은 색, 방위, 시간대', teaserKey: 'luckyColor' },
}

/** 이름이 없을 때 제목의 호명을 자연스럽게 지웁니다 */
function renderTitle(template: string, name?: string | null): string {
  if (name) return template.replace(/\{name\}님/g, `${name}님`)
  return template
    .replace(/\{name\}님의\s*/g, '')
    .replace(/\{name\}님에게\s*/g, '')
    .replace(/\{name\}님은\s*/g, '')
    .replace(/,\s*\{name\}님\s*/g, ', ')
    .replace(/\{name\}님\s*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^,\s*/, '')
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
  const titles = cardTitles(
    input.examType,
    input.startTime ? formatStartTime(input.startTime) : '시작 시각'
  )
  const t = (id: number) =>
    renderTitle(titles[id], input.name).replace('{examDate}', examDateLabel)

  /** 부분 잠금은 차별화 카드에만 겁니다 (PRD 3.4) */
  const lock = (id: number): CardLock => ({
    title: CARD_LOCKS[id].title,
    teaser: r(F.lockTeaser[CARD_LOCKS[id].teaserKey]),
  })

  const variant = saju.dayPillarIndex % 7 // PRD 3.9

  const weekFlow: DayFlowLabeled[] = getWeekFlow(saju, weak, examDate).map(
    (d) => ({ ...d, label: F.flowLabel[getScoreRange(d.score)] })
  )
  const methodFit = getMethodFit(strong)

  const cards: ResultCard[] = []

  // 카드 1 — 일간 + 강오행 + 약오행 + 일진 관계 + 종합 판정. 전체 공개
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

  // 카드 2 — 명식 표와 오행 분포를 그리고 오행 요약을 붙입니다. 부분 잠금
  cards.push({
    id: 2,
    title: t(2),
    kind: 'saju',
    paragraphs: [F.elementSummary[strong]].map(r),
    lock: lock(2),
  })

  // 카드 3 — 7일 기운 흐름 차트 + 패턴 요약. 부분 잠금
  cards.push({
    id: 3,
    title: t(3),
    kind: 'weekFlow',
    paragraphs: [F.weekFlowSummary[getWeekFlowPattern(weekFlow.map((d) => d.score))]].map(r),
    lock: lock(3),
  })

  // 카드 4 — 시작 시간 궁합. 시간을 모르면 표시하지 않습니다 (PRD 6.5). 부분 잠금
  if (startTime) {
    cards.push({
      id: 4,
      title: t(4),
      kind: 'text',
      paragraphs: [F.startTimeByRelation[input.examType][startTime.relation]].map(r),
      lock: lock(4),
    })
  }

  // 카드 5 — 방식 궁합 (막대 그래프, 문장 없음). 전체 공개
  cards.push({ id: 5, title: t(5), kind: 'methodFit', paragraphs: [] })

  // 카드 6 — 방식별. 면접은 조각이 4개입니다 (PRD 3.6). 전체 공개
  if (input.examType === '면접') {
    // 기업 규모 조각은 쓰지 않습니다 (PRD 10.8). 질문을 없앴으므로
    // 값이 언제나 null입니다. 조각은 파일에 남겨 두었습니다.
    const work = input.workType
    cards.push({
      id: 6,
      title: t(6),
      kind: 'text',
      paragraphs: [
        F.methodIntro['면접'][variant],
        work ? F.workTypeByStrong[work][strong] : null,
        F.methodByWeak['면접'][weak],
      ]
        .filter((x): x is string => Boolean(x))
        .map(r),
    })
  } else {
    cards.push({
      id: 6,
      title: t(6),
      kind: 'text',
      paragraphs: [
        F.methodIntro[input.examType][variant],
        F.methodByStrong[input.examType][strong],
        F.methodByWeak[input.examType][weak],
      ].map(r),
    })
  }

  // 카드 7 — 행운 숫자 1개 + 방식별 활용 + 피해야 할 색. 부분 잠금
  //
  // 무료가 "하지 말 것", 유료가 "할 것"입니다 (PRD 3.4).
  // 피해야 할 색은 강한 것을 더 키우는 색을 피하는 논리이므로
  // 약한 오행이 아니라 강한 오행을 봅니다.
  cards.push({
    id: 7,
    title: t(7),
    kind: 'text',
    paragraphs: [
      F.luckyNumberByWeak[weak],
      F.numberUseByMethod[input.examType],
      F.avoidColorByStrong[strong],
    ].map(r),
  })
  cards[cards.length - 1].lock = lock(7)

  // 카드 8 — 전날 밤. 전체 공개
  cards.push({
    id: 8,
    title: t(8),
    kind: 'text',
    paragraphs: [
      F.eveByStrong[strong],
      F.eveByWeak[weak],
      F.eveByMethod[input.examType],
    ].map(r),
  })

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
