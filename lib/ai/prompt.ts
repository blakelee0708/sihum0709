/**
 * 프롬프트 구성 (PRD 8.15, 18장)
 *
 * AI에 전달할 재료는 모두 코드가 계산한 확정값입니다.
 * AI는 문장만 생성하며 숫자와 판정을 임의로 만들지 않도록 지시합니다.
 */

import { F, P } from '../content/fragments'
import type { FreeResult } from '../content/assemble'
import { getJobPhrase } from '../content/assemble'
import { WORK_TYPE_LABEL, type Element } from '../saju/constants'
import type { CompatibilityResult } from '../saju/compatibility'
import { getMonthFlow, type MonthFlow } from '../saju/fortune'
import type { ReportSpec } from './spec'

/**
 * 톤 예시 (PRD 18.3 톤 분리).
 *
 * fragments.json의 실제 조각 3개를 그대로 보여줍니다. 문체 지시를 말로
 * 설명하는 것보다 실물을 보여주는 쪽이 정확합니다.
 * 변수는 예시 값으로 치환해 프롬프트가 {name} 같은 자리표시자를
 * 흉내내지 않게 합니다.
 */
const TONE_EXAMPLES = [
  F.dayStem['병화'],
  F.strongElement['화'],
  F.verdict['35-49'],
]
  .map((t) =>
    t
      .replace(/\{name\}님/g, '김민준님')
      .replace(/\{exam\}/g, '국가직 9급 공무원')
      .replace(/\{examDate\}\{examParticle\}/g, '4월 11일은')
  )
  .map((t, i) => `예시 ${i + 1})\n${t}`)
  .join('\n\n')

export interface PromptMaterial {
  reportType: string
  ddayRange: string
  sectionSpec: string[]
  user: {
    name: string | null
    dayStem: string
    pillars: { year: string; month: string; day: string; hour: string | null }
    elements: Record<Element, number>
    strongElement: Element
    weakElement: Element
    luckyNumber: number
    luckyColor: string
    luckyDirection: string
    hasBirthTime: boolean
  }
  exam: {
    name: string
    type: string
    workType?: string
    jobTitle?: string
    companyScale?: string
    date: string
    startTime: string | null
    dday: number
  }
  company?: {
    name: string
    founded: string | null
    dayStem?: string
    elements?: Record<Element, number>
    strongElement?: Element
  }
  fortune: {
    examDayScore: number
    examDayRelation: string
    startTimeRelation: string | null
    compatibilityScore?: number
    compatibilityRelation?: string
    methodFit: Record<string, number>
    weekFlow: { dday: number; date: string; score: number; relation: string }[]
    monthFlow: { month: number; score: number }[]
  }
  fragments: {
    compatibility?: string
    position?: string
  }
  search: {
    companyInfo?: string
    examSubjects?: string
  }
}

export interface BuildPromptInput {
  result: FreeResult
  spec: ReportSpec
  companyName?: string | null
  compatibility?: CompatibilityResult | null
  foundedDate?: string | null
  searchCompanyInfo?: string
  searchExamSubjects?: string
}

export function buildMaterial(input: BuildPromptInput): PromptMaterial {
  const { result, spec } = input
  const { saju, profile, input: userInput } = result

  const year = new Date(userInput.examDate).getFullYear()
  const monthFlow: MonthFlow[] = getMonthFlow(saju, year)

  const material: PromptMaterial = {
    reportType: spec.type,
    ddayRange: spec.ddayRange,
    sectionSpec: spec.sections.map((s) => s.key),
    user: {
      name: userInput.name ?? null,
      dayStem: saju.dayStemName,
      pillars: {
        year: saju.year.name,
        month: saju.month.name,
        day: saju.day.name,
        hour: saju.hour?.name ?? null,
      },
      elements: profile.scores,
      strongElement: profile.strong,
      weakElement: profile.weak,
      luckyNumber: result.luckyNumber,
      luckyColor: result.luckyColor,
      luckyDirection: result.luckyDirection,
      hasBirthTime: userInput.hasBirthTime,
    },
    exam: {
      name: userInput.examName,
      type: userInput.examType,
      workType: userInput.workType ? WORK_TYPE_LABEL[userInput.workType] : undefined,
      jobTitle: getJobPhrase(userInput.jobTitle, userInput.workType) || undefined,
      companyScale: userInput.companyScale ?? undefined,
      date: userInput.examDate,
      startTime: userInput.startTime ?? null,
      dday: result.dday,
    },
    fortune: {
      examDayScore: result.examDayScore,
      examDayRelation: result.examDayRelation,
      startTimeRelation: result.startTime?.relation ?? null,
      methodFit: result.methodFit,
      weekFlow: result.weekFlow.map((d) => ({
        dday: d.dday,
        date: d.date,
        score: d.score,
        relation: d.relation,
      })),
      monthFlow: monthFlow.map((m) => ({ month: m.month, score: m.score })),
    },
    fragments: {},
    search: {},
  }

  if (input.companyName) {
    material.company = {
      name: input.companyName,
      founded: input.foundedDate ?? null,
    }
  }

  if (input.compatibility) {
    const c = input.compatibility
    material.company = {
      name: input.companyName ?? '',
      founded: input.foundedDate ?? null,
      dayStem: c.company.dayStemName,
      elements: c.companyProfile.scores,
      strongElement: c.companyProfile.strong,
    }
    material.fortune.compatibilityScore = c.score
    material.fortune.compatibilityRelation = c.relation
    // 미리 쓴 조각이 앞에 놓이고 AI 생성분이 뒤에 붙습니다 (README 유료 조각 사용)
    material.fragments.compatibility = P.compatibility[c.relation]
  } else if (spec.type === '면접') {
    material.fragments.position = P.positionByStrong[profile.strong]
  }

  if (input.searchCompanyInfo) material.search.companyInfo = input.searchCompanyInfo
  if (input.searchExamSubjects) material.search.examSubjects = input.searchExamSubjects

  return material
}

/**
 * 시스템 프롬프트.
 *
 * 이 부분은 매 요청 동일하므로 프롬프트 캐싱 대상입니다 (PRD 8.12).
 */
export const SYSTEM_PROMPT = `당신은 사주 명리를 바탕으로 시험 준비 가이드를 쓰는 전문가입니다.

[역할]
숫자와 판정은 이미 코드가 계산해 재료로 전달됩니다. 당신은 문장만 씁니다.
재료에 없는 숫자, 관계 판정, 오행 분포, 점수를 새로 만들지 마십시오.
재료에 있는 값을 바꾸거나 반올림하지도 마십시오.

[문체]
- 격식체를 씁니다. "~습니다", "~시기 바랍니다"
- 한 섹션은 5-6문장으로 씁니다
- 구어체와 이모지를 쓰지 않습니다
- 문장을 "이런 면이 있고, 대신 이런 면이 있다" 구조로 씁니다

[톤 예시]
아래는 이 서비스의 무료 구간에서 쓰는 실제 문장입니다. 같은 톤으로 쓰십시오.

${TONE_EXAMPLES}

[표현 금지]
- 합격을 보장하거나 암시하는 표현: "이렇게 하면 붙습니다", "합격이 보장된 날입니다"
- 결과를 단정하는 표현: "이 시험은 떨어집니다", "운이 나쁜 날입니다"
- 최상급 수식: "가장 강력한", "매우 효과적인", "훨씬 유리합니다"
- 검색 결과에 없는 정보를 지어내기
- 특정 기업의 부정적 평판 서술
- 설립일을 추측해서 궁합을 계산하기

[검색 결과 서술]
확인된 내용만 씁니다. 확정적으로 쓰지 말고 다음처럼 씁니다.
  금지: "OO기업 2차 면접은 PT입니다"
  사용: "후기에서 PT 형식이 언급되는 경우가 많습니다. 확정 전형은 채용 공고를 확인하시기 바랍니다."
  금지: "국가직 9급은 5과목 100문항입니다"
  사용: "검색 기준 5과목 구성으로 확인되나, 최신 과목 개편은 주관기관 공고를 확인하시기 바랍니다"
확인되지 않은 항목은 생략하고 일반적인 관점으로 대체합니다.
재료의 search 항목이 비어 있거나 "검색 미연동"으로 시작하면, 검색으로 확인된
사실이 없는 것입니다. 과목명, 설립일, 전형 방식을 지어내지 마십시오.

[낮은 점수 처리]
점수가 낮게 나온 경우에도 불안을 키우지 않고 행동으로 마무리합니다.

  "시험일 기운은 밀어주는 쪽은 아닙니다. 다만 이런 날은 컨디션이 아니라
   준비량이 결과를 만드는 날이라, 평소보다 30분 일찍 도착해서 몸을 먼저
   적응시키면 차이가 거의 없어집니다."

이 형태로 씁니다. 낮은 점수 판정에는 반드시 행동 조언을 붙입니다.

[일관성]
사주에서 오행이 강하다는 것은 좋은 것도 나쁜 것도 아니고 특성입니다.
한 섹션 안에서 좋다와 나쁘다를 섞어 결론을 흐리지 마십시오.

[출력 형식]
JSON 객체 하나만 출력합니다. 코드 블록 표시나 설명을 붙이지 마십시오.
{ "섹션키": "본문", ... }
요청받은 섹션 키를 빠짐없이 채웁니다. 키 이름을 바꾸지 마십시오.`

/** 사용자 메시지 — 재료 JSON과 섹션별 지시 */
export function buildUserPrompt(
  material: PromptMaterial,
  spec: ReportSpec
): string {
  const aiSections = spec.sections.filter((s) => s.source !== 'calc')

  const instructions = aiSections
    .map((s) => `- ${s.key} (${s.title}): ${s.brief ?? ''}`)
    .join('\n')

  const fragmentNote = material.fragments.compatibility
    ? `\n[궁합 섹션 주의]\n아래 조각이 이미 리포트에 실립니다. 같은 말을 반복하지 말고 기업 정보와 결합한 확장 해석만 쓰십시오.\n"${material.fragments.compatibility}"\n`
    : material.fragments.position
      ? `\n[위치 섹션 주의]\n아래 조각이 이미 리포트에 실립니다. 같은 말을 반복하지 말고 직무 맥락 확장만 쓰십시오.\n"${material.fragments.position}"\n`
      : ''

  return `[재료]
${JSON.stringify(material, null, 2)}

[작성할 섹션]
${instructions}
${fragmentNote}
위 섹션 키를 모두 담은 JSON 객체 하나만 출력하십시오.`
}
