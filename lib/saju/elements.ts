/**
 * 오행 분포 산출 (PRD 5.2 ~ 5.5)
 *
 * 가중치는 일간 3, 월지 3, 나머지 각 1입니다.
 * 태어난 시간을 모르는 경우 시간과 시지를 제외합니다 (PRD 4.3.3).
 */

import type { CompanySaju, Saju } from './calculate'
import {
  ELEMENTS,
  GENERATES,
  LUCKY_COLORS,
  LUCKY_DIRECTIONS,
  LUCKY_HOURS,
  LUCKY_NUMBERS,
  OVERCOMES,
  WEIGHTS,
  type Element,
  type Relation,
} from './constants'

export type ElementScores = Record<Element, number>

export interface ElementProfile {
  scores: ElementScores
  strong: Element
  weak: Element
}

function emptyScores(): ElementScores {
  return { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }
}

/** PRD 5.2 가중치로 오행 점수를 합산합니다 */
export function getElementScores(saju: Saju): ElementScores {
  const s = emptyScores()

  s[saju.day.stemElement] += WEIGHTS.dayStem
  s[saju.month.branchElement] += WEIGHTS.monthBranch
  s[saju.year.stemElement] += WEIGHTS.yearStem
  s[saju.year.branchElement] += WEIGHTS.yearBranch
  s[saju.month.stemElement] += WEIGHTS.monthStem
  s[saju.day.branchElement] += WEIGHTS.dayBranch

  // 태어난 시간을 모르면 시간, 시지를 제외합니다 (PRD 4.3.3, 5.2)
  if (saju.hour) {
    s[saju.hour.stemElement] += WEIGHTS.hourStem
    s[saju.hour.branchElement] += WEIGHTS.hourBranch
  }

  return s
}

/** PRD 4.4 / 5.2 — 기업 3기둥 오행 분포 */
export function getCompanyElementScores(company: CompanySaju): ElementScores {
  const s = emptyScores()

  s[company.day.stemElement] += WEIGHTS.dayStem
  s[company.month.branchElement] += WEIGHTS.monthBranch
  s[company.year.stemElement] += WEIGHTS.yearStem
  s[company.year.branchElement] += WEIGHTS.yearBranch
  s[company.month.stemElement] += WEIGHTS.monthStem
  s[company.day.branchElement] += WEIGHTS.dayBranch

  return s
}

/**
 * PRD 5.3 강한 오행 / 약한 오행
 *
 * 동점 처리
 *   강한 오행 동점: 일간 오행 우선
 *   약한 오행 동점: 강한 오행이 극하는 오행 우선
 */
export function getStrongWeak(
  scores: ElementScores,
  dayStemElement: Element
): { strong: Element; weak: Element } {
  const max = Math.max(...ELEMENTS.map((e) => scores[e]))
  const topTied = ELEMENTS.filter((e) => scores[e] === max)

  const strong =
    topTied.length > 1 && topTied.includes(dayStemElement)
      ? dayStemElement
      : topTied[0]

  const min = Math.min(...ELEMENTS.map((e) => scores[e]))
  const bottomTied = ELEMENTS.filter((e) => scores[e] === min)

  const overcome = OVERCOMES[strong]
  const weak =
    bottomTied.length > 1 && bottomTied.includes(overcome)
      ? overcome
      : bottomTied[0]

  return { strong, weak }
}

export function getElementProfile(saju: Saju): ElementProfile {
  const scores = getElementScores(saju)
  const { strong, weak } = getStrongWeak(scores, saju.dayStemElement)
  return { scores, strong, weak }
}

export function getCompanyElementProfile(company: CompanySaju): ElementProfile {
  const scores = getCompanyElementScores(company)
  const { strong, weak } = getStrongWeak(scores, company.dayStemElement)
  return { scores, strong, weak }
}

/**
 * PRD 5.5 관계 판정
 *
 * 시험 당일 운, 오늘의 운, 시작 시간 궁합, 기업 궁합에 모두 재사용됩니다.
 */
export function getRelation(mine: Element, other: Element): Relation {
  if (mine === other) return '비화'
  if (GENERATES[other] === mine) return '상생' // 상대가 나를 생함
  if (OVERCOMES[other] === mine) return '상극' // 상대가 나를 극함
  if (GENERATES[mine] === other) return '설기' // 내가 상대를 생함
  return '아극' // 내가 상대를 극함
}

// ─── PRD 5.4 오행 파생 값 (모두 약한 오행 기준) ───

/** 화면 표시는 첫 번째 숫자만 사용합니다 (PRD 5.4) */
export function getLuckyNumber(weak: Element): number {
  return LUCKY_NUMBERS[weak][0]
}

export function getLuckyNumbers(weak: Element): [number, number] {
  return LUCKY_NUMBERS[weak]
}

export function getLuckyColor(weak: Element): string {
  return LUCKY_COLORS[weak][LUCKY_COLORS[weak].length - 1]
}

export function getLuckyColors(weak: Element): string[] {
  return LUCKY_COLORS[weak]
}

export function getLuckyDirection(weak: Element): string {
  return LUCKY_DIRECTIONS[weak]
}

export function getLuckyHour(weak: Element): string {
  return LUCKY_HOURS[weak]
}
