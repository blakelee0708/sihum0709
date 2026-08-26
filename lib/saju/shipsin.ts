/**
 * 십신 계산 (PRD 5.6)
 *
 * 십신은 일간과 나머지 글자의 관계입니다. 5.5의 관계 판정을 오행 단위로
 * 적용한 것이며, 5.2의 가중치를 그대로 쓰므로 오행 분포에서 바로 환산됩니다.
 *
 * 유료 리포트 섹션 2("내 사주가 말하는 시험 패턴")와 마지막 섹션
 * ("내 사주로 본 시험 전략")에서 씁니다.
 *
 * 시험 서비스에서 중요한 것은 관성(평가받는 자리), 식상(표현), 인성(학습)입니다.
 */

import type { Saju } from './calculate'
import {
  ELEMENTS,
  GENERATES,
  OVERCOMES,
  WEIGHTS,
  type Element,
} from './constants'
import type { ElementScores } from './elements'

export type Shipsin = '비겁' | '식상' | '재성' | '관성' | '인성'

export const SHIPSIN_KEYS: Shipsin[] = ['비겁', '식상', '재성', '관성', '인성']

/** PRD 5.6 표 — 시험 맥락에서의 의미. 프롬프트 재료에 함께 넣습니다 */
export const SHIPSIN_MEANING: Record<Shipsin, string> = {
  비겁: '경쟁, 자기 주장, 고집',
  식상: '표현, 전달, 말하기',
  재성: '결과, 성과, 실리',
  관성: '규율, 평가, 시험 자체',
  인성: '학습, 흡수, 이해',
}

export function getShipsin(dayElement: Element, target: Element): Shipsin {
  if (target === dayElement) return '비겁' // 같은 오행
  if (GENERATES[dayElement] === target) return '식상' // 내가 생하는
  if (OVERCOMES[dayElement] === target) return '재성' // 내가 극하는
  if (OVERCOMES[target] === dayElement) return '관성' // 나를 극하는
  return '인성' // 나를 생하는
}

export type ShipsinScores = Record<Shipsin, number>

function emptyScores(): ShipsinScores {
  return { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 }
}

/**
 * 오행 분포를 십신 분포로 환산합니다.
 *
 * 오행 점수가 이미 5.2 가중치로 계산돼 있으므로 다시 세지 않고 옮기기만 합니다.
 * 같은 사주에서 오행 합계와 십신 합계는 항상 같습니다.
 */
export function getShipsinScores(
  dayElement: Element,
  elements: ElementScores
): ShipsinScores {
  const dist = emptyScores()
  for (const el of ELEMENTS) {
    dist[getShipsin(dayElement, el)] += elements[el]
  }
  return dist
}

/**
 * 십신이 천간에 있는지 지지에만 있는지 (PRD 5.6).
 *
 * 같은 관성이라도 위치에 따라 해석이 달라집니다.
 *   천간에 있음    겉으로 드러나는 규율을 따름
 *   지지에만 있음   스스로 정한 기준으로 움직임
 *   없음           외부 평가에 무관심, 준비 방식이 자유로움
 *   과다           평가에 위축, 압박에 약함
 *
 * 일간 자신은 세지 않습니다. 일간은 본인이지 관계가 아닙니다.
 */
export type ShipsinPosition = '천간과 지지' | '천간에만' | '지지에만' | '없음' | '과다'

/** 전체 점수 대비 이 비율을 넘으면 과다로 봅니다 */
const EXCESS_RATIO = 0.4

export function getShipsinPosition(
  saju: Saju,
  scores: ShipsinScores
): Record<Shipsin, ShipsinPosition> {
  const dayElement = saju.day.stemElement

  const inStem = new Set<Shipsin>()
  const inBranch = new Set<Shipsin>()

  // 일간을 뺀 나머지 일곱 글자(시간을 모르면 다섯 글자)를 봅니다
  const stems = [saju.year.stemElement, saju.month.stemElement]
  const branches = [
    saju.year.branchElement,
    saju.month.branchElement,
    saju.day.branchElement,
  ]
  if (saju.hour) {
    stems.push(saju.hour.stemElement)
    branches.push(saju.hour.branchElement)
  }

  for (const el of stems) inStem.add(getShipsin(dayElement, el))
  for (const el of branches) inBranch.add(getShipsin(dayElement, el))

  const total = SHIPSIN_KEYS.reduce((a, k) => a + scores[k], 0)

  const out = {} as Record<Shipsin, ShipsinPosition>
  for (const k of SHIPSIN_KEYS) {
    // 과다 판정이 위치 판정보다 앞섭니다. 어디에 있느냐보다 얼마나 많으냐가
    // 해석을 먼저 가릅니다 (PRD 5.6).
    if (total > 0 && scores[k] / total > EXCESS_RATIO) {
      out[k] = '과다'
      continue
    }
    const s = inStem.has(k)
    const b = inBranch.has(k)
    out[k] = s && b ? '천간과 지지' : s ? '천간에만' : b ? '지지에만' : '없음'
  }
  return out
}

export interface ShipsinProfile {
  scores: ShipsinScores
  position: Record<Shipsin, ShipsinPosition>
  /** 점수가 가장 높은 십신 */
  strong: Shipsin
}

export function getShipsinProfile(
  saju: Saju,
  elements: ElementScores
): ShipsinProfile {
  const scores = getShipsinScores(saju.day.stemElement, elements)

  // 동점이면 비겁 → 식상 → 재성 → 관성 → 인성 순으로 앞선 것을 씁니다.
  // 오행 강약(5.3)과 달리 PRD가 동점 규칙을 두지 않아 순서를 고정했습니다.
  let strong: Shipsin = SHIPSIN_KEYS[0]
  for (const k of SHIPSIN_KEYS) {
    if (scores[k] > scores[strong]) strong = k
  }

  return { scores, position: getShipsinPosition(saju, scores), strong }
}

/** 가중치 합계. 시간을 모르면 8이 아니라 6에서 시작합니다 (PRD 5.2) */
export function totalWeight(hasBirthTime: boolean): number {
  const base =
    WEIGHTS.dayStem +
    WEIGHTS.monthBranch +
    WEIGHTS.yearStem +
    WEIGHTS.yearBranch +
    WEIGHTS.monthStem +
    WEIGHTS.dayBranch
  return hasBirthTime ? base + WEIGHTS.hourStem + WEIGHTS.hourBranch : base
}
