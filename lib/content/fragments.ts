/**
 * 문장 조각 로더 (PRD 3.7, 8.18)
 *
 * fragments.json 무료 222개, paid-fragments.json 유료 25개,
 * preset-exams.json 대분류 10개 · 시험명 73개, quotes.json 응원 문구 17개.
 *
 * 조각을 코드에서 새로 만들거나 수정하지 않습니다. JSON 파일이 원본입니다.
 */

import fragmentsJson from './fragments.json'
import paidFragmentsJson from './paid-fragments.json'
import presetExamsJson from './preset-exams.json'
import quotesJson from './quotes.json'

import type {
  CompanyScale,
  Element,
  ExamType,
  Relation,
  WorkType,
} from '../saju/constants'

type ByElement = Record<Element, string>
type ByMethod = Record<ExamType, string>
type ByRelation = Record<Relation, string>

export interface Fragments {
  /** D-day 구간 5 */
  speechBubble: Record<string, string>
  /** 강한 오행 5 */
  typeDescription: ByElement
  /** 일간 10 */
  dayStem: Record<string, string>
  strongElement: ByElement
  weakElement: ByElement
  /** 시험일 일진 관계 5 */
  dayRelation: ByRelation
  /** 당일 운 지수 구간 5 */
  verdict: Record<string, string>
  /** 방식 4 × 변형 7 */
  methodIntro: Record<ExamType, string[]>
  methodByStrong: Record<ExamType, ByElement>
  methodByWeak: Record<ExamType, ByElement>
  /** 일의 성격 4 × 강한 오행 5 (면접) */
  workTypeByStrong: Record<WorkType, ByElement>
  /** 기업 규모 6 (면접) */
  companyScale: Record<CompanyScale, string>
  luckyNumberByWeak: ByElement
  numberUseByMethod: ByMethod
  /** 유료 리포트로 이관 (PRD 3.7) */
  luckyColorByWeak: ByElement
  /** 유료 리포트로 이관 */
  outfitByMethod: ByMethod
  eveByStrong: ByElement
  eveByWeak: ByElement
  eveByMethod: ByMethod
  /** 일별 기운 지수 구간 6 */
  flowLabel: Record<string, string>
  /** 방식 4 × 관계 5 */
  startTimeByRelation: Record<ExamType, ByRelation>
  /** 카드 2 오행 요약 — 강한 오행 5 */
  elementSummary: ByElement
  /** 카드 3 7일 흐름 요약 — 구간 6 */
  weekFlowSummary: Record<string, string>
  /** 카드 7 피해야 할 색 — 강한 오행 5 */
  avoidColorByStrong: ByElement
  /** 유료 리포트로 이관 — 약한 오행 5 */
  directionByWeak: ByElement
  /** 유료 리포트로 이관 — 약한 오행 5 */
  timeSlotByWeak: ByElement
  /** 부분 잠금 티저 4 (PRD 3.4) */
  lockTeaser: Record<string, string>
}

export interface PaidFragments {
  /** 기업 일간 관계 5 */
  compatibility: ByRelation
  /** 강한 오행 5 (설립일 미확인 시 대체) */
  positionByStrong: ByElement
  /** 십신 해석 — 일간 10 (PRD 8.3 섹션 2) */
  shipsinByDayStem: Record<string, string>
  /** 반복 패턴 — 강한 오행 5 (PRD 8.3 섹션 14) */
  patternByStrong: ByElement
}

export const F = fragmentsJson as unknown as Fragments
export const P = paidFragmentsJson as unknown as PaidFragments

// ─── 프리셋 시험 (PRD 10.1, 10.3) ───

export interface PresetSubGroup {
  id: string
  label: string
  exams: string[]
}

export interface PresetCategory {
  id: string
  label: string
  defaultType: ExamType | null
  /** subGroups가 있으면 exams는 없습니다. 2단계로 물어봅니다 (PRD 10.3) */
  exams?: string[]
  subGroups?: PresetSubGroup[]
  /** 시험 기간을 묻는 분류 (PRD 10.4 대학교 시험) */
  hasExamPeriod?: boolean
  /** 프리셋 버튼 없이 바로 입력창을 띄웁니다 */
  freeInputOnly?: boolean
}

export const PRESET_CATEGORIES: PresetCategory[] = (
  presetExamsJson as { categories: PresetCategory[] }
).categories

export function getCategory(id: string): PresetCategory | undefined {
  return PRESET_CATEGORIES.find((c) => c.id === id)
}

export function getSubGroup(
  category: PresetCategory | undefined,
  subGroupId: string | undefined
): PresetSubGroup | undefined {
  if (!category?.subGroups || !subGroupId) return undefined
  return category.subGroups.find((g) => g.id === subGroupId)
}

/**
 * 직접 입력창의 예시 문구 (PRD 10.3).
 *
 * 대분류의 시험명 세 개를 가져다 씁니다. 전에는 모든 분류에서
 * "예) 국가직 9급 공무원, LEET, 토익"이 나왔습니다. 기업 필기를 고른
 * 사람에게 공무원 시험을 예시로 보여주면 잘못 골랐나 싶어집니다.
 *
 * 하위 그룹이 있으면 그 그룹의 목록을 씁니다. 어학을 골랐는데
 * 자격증 예시가 나오면 안 됩니다.
 */
export function getExamPlaceholder(
  category: PresetCategory | undefined,
  subGroupId?: string
): string {
  const examples = getExamOptions(category, subGroupId).slice(0, 3)
  if (examples.length === 0) return '예) 국가직 9급 공무원, LEET, 토익'
  return `예) ${examples.join(', ')}`
}

/** 대분류가 제공하는 시험명 목록. 하위 그룹이 있으면 그 그룹의 목록입니다 */
export function getExamOptions(
  category: PresetCategory | undefined,
  subGroupId?: string
): string[] {
  if (!category) return []
  if (category.subGroups) return getSubGroup(category, subGroupId)?.exams ?? []
  return category.exams ?? []
}

// ─── 응원 문구 (PRD 3.2 카드 뒤) ───

export interface Quotes {
  header: string
  quotes: string[]
}

export const QUOTES = quotesJson as Quotes

/**
 * 응원 문구를 하나 고릅니다.
 *
 * seed를 주면 같은 입력에 같은 문구가 나옵니다. 무료 결과는 같은 입력에
 * 항상 같은 결과여야 하므로(PRD 3.1) 결과 화면에서는 seed를 넘깁니다.
 * 랜딩처럼 매번 달라도 되는 자리에서는 생략합니다.
 */
export function pickQuote(seed?: number): string {
  const list = QUOTES.quotes
  const i =
    seed === undefined
      ? Math.floor(Math.random() * list.length)
      : Math.abs(Math.trunc(seed)) % list.length
  return list[i]
}
