/**
 * 리포트 생성 파이프라인 (PRD 8.6 ~ 8.15)
 *
 * 순서
 *   1. 조회 기록으로 무료 결과를 다시 계산 (같은 입력 → 같은 결과)
 *   2. D-day 구간을 판정해 섹션 구성을 고름 (코드가 결정, AI에 맡기지 않음)
 *   3. 검색 (면접만 2회. 필기·실기·오디션은 0회 — PRD 8.12)
 *   4. 설립일이 확인되면 궁합 계산, 아니면 대체 섹션으로 전환
 *   5. AI 호출
 *   6. 분량 검증 — 목표의 70%에 못 미치면 실패로 돌립니다 (PRD 8.3)
 */

import { buildFreeResult, type UserInput } from '../content/assemble'
import { getCompatibility, type CompatibilityResult } from '../saju/compatibility'
import { getReportDdayRange } from '../saju/fortune'
import { generateReport } from './generate'
import { checkLength, type LengthCheck } from './length'
import { GenerateError, type GenerateResult } from './provider'
import { buildMaterial, type PromptMaterial } from './prompt'
import { stripFragmentEcho } from './fragment'
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
  /**
   * 서버 기준 현재 시각 (PRD 8.16 exam.now).
   * D-DAY 구성의 "지금부터"를 만들려면 결제 시각이 필요합니다.
   */
  now?: Date
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
  /**
   * 검색에 쓴 시간 (밀리초). 필기는 검색이 없어 0입니다.
   *
   * 면접이 필기보다 오래 걸리는 원인이 검색인지 생성인지 가르려고 나눠
   * 잽니다. 두 검색은 Promise.all로 병렬이므로 느린 쪽 하나의 시간입니다.
   */
  searchMs: number
  /** 분량 실측. reports.total_chars에 기록합니다 */
  length: LengthCheck
  /**
   * 화면에서 AI 생성분 앞에 붙일 조각 (PRD 8.18).
   * 순서를 바꾸면 사주 해석의 일관성이 무너집니다.
   */
  fragments: PromptMaterial['fragments']
  reportType: '필기' | '면접'
  ddayRange: string
}

/**
 * 섹션별 글자 수를 한 줄로 남깁니다.
 *
 * 미달이 없으면 요약만, 있으면 어느 섹션이 몇 자 모자란지까지 씁니다.
 * 로그를 훑어 반복 미달 섹션을 찾을 수 있어야 프롬프트를 고칠 수 있습니다.
 */
function logSectionLengths(type: ReportSpec['type'], length: LengthCheck): void {
  const head =
    `[분량] ${type} 합계 ${length.total}자 / 하한 ${length.target}자 ` +
    `(${Math.round(length.ratio * 100)}%) · ` +
    `미달 ${length.short.length}개 초과 ${length.long.length}개`

  if (length.short.length === 0 && length.long.length === 0) {
    console.info(head)
    return
  }

  const detail = [
    ...length.short.map((s) => `${s.key} ${s.chars}/${s.minChars}↓`),
    ...length.long.map((l) => `${l.key} ${l.chars}/${l.maxChars}↑`),
  ].join(', ')

  console.warn(`${head} · ${detail}`)
}

/**
 * 조각이 앞에 실리는 섹션에서 조각 메아리를 지웁니다 (PRD 8.18).
 *
 * 어느 섹션에 어느 조각이 붙는지는 화면(app/report/[id]/page.tsx)과
 * 같은 대응입니다. 한쪽만 고치면 다시 어긋납니다.
 */
function stripEchoes(
  content: Record<string, string>,
  fragments: PromptMaterial['fragments']
): Record<string, string> {
  const pairs: [string, string | undefined][] = [
    ['pattern', fragments.shipsin],
    ['strategy', fragments.pattern],
    ['compatibility', fragments.compatibility ?? fragments.position],
  ]

  const out = { ...content }
  for (const [key, fragment] of pairs) {
    if (out[key]) out[key] = stripFragmentEcho(out[key], fragment)
  }
  return out
}

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const result = buildFreeResult(input.userInput)

  const reportType = toReportType(input.userInput.examType)
  if (!reportType) {
    // 실기와 오디션은 1차 출시에서 유료 상품을 제공하지 않습니다 (PRD 8.2)
    throw new Error(`${input.userInput.examType}는 유료 리포트를 제공하지 않습니다`)
  }

  const ddayRange = getReportDdayRange(result.dday)
  const examYear = Number(input.userInput.examDate.slice(0, 4))

  // 시작 시각을 모르면 섹션 4를 시간대 없는 구성으로 바꿉니다 (PRD 8.16)
  let spec = getReportSpec(reportType, ddayRange, examYear, {
    hasStartTime: Boolean(input.userInput.startTime),
  })

  const searchLogs: PipelineOutput['searchLogs'] = []
  let searchCredits = 0
  let searchMs = 0
  let compatibility: CompatibilityResult | null = null
  let foundedDate: string | null = null
  let companyInfo: string | undefined

  if (reportType === '면접' && input.companyName) {
    // 검색 2회 (PRD 8.12). 병렬로 부르므로 둘 중 느린 쪽만큼만 걸립니다.
    const searchStarted = Date.now()
    const [founded, info] = await Promise.all([
      search(SEARCH_QUERIES.companyFounded(input.companyName)),
      search(SEARCH_QUERIES.companyInfo(input.companyName)),
    ])
    searchMs = Date.now() - searchStarted

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
  }

  // 필기는 검색하지 않습니다 (PRD 8.12). 과목 정보를 쓰지 않기로 했고,
  // 사내 승진시험이나 소규모 자격증은 어차피 검색이 실패합니다.

  const material = buildMaterial({
    result,
    spec,
    companyName: input.companyName,
    compatibility,
    foundedDate,
    searchCompanyInfo: companyInfo,
    now: input.now,
  })

  const generated = await generateReport(material, spec)

  // 조각이 앞에 다시 실리는 섹션에서 모델이 조각을 한 번 더 씁니다.
  // 프롬프트로 여덟 번 말렸는데 여덟 번 다 반복했습니다. 코드가 지웁니다.
  //
  // 분량을 재기 전에 지웁니다. 메아리가 남아 있으면 마지막 섹션이 조각
  // 265자만큼 부풀어 상한을 넘긴 것으로 잘못 잽니다.
  if (!generated.mock) {
    generated.content = stripEchoes(generated.content, material.fragments)
  }

  // 목업은 자리 채움이라 분량을 재는 의미가 없습니다
  const length = checkLength(generated.content, spec)

  if (!generated.mock && !length.ok) {
    throw new GenerateError(
      '분량 미달',
      `${length.total}자 / 하한 ${length.target}자 (${Math.round(length.ratio * 100)}%)`
    )
  }

  // 섹션별 분량을 항상 남깁니다 (PRD 8.3).
  //
  // 합계가 하한의 98퍼센트여도 섹션 절반이 하한을 밑돌면 사용자는 어떤
  // 부분을 얇게 느낍니다. 합계만 봐서는 그것이 보이지 않습니다. 어느 섹션이
  // 반복해서 미달인지 운영 중에도 보려고 섹션 단위로 남깁니다.
  if (!generated.mock) {
    logSectionLengths(spec.type, length)
  }

  // 넘친 것은 실패로 돌리지 않습니다. 이미 쓴 원가를 버리고 다시 쓰면
  // 손해가 두 배가 됩니다. 프롬프트를 조정할 신호만 남깁니다 (PRD 8.3).
  if (!generated.mock && length.over) {
    console.warn(
      `[분량 초과] ${spec.type} ${length.total}자 / 상한 ${length.targetMax}자 ` +
        `(${Math.round((length.total / length.targetMax) * 100)}%) · ` +
        `초과 섹션: ${length.long.map((l) => `${l.key} ${l.chars}/${l.maxChars}`).join(', ')}`
    )
  }

  return {
    spec,
    generated,
    length,
    fragments: material.fragments,
    compatibility,
    foundedDate,
    searchLogs,
    searchCredits,
    searchMs,
    reportType,
    ddayRange,
  }
}
