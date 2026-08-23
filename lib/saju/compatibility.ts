/**
 * 기업 궁합 계산 (PRD 6.7, 유료 면접 전용)
 *
 * 기본 50에서 시작해
 *   [1] 사용자 일간 오행 vs 기업 일간 오행 관계
 *   [2] 기업 3기둥 오행 분포에서 사용자의 약한 오행이 가장 많으면 +20
 *   [3] 사용자 강한 오행과 기업 강한 오행이 같으면 +10
 *   [4] 0-100 클램프
 */

import { calculateCompanySaju, type CompanySaju, type Saju } from './calculate'
import {
  getCompanyElementProfile,
  getRelation,
  type ElementProfile,
} from './elements'
import {
  BASE_SCORE,
  COMPAT_SCORE_BY_RELATION,
  ELEMENTS,
  type Element,
  type Relation,
} from './constants'

export interface CompatibilityResult {
  score: number
  relation: Relation
  company: CompanySaju
  companyProfile: ElementProfile
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function getCompatibility(
  saju: Saju,
  strong: Element,
  weak: Element,
  foundedDate: string
): CompatibilityResult {
  const company = calculateCompanySaju(foundedDate)
  const companyProfile = getCompanyElementProfile(company)

  // [1] 일간 오행 관계
  const relation = getRelation(saju.dayStemElement, company.dayStemElement)
  let score = BASE_SCORE + COMPAT_SCORE_BY_RELATION[relation]

  // [2] 기업 오행 분포에서 사용자의 약한 오행이 가장 많은 비중이면 +20
  const max = Math.max(...ELEMENTS.map((e) => companyProfile.scores[e]))
  if (companyProfile.scores[weak] === max && max > 0) score += 20

  // [3] 강한 오행이 서로 같으면 +10
  if (companyProfile.strong === strong) score += 10

  return {
    score: clamp(score),
    relation,
    company,
    companyProfile,
  }
}
