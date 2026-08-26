/**
 * 운 지수 계산 (PRD 6.1 ~ 6.6)
 *
 *   6.1 시험 당일 운 지수
 *   6.2 오늘의 운
 *   6.3 시험 방식 궁합 점수
 *   6.4 7일 기운 흐름
 *   6.5 시작 시간 궁합
 *   6.6 월별 시험운 (유료 전용)
 *
 * 유료 리포트가 쓰는 두 가지도 여기 있습니다.
 *   8.6 12지지 시간대 (섹션 4)
 *   8.7 잠재력 발휘 지수 (표지)
 */

import {
  getDayPillar,
  getHourBranchIndex,
  getMonthBranchIndex,
  parseLocalDateTime,
  toDateKey,
  type Pillar,
  type Saju,
} from './calculate'
import { getRelation } from './elements'
import { getShipsin, type Shipsin } from './shipsin'
import {
  BASE_SCORE,
  BRANCHES,
  BRANCH_ELEMENT,
  BRANCH_HANJA,
  DAY_SCORE_BY_RELATION,
  EXAM_TYPE_TO_METHOD_KEY,
  METHOD_FIT,
  METHOD_KEYS,
  POTENTIAL_BY_DAY_RELATION,
  POTENTIAL_BY_START_RELATION,
  type Element,
  type ExamType,
  type MethodKey,
  type Relation,
} from './constants'

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + days)
  return d
}

export function diffDays(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b - a) / 86400000)
}

// ─── PRD 6.3 시험 방식 궁합 점수 ───

export type MethodFit = Record<MethodKey, number>

/** 강한 오행 기준 방식 적합도 4종 (카드 7) */
export function getMethodFit(strong: Element): MethodFit {
  return { ...METHOD_FIT[strong] }
}

/** 입력 방식(3분류)에 해당하는 궁합 점수 하나 */
export function getMethodFitScore(strong: Element, type: ExamType): number {
  return METHOD_FIT[strong][EXAM_TYPE_TO_METHOD_KEY[type]]
}

// ─── PRD 6.1 시험 당일 운 지수 ───

export interface DayScoreResult {
  score: number
  relation: Relation
}

/**
 * 대상일의 일주를 받아 점수를 계산합니다 (PRD 6.1의 [1][2][3] 단계).
 * 방식 궁합 가산([4])은 포함하지 않습니다. 7일 흐름이 이 부분만 사용합니다.
 */
export function calcDayScoreBase(
  saju: Saju,
  weak: Element,
  dayPillar: Pillar
): DayScoreResult {
  const relation = getRelation(saju.dayStemElement, dayPillar.stemElement)

  let score = BASE_SCORE
  score += DAY_SCORE_BY_RELATION[relation]

  // [3] 시험일 일지 오행이 사용자의 약한 오행과 같으면 +20
  if (dayPillar.branchElement === weak) score += 20

  return { score, relation }
}

/**
 * PRD 6.1 시험 당일 운 지수 (전체 4단계).
 * [4] 강한 오행과 시험 방식의 궁합 점수를 20으로 나눠 가산합니다.
 */
export function getExamDayScore(
  saju: Saju,
  strong: Element,
  weak: Element,
  examDate: Date,
  type: ExamType
): DayScoreResult {
  const pillar = getDayPillar(examDate)
  const base = calcDayScoreBase(saju, weak, pillar)

  const fit = getMethodFitScore(strong, type)
  const score = clamp(base.score + fit / 20)

  return { score, relation: base.relation }
}

/**
 * PRD 6.2 오늘의 운.
 * 6.1과 동일한 로직에서 대상 날짜만 오늘로 바꿉니다.
 */
export function getTodayScore(
  saju: Saju,
  strong: Element,
  weak: Element,
  type: ExamType,
  today: Date = new Date()
): DayScoreResult {
  return getExamDayScore(saju, strong, weak, today, type)
}

// ─── PRD 6.4 7일 기운 흐름 ───

export interface DayFlow {
  /** 'YYYY-MM-DD' */
  date: string
  dday: number
  score: number
  relation: Relation
}

/**
 * 시험일로부터 역산해 8일치(D-7 ~ D-0)를 계산합니다.
 * PRD 6.4의 코드가 i = 7..0 이므로 시험 당일을 포함해 8개가 나옵니다.
 * 방식 궁합은 제외하고 [1][2][3]만 사용합니다.
 */
export function getWeekFlow(
  saju: Saju,
  weak: Element,
  examDate: Date
): DayFlow[] {
  const result: DayFlow[] = []

  for (let i = 7; i >= 0; i--) {
    const target = addDays(examDate, -i)
    const pillar = getDayPillar(target)
    const { score, relation } = calcDayScoreBase(saju, weak, pillar)

    result.push({
      date: toDateKey(target),
      dday: i,
      score: clamp(score),
      relation,
    })
  }

  return result
}

// ─── PRD 6.5 시작 시간 궁합 ───

export interface StartTimeResult {
  branchIndex: number
  /** 예: '미시' */
  branchName: string
  /** 예: '未時' */
  branchHanja: string
  branchElement: Element
  relation: Relation
}

/**
 * 시작 시각을 12지지 구간으로 변환하고 강한 오행과의 관계를 판정합니다.
 * 시작 시간을 모르는 경우 호출하지 않고 카드 8을 숨깁니다 (PRD 6.5).
 */
export function getStartTimeRelation(
  strong: Element,
  startTime: string
): StartTimeResult {
  const dummy = parseLocalDateTime('2000-01-01', startTime)
  const branchIndex = getHourBranchIndex(dummy)
  const branchElement = BRANCH_ELEMENT[branchIndex]

  return {
    branchIndex,
    branchName: `${BRANCHES[branchIndex]}시`,
    branchHanja: `${BRANCH_HANJA[branchIndex]}時`,
    branchElement,
    relation: getRelation(strong, branchElement),
  }
}

/** 'HH:mm' → '오후 2시 30분' (문장 조각의 {startTime} 변수) */
export function formatStartTime(startTime: string): string {
  const [hh, mm] = startTime.split(':').map(Number)
  const period = hh < 12 ? '오전' : '오후'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return mm === 0 ? `${period} ${h12}시` : `${period} ${h12}시 ${mm}분`
}

// ─── PRD 6.6 월별 시험운 (유료 전용) ───

export interface MonthFlow {
  month: number
  score: number
  relation: Relation
  /** 5단계 막대 표시용 (1-5) */
  level: number
}

/**
 * 각 월의 월지를 절기 기준으로 확인하고, 월지 오행과 사용자 일간 오행의
 * 관계를 판정해 5단계 막대로 표시할 점수를 만듭니다.
 */
export function getMonthFlow(saju: Saju, year: number): MonthFlow[] {
  const result: MonthFlow[] = []

  for (let m = 1; m <= 12; m++) {
    // 해당 월의 중순을 기준으로 절입 구간을 확인합니다
    const probe = new Date(year, m - 1, 16)
    const branchIndex = getMonthBranchIndex(probe)
    const element = BRANCH_ELEMENT[branchIndex]
    const relation = getRelation(saju.dayStemElement, element)

    const score = clamp(BASE_SCORE + DAY_SCORE_BY_RELATION[relation])

    result.push({
      month: m,
      score,
      relation,
      level: relationToLevel(relation),
    })
  }

  return result
}

/** 관계별 5단계 막대 (PRD 6.6 [3]) */
function relationToLevel(relation: Relation): number {
  switch (relation) {
    case '상생':
      return 5
    case '비화':
      return 4
    case '아극':
      return 3
    case '설기':
      return 2
    case '상극':
      return 1
  }
}

// ─── 구간 매핑 (README) ───

/** flowLabel 6구간 */
export function getScoreRange(score: number): string {
  if (score >= 80) return '80-100'
  if (score >= 65) return '65-79'
  if (score >= 50) return '50-64'
  if (score >= 35) return '35-49'
  if (score >= 20) return '20-34'
  return '0-19'
}

/** verdict 5구간 — 20 미만도 '0-34'로 처리합니다 */
export function getVerdictRange(score: number): string {
  if (score >= 80) return '80-100'
  if (score >= 65) return '65-79'
  if (score >= 50) return '50-64'
  if (score >= 35) return '35-49'
  return '0-34'
}

/** D-day 5구간 (말풍선, 리포트 구성 분기) */
export function getDdayRange(dday: number): string {
  if (dday >= 30) return 'D30+'
  if (dday >= 8) return 'D8-29'
  if (dday >= 2) return 'D2-7'
  if (dday === 1) return 'D1'
  return 'D0'
}

/** PRD 8.6 리포트 구성 분기용 구간 */
export type ReportDdayRange = 'normal' | 'short' | 'eve' | 'dday'

export function getReportDdayRange(dday: number): ReportDdayRange {
  if (dday >= 8) return 'normal'
  if (dday >= 2) return 'short'
  if (dday === 1) return 'eve'
  return 'dday'
}

/** PRD 7.2 캐릭터 표정 5단계 — 운 지수로 파일명을 정합니다 */
export function getCharacterFile(score: number): string {
  if (score >= 80) return 'char-05'
  if (score >= 65) return 'char-04'
  if (score >= 50) return 'char-03'
  if (score >= 35) return 'char-02'
  return 'char-01'
}

// ─── PRD 8.6 시간대별 운용 (12지지) ───

export interface TimeSlot {
  /** 예: '07:00-08:59' */
  range: string
  /** 예: '진시' */
  branch: string
  /** 예: '辰時' */
  hanja: string
  element: Element
  /** 사용자 일간과의 십신 관계 (PRD 5.6) */
  relation: Shipsin
}

/** 지지 index → 그 시간대가 시작하는 시각. 자시가 23시부터입니다 */
function slotStartHour(branchIndex: number): number {
  return (23 + branchIndex * 2) % 24
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * 시험 당일 시간대 배열 (PRD 8.6).
 *
 * 시작 시각을 기준으로 기상부터 종료까지의 구간만 만듭니다. 종료 시각을 받지
 * 않으므로 시작 이후는 두 구간까지만 넣고, 그 뒤는 프롬프트가 상대 표현
 * ("시작 직후 20분", "후반")으로 쓰게 둡니다.
 *
 * 각 구간에 지지 오행과 일간의 십신 관계를 미리 붙입니다. AI가 관계를 임의로
 * 판단하지 않게 하기 위함입니다.
 *
 * 시작 시각을 모르면 빈 배열을 돌려주고, 섹션 4를 시간대 없는 구성으로
 * 대체합니다 (PRD 8.16).
 */
export function getTimeSlots(
  dayElement: Element,
  startTime: string | null,
  /** 기상은 시작 몇 시간 전으로 볼지 */
  wakeHoursBefore = 3,
  /** 시작 이후 몇 구간까지 넣을지 */
  slotsAfter = 2
): TimeSlot[] {
  if (!startTime) return []

  const [hh] = startTime.split(':').map(Number)
  if (Number.isNaN(hh)) return []

  const startBranch = getHourBranchIndex(parseLocalDateTime('2000-01-01', startTime))

  // 기상 시각이 속한 지지부터 시작합니다
  const wakeHour = (hh - wakeHoursBefore + 24) % 24
  const wakeBranch = getHourBranchIndex(parseLocalDateTime('2000-01-01', `${pad(wakeHour)}:00`))

  // 기상 지지 → 시작 지지 → 그 뒤 slotsAfter개
  const count = ((startBranch - wakeBranch + 12) % 12) + 1 + slotsAfter

  const out: TimeSlot[] = []
  for (let i = 0; i < count; i += 1) {
    const b = (wakeBranch + i) % 12
    const from = slotStartHour(b)
    const to = (from + 1) % 24
    const element = BRANCH_ELEMENT[b]

    out.push({
      range: `${pad(from)}:00-${pad(to)}:59`,
      branch: `${BRANCHES[b]}시`,
      hanja: `${BRANCH_HANJA[b]}時`,
      element,
      relation: getShipsin(dayElement, element),
    })
  }
  return out
}

// ─── PRD 8.7 잠재력 발휘 지수 ───

/** 70~120으로 자릅니다. 당일 운(0-100)과 다른 축이라 clamp를 따로 씁니다 */
function clampPotential(n: number): number {
  return Math.max(70, Math.min(120, Math.round(n)))
}

export interface PotentialInput {
  /** 시험일 일진 관계 */
  examDayRelation: Relation
  /** 시작 시간 궁합. 시간을 모르면 null */
  startTimeRelation: Relation | null
  /** 해당 방식의 궁합 점수 (6.3) */
  methodFitScore: number
}

/**
 * 그날 조건에서 평소 실력의 몇 퍼센트가 나오는지 (PRD 8.7).
 *
 * 당일 운 지수와 다른 축입니다. 당일 운이 낮아도 발휘 지수가 높으면
 * "흐름이 밀어주는 날은 아니지만 준비한 것은 잘 나오는 조건"이 됩니다.
 *
 * 유료 전용 지표입니다. 무료에서는 잠금으로 표시하고 숫자를 가립니다.
 */
export function getPotentialScore(input: PotentialInput): number {
  let score = 100

  score += POTENTIAL_BY_DAY_RELATION[input.examDayRelation]

  // 시작 시각을 모르면 이 항목을 빼고 계산합니다. 0을 더하는 것과 같습니다.
  if (input.startTimeRelation) {
    score += POTENTIAL_BY_START_RELATION[input.startTimeRelation]
  }

  score += (input.methodFitScore - 70) / 5

  return clampPotential(score)
}

// ─── PRD 3.6 카드 3 — 7일 흐름 요약 ───

export type WeekFlowPattern =
  | 'high-early'
  | 'high-late'
  | 'high-middle'
  | 'flat'
  | 'volatile'
  | 'low-overall'

/**
 * 7일 흐름을 여섯 패턴 중 하나로 분류합니다 (fragments.json weekFlowSummary).
 *
 * PRD 3.6은 조각이 6개라는 것만 정하고 분류 규칙은 두지 않았습니다.
 * 아래 기준을 새로 정했습니다. 판정 순서가 결과를 가르므로 순서도 규칙입니다.
 *
 *   1. 평균이 낮으면 전반이 낮은 것으로 봅니다. 어디가 높은지는 의미가 없습니다
 *   2. 진폭이 크면 오르내림으로 봅니다. 최고점 위치보다 변동이 눈에 띕니다
 *   3. 진폭이 작으면 고른 것으로 봅니다
 *   4. 나머지는 최고점이 앞·중간·뒤 어디에 있는지로 가릅니다
 *
 * 같은 입력에는 항상 같은 결과가 나옵니다 (PRD 3.1).
 */
export function getWeekFlowPattern(scores: number[]): WeekFlowPattern {
  if (scores.length === 0) return 'flat'

  const max = Math.max(...scores)
  const min = Math.min(...scores)
  const avg = scores.reduce((a, n) => a + n, 0) / scores.length
  const spread = max - min

  if (avg < 45) return 'low-overall'
  if (spread >= 30) return 'volatile'
  if (spread <= 10) return 'flat'

  const peak = scores.indexOf(max)
  const third = scores.length / 3

  if (peak < third) return 'high-early'
  if (peak >= third * 2) return 'high-late'
  return 'high-middle'
}

export { METHOD_KEYS }
