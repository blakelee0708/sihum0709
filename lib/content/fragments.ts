/**
 * 문장 조각 로더 (README 조각 구조)
 *
 * fragments.json 무료 167개, paid-fragments.json 유료 10개.
 * 조각을 새로 만들거나 수정하지 않습니다. JSON 파일이 원본입니다.
 */

import fragmentsJson from './fragments.json'
import paidFragmentsJson from './paid-fragments.json'
import presetExamsJson from './preset-exams.json'

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
  /** 방식 3 × 변형 7 */
  methodIntro: Record<ExamType, string[]>
  methodByStrong: Record<ExamType, ByElement>
  methodByWeak: Record<ExamType, ByElement>
  /** 일의 성격 4 × 강한 오행 5 (면접) */
  workTypeByStrong: Record<WorkType, ByElement>
  /** 기업 규모 6 (면접) */
  companyScale: Record<CompanyScale, string>
  luckyNumberByWeak: ByElement
  numberUseByMethod: ByMethod
  luckyColorByWeak: ByElement
  outfitByMethod: ByMethod
  eveByStrong: ByElement
  eveByWeak: ByElement
  eveByMethod: ByMethod
  /** 일별 기운 지수 구간 6 */
  flowLabel: Record<string, string>
  /** 방식 3 × 관계 5 */
  startTimeByRelation: Record<ExamType, ByRelation>
}

export interface PaidFragments {
  /** 기업 일간 관계 5 */
  compatibility: ByRelation
  /** 강한 오행 5 (설립일 미확인 시 대체) */
  positionByStrong: ByElement
}

export const F = fragmentsJson as unknown as Fragments
export const P = paidFragmentsJson as unknown as PaidFragments

// ─── 프리셋 시험 (PRD 14.7) ───

export interface PresetCategory {
  id: string
  label: string
  defaultType: ExamType | null
  exams: string[]
  freeInputOnly?: boolean
}

export const PRESET_CATEGORIES: PresetCategory[] = (
  presetExamsJson as { categories: PresetCategory[] }
).categories

export function getCategory(id: string): PresetCategory | undefined {
  return PRESET_CATEGORIES.find((c) => c.id === id)
}
