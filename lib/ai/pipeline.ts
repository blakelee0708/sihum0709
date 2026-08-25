/**
 * 리포트 생성 파이프라인 (PRD 8.6 ~ 8.15)
 *
 * 순서
 *   1. 조회 기록으로 무료 결과를 다시 계산 (같은 입력 → 같은 결과)
 *   2. D-day 구간을 판정해 섹션 구성을 고름 (코드가 결정, AI에 맡기지 않음)
 *   3. 검색 (필기 1회, 면접 2회)
 *   4. 설립일이 확인되면 궁합 계산, 아니면 대체 섹션으로 전환
 *   5. AI 호출
 */

import { buildFreeResult, type UserInput } from '../content/assemble'
import { getCompatibility, type CompatibilityResult } from '../saju/compatibility'
import { getReportDdayRange } from '../saju/fortune'
import { generateReport } from './generate'
import type { GenerateResult } from './provider'
import { buildMaterial } from './prompt'
import {
  applyMissingFoundedDate,
  getReportSpec,
  toReportType,
  type ReportSpec,
} from './spec'
import { SEARCH_QUERIES, extractFoundedDate, search } from './search'

export interface PipelineInput {
  userInput: UserInput
  /** 면접 유료에서만 받습니다 */
  companyName?: string | null
}

export interface PipelineOutput {
  spec: ReportSpec
  generated: GenerateResult
  compatibility: CompatibilityResult | null
  foundedDate: string | null
  /** 검색 로그 기록용 (PRD 22.14) */
  searchLogs: { queryType: 'company' | 'exam'; keyword: string; success: boolean }[]
  /** 이번 생성에 쓴 검색 크레딧 합계 */
  searchCredits: number
  reportType: '필기' | '면접'
  ddayRange: string
}

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const result = buildFreeResult(input.userInput)

  const reportType = toReportType(input.userInput.examType)
  if (!reportType) {
    // 실기는 1차 출시에서 유료 상품을 제공하지 않습니다 (PRD 8.2)
    throw new Error('실기는 유료 리포트를 제공하지 않습니다')
  }

  const ddayRange = getReportDdayRange(result.dday)
  const examYear = Number(input.userInput.examDate.slice(0, 4))
  let spec = getReportSpec(reportType, ddayRange, examYear)

  const searchLogs: PipelineOutput['searchLogs'] = []
  let searchCredits = 0
  let compatibility: CompatibilityResult | null = null
  let foundedDate: string | null = null
  let companyInfo: string | undefined
  let examSubjects: string | undefined

  if (reportType === '면접' && input.companyName) {
    // 검색 2회 (PRD 8.10)
    const [founded, info] = await Promise.all([
      search(SEARCH_QUERIES.companyFounded(input.companyName)),
      search(SEARCH_QUERIES.companyInfo(input.companyName)),
    ])

    foundedDate = founded.success ? extractFoundedDate(founded.context) : null
    companyInfo = info.success ? info.context : undefined

    searchCredits += founded.credits + info.credits
    searchLogs.push(
      { queryType: 'company', keyword: input.companyName, success: founded.success },
      { queryType: 'company', keyword: input.companyName, success: info.success }
    )

    if (foundedDate) {
      compatibility = getCompatibility(
        result.saju,
        result.profile.strong,
        result.profile.weak,
        foundedDate
      )
    } else {
      // 설립일 미확인이면 궁합 섹션을 대체 섹션으로 바꿉니다 (PRD 8.7)
      spec = applyMissingFoundedDate(spec)
    }
  } else if (reportType === '필기') {
    // 검색 1회 (PRD 8.10, 8.11)
    const subjects = await search(SEARCH_QUERIES.examSubjects(input.userInput.examName))
    examSubjects = subjects.success ? subjects.context : undefined
    searchCredits += subjects.credits
    searchLogs.push({
      queryType: 'exam',
      keyword: input.userInput.examName,
      success: subjects.success,
    })
  }

  const material = buildMaterial({
    result,
    spec,
    companyName: input.companyName,
    compatibility,
    foundedDate,
    searchCompanyInfo: companyInfo,
    searchExamSubjects: examSubjects,
  })

  const generated = await generateReport(material, spec)

  return {
    spec,
    generated,
    compatibility,
    foundedDate,
    searchLogs,
    searchCredits,
    reportType,
    ddayRange,
  }
}
