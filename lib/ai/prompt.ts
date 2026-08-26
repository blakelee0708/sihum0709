/**
 * 프롬프트 구성 (PRD 8.5, 8.6, 8.16, 18장)
 *
 * AI에 전달할 재료는 모두 코드가 계산한 확정값입니다.
 * AI는 문장만 생성하며 숫자와 판정을 임의로 만들지 않도록 지시합니다.
 */

import { F, P } from '../content/fragments'
import type { FreeResult } from '../content/assemble'
import { getJobPhrase } from '../content/assemble'
import {
  BRANCHES,
  BRANCH_ELEMENT,
  BRANCH_HANJA,
  WORK_TYPE_LABEL,
  type Element,
} from '../saju/constants'
import type { CompatibilityResult } from '../saju/compatibility'
import { getMonthFlow, getTimeSlots, type MonthFlow, type TimeSlot } from '../saju/fortune'
import {
  SHIPSIN_MEANING,
  getShipsinProfile,
  type Shipsin,
  type ShipsinPosition,
} from '../saju/shipsin'
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

/** PRD 8.6 12지지 표. 섹션 4가 쓰는 재료라 프롬프트에 그대로 넣습니다 */
const BRANCH_TABLE = BRANCHES.map((b, i) => {
  const from = (23 + i * 2) % 24
  const to = (from + 1) % 24
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(from)}:00-${pad(to)}:59  ${b}시(${BRANCH_HANJA[i]}時)  ${BRANCH_ELEMENT[i]}`
}).join('\n')

/** PRD 5.6 표 */
const SHIPSIN_TABLE = (Object.keys(SHIPSIN_MEANING) as Shipsin[])
  .map((k) => `${k}  ${SHIPSIN_MEANING[k]}`)
  .join('\n')

export interface PromptMaterial {
  reportType: string
  ddayRange: string
  sectionSpec: string[]
  user: {
    name: string | null
    dayStem: string
    pillars: { year: string; month: string; day: string; hour: string | null }
    elements: Record<Element, number>
    /** PRD 5.6 십신 분포 */
    shipsin: Record<Shipsin, number>
    /** PRD 5.6 천간·지지 위치 */
    shipsinPosition: Record<Shipsin, ShipsinPosition>
    strongElement: Element
    weakElement: Element
    luckyNumber: number
    luckyNumbers: number[]
    luckyColor: string
    luckyDirection: string
    luckyHour: string
    hasBirthTime: boolean
  }
  exam: {
    name: string
    type: string
    /** 대학교 시험만 값이 있습니다 (PRD 10.4) */
    examPeriod?: string | null
    workType?: string
    jobTitle?: string
    companyScale?: string
    date: string
    startTime: string | null
    dday: number
    /** 시험 시작까지 남은 시간. 음수면 이미 시작했거나 끝났습니다 (PRD 8.16) */
    hoursUntilStart: number | null
    /** 서버 기준 현재 시각 */
    now: string
  }
  company?: {
    name: string
    founded: string | null
    dayStem?: string
    elements?: Record<Element, number>
    strongElement?: Element
  }
  /** PRD 8.6 — 시작 시각을 모르면 빈 배열입니다 */
  timeSlots: TimeSlot[]
  fortune: {
    examDayScore: number
    /** PRD 8.7 잠재력 발휘 지수 */
    potentialScore: number
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
    /** PRD 8.18 십신 조각 — 섹션 2 앞부분 */
    shipsin?: string
    /** PRD 8.18 반복 패턴 조각 — 마지막 섹션 앞부분 */
    pattern?: string
  }
  search: {
    companyInfo?: string
  }
}

export interface BuildPromptInput {
  result: FreeResult
  spec: ReportSpec
  companyName?: string | null
  compatibility?: CompatibilityResult | null
  foundedDate?: string | null
  searchCompanyInfo?: string
  /** 서버 기준 현재 시각. 테스트에서 고정하려고 받습니다 */
  now?: Date
}

/** 시험 시작까지 남은 시간(시간 단위). 시작 시각을 모르면 null */
export function getHoursUntilStart(
  examDate: string,
  startTime: string | null,
  now: Date
): number | null {
  if (!startTime) return null
  const [y, m, d] = examDate.split('-').map(Number)
  const [hh, mm] = startTime.split(':').map(Number)
  if ([y, m, d, hh, mm].some(Number.isNaN)) return null

  const start = new Date(y, m - 1, d, hh, mm, 0, 0)
  return Math.round(((start.getTime() - now.getTime()) / 3_600_000) * 10) / 10
}

export function buildMaterial(input: BuildPromptInput): PromptMaterial {
  const { result, spec } = input
  const { saju, profile, input: userInput } = result
  const now = input.now ?? new Date()

  const year = Number(userInput.examDate.slice(0, 4))
  const monthFlow: MonthFlow[] = getMonthFlow(saju, year)
  const shipsin = getShipsinProfile(saju, profile.scores)

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
      shipsin: shipsin.scores,
      shipsinPosition: shipsin.position,
      strongElement: profile.strong,
      weakElement: profile.weak,
      luckyNumber: result.luckyNumber,
      luckyNumbers: result.luckyNumbers,
      luckyColor: result.luckyColor,
      luckyDirection: result.luckyDirection,
      luckyHour: result.luckyHour,
      hasBirthTime: userInput.hasBirthTime,
    },
    exam: {
      name: userInput.examName,
      type: userInput.examType,
      examPeriod: userInput.examPeriod ?? null,
      workType: userInput.workType ? WORK_TYPE_LABEL[userInput.workType] : undefined,
      jobTitle: getJobPhrase(userInput.jobTitle, userInput.workType) || undefined,
      companyScale: userInput.companyScale ?? undefined,
      date: userInput.examDate,
      startTime: userInput.startTime ?? null,
      dday: result.dday,
      hoursUntilStart: getHoursUntilStart(
        userInput.examDate,
        userInput.startTime ?? null,
        now
      ),
      now: formatNow(now),
    },
    // 각 구간의 십신 관계를 코드가 미리 판정합니다. AI가 임의로 판단하지
    // 않게 하기 위함입니다 (PRD 8.16).
    timeSlots: getTimeSlots(saju.day.stemElement, userInput.startTime ?? null),
    fortune: {
      examDayScore: result.examDayScore,
      potentialScore: result.potentialScore,
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
    fragments: {
      // 섹션 2와 마지막 섹션은 조각이 앞에 놓이고 AI 생성분이 뒤에 붙습니다.
      // 순서를 바꾸면 사주 해석의 일관성이 무너집니다 (PRD 8.18).
      shipsin: P.shipsinByDayStem[saju.dayStemName],
      pattern: P.patternByStrong[profile.strong],
    },
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
    material.fragments.compatibility = P.compatibility[c.relation]
  } else if (spec.type === '면접') {
    material.fragments.position = P.positionByStrong[profile.strong]
  }

  if (input.searchCompanyInfo) material.search.companyInfo = input.searchCompanyInfo

  return material
}

/** 'YYYY-MM-DDTHH:mm:ss+09:00' — 서버 로컬 시각을 그대로 씁니다 */
function formatNow(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}` +
    `T${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}+09:00`
  )
}

/**
 * 시스템 프롬프트.
 *
 * 이 부분은 매 요청 동일하므로 프롬프트 캐싱 대상입니다 (PRD 8.13).
 */
export const SYSTEM_PROMPT = `당신은 사주 명리를 바탕으로 시험 준비 가이드를 쓰는 전문가입니다.

[역할]
숫자와 판정은 이미 코드가 계산해 재료로 전달됩니다. 당신은 문장만 씁니다.
재료에 없는 숫자, 관계 판정, 오행 분포, 점수를 새로 만들지 마십시오.
재료에 있는 값을 바꾸거나 반올림하지도 마십시오.

[문체]
- 격식체를 씁니다. "~습니다", "~시기 바랍니다"
- 구어체와 이모지를 쓰지 않습니다
- 문장을 "이런 면이 있고, 대신 이런 면이 있다" 구조로 씁니다

[근거 제시]
모든 섹션에서 조언의 근거를 사주 계산 결과로 제시하십시오.
"화가 8인데 조절할 수가 3뿐입니다" 처럼 실제 수치를 언급하십시오.
"화 기운이 강해서" 같은 추상적 표현만 반복하지 마십시오.

단, 재료에 없는 오행 수치나 관계를 만들지 마십시오.

섹션마다 근거로 쓸 계산값을 지정해 드립니다. 그 값을 반드시 문장 안에
드러내십시오.

근거가 색·방위·시간대처럼 숫자가 아닌 값이어도, 그 값이 어느 오행에서
나왔고 그 오행의 점수가 몇인지 함께 적으십시오.

  부족: "북쪽이 좋습니다. 남색을 쓰십시오."
  적절: "약한 쪽이 수(水) 0점이라 수의 방위인 북쪽과 수의 색인 남색을
        씁니다. 0점이면 채울 자리가 넓다는 뜻이라 작은 것부터 붙입니다."

숫자가 하나도 들어가지 않은 섹션이 있으면 안 됩니다.

[십신]
십신은 일간과 나머지 글자의 관계입니다. 재료의 user.shipsin이 분포,
user.shipsinPosition이 천간·지지 위치입니다.

${SHIPSIN_TABLE}

시험 서비스에서 중요한 것은 관성(평가받는 자리), 식상(표현), 인성(학습)입니다.
위치에 따라 해석이 달라집니다.

  천간에 있음    겉으로 드러나는 규율을 따름
  지지에만 있음   스스로 정한 기준으로 움직임
  없음           외부 평가에 무관심, 준비 방식이 자유로움
  과다           평가에 위축, 압박에 약함

[12지지 시간대]
${BRANCH_TABLE}

시간대별 운용 섹션은 재료의 timeSlots를 순서대로 다룹니다. 각 구간에 지지,
오행, 일간과의 십신 관계가 이미 판정돼 있으니 그대로 씁니다. 시험 종료
시각은 받지 않으므로 시작 이후는 "시작 직후 20분", "시작 후 40분 지점",
"후반", "마지막 10분" 같은 상대 표현을 씁니다.

timeSlots가 비어 있으면 시작 시각을 모르는 것입니다. 시각을 지어내지 마십시오.

[분량]
섹션마다 글자 수 범위가 지정됩니다. 공백을 포함해 셉니다.
각 섹션은 지정된 범위 안에서 작성하십시오. 상한을 넘기지 마십시오.

문장 수가 아니라 글자 수가 기준입니다. 짧은 문장을 여러 개 늘어놓아 개수만
채우지 마십시오. 한 문장에 근거와 행동이 함께 들어가도록 씁니다.

  부족: "화 기운이 강합니다. 몰입이 빠릅니다. 다만 지속이 짧습니다."
  적절: "화 기운이 28점으로 가장 높아 한번 붙잡으면 몰입이 빠르게 올라오는
        대신 그 상태가 오래 가지 않습니다. 50분 공부 10분 휴식처럼 끊어가는
        방식이 90분을 통으로 앉아 있는 것보다 총량이 많이 나옵니다."

분량을 채우기 위해 같은 말을 반복하거나 일반론을 늘어놓지 말고,
계산 결과에 근거한 구체적인 내용으로 채우십시오.
범위 안이면 짧은 쪽이 낫습니다. 모바일에서 읽는 서비스라 분량보다 밀도가
중요합니다.

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
- 시험 과목명이나 배점을 지어내기

[검색 결과 서술]
확인된 내용만 씁니다. 확정적으로 쓰지 말고 다음처럼 씁니다.
  금지: "OO기업 2차 면접은 PT입니다"
  사용: "후기에서 PT 형식이 언급되는 경우가 많습니다. 확정 전형은 채용 공고를 확인하시기 바랍니다."
확인되지 않은 항목은 생략하고 일반적인 관점으로 대체합니다.
재료의 search 항목이 비어 있거나 "검색 미연동"으로 시작하면, 검색으로 확인된
사실이 없는 것입니다. 설립일이나 전형 방식을 지어내지 마십시오.

필기 리포트에는 검색이 없습니다. 과목 구성을 모르므로 과목명을 쓰지 말고
암기·이해·반복 같은 학습의 성격으로 씁니다.

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
    .map(
      (s) =>
        `- ${s.key} (${s.title})\n` +
        `    ${s.minChars}~${s.maxChars}자 · 근거로 쓸 계산값: ${s.basis}\n` +
        `    ${s.brief ?? ''}`
    )
    .join('\n')

  const totalMin = aiSections.reduce((a, s) => a + s.minChars, 0)
  const totalMax = aiSections.reduce((a, s) => a + s.maxChars, 0)

  const notes: string[] = []

  if (material.fragments.shipsin) {
    notes.push(
      '[섹션 2 주의]\n' +
        '아래 조각이 이 섹션 맨 앞에 그대로 실립니다. 같은 말을 반복하지 말고\n' +
        '실제 십신 분포 점수와 위치를 반영한 확장만 쓰십시오.\n' +
        `"${material.fragments.shipsin}"`
    )
  }

  if (material.fragments.pattern) {
    notes.push(
      '[마지막 섹션 주의]\n' +
        '아래 조각이 이 섹션 맨 앞에 그대로 실립니다. 조각이 짚은 패턴이 왜\n' +
        '나오는지 십신으로 설명하고 끊는 방법을 쓰십시오.\n' +
        `"${material.fragments.pattern}"`
    )
  }

  if (material.fragments.compatibility) {
    notes.push(
      '[궁합 섹션 주의]\n' +
        '아래 조각이 이미 리포트에 실립니다. 같은 말을 반복하지 말고 기업 정보와\n' +
        '결합한 확장 해석만 쓰십시오.\n' +
        `"${material.fragments.compatibility}"`
    )
  } else if (material.fragments.position) {
    notes.push(
      '[위치 섹션 주의]\n' +
        '아래 조각이 이미 리포트에 실립니다. 같은 말을 반복하지 말고 직무 맥락\n' +
        '확장만 쓰십시오.\n' +
        `"${material.fragments.position}"`
    )
  }

  const hours = material.exam.hoursUntilStart
  if (hours !== null && hours < 0) {
    notes.push(
      '[시각 주의]\n' +
        `시험 시작 시각이 이미 지났습니다 (${hours}시간). 준비 계획을 쓰지 말고\n` +
        '마무리와 이후 방향으로 톤을 바꾸십시오.'
    )
  }

  return `[재료]
${JSON.stringify(material, null, 2)}

[작성할 섹션]
각 항목의 글자 수 범위를 지킵니다. 합계 ${totalMin}~${totalMax}자입니다.
근거로 쓸 계산값은 반드시 문장 안에 수치로 드러냅니다.

${instructions}

${notes.join('\n\n')}

[마지막 점검]
모든 섹션을 작성한 뒤 각 섹션이 지정 범위 안에 있는지 확인하십시오.
부족하면 채우고 넘치면 줄인 뒤 최종 JSON을 출력하십시오.

위 섹션 키를 모두 담은 JSON 객체 하나만 출력하십시오.`
}
