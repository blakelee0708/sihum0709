/**
 * AI provider 인터페이스 (PRD 8.12, 8.14)
 *
 * 나중에 다른 모델로 A/B 테스트하거나 갈아끼울 수 있도록 구현을 분리합니다.
 * 호출부(pipeline.ts)는 이 인터페이스만 알면 됩니다.
 */

import type { ReportSpec, ReportType } from './spec'
import type { PromptMaterial } from './prompt'

/**
 * 출력 상한 — 잘림 방지선입니다. 원가 통제 장치가 아닙니다 (PRD 8.13).
 *
 * 원가를 결정하는 것은 실제 생성된 토큰량이지 max_tokens가 아닙니다.
 * 상한을 올려도 실제 생성량만큼만 청구됩니다.
 *
 * PRD 8.13이 정한 값은 12000입니다. 출력 토큰에는 adaptive thinking 분량이
 * 포함되어 본문 3,000자에 5,500-5,700이 나오므로 6000은 간헐적으로 잘립니다.
 *
 * 값은 실측으로 정했습니다. 출력 토큰의 절반 이상이 adaptive thinking입니다.
 *
 *   12000  필기·면접 둘 다 잘림
 *   20000  필기·면접 둘 다 잘림
 *   32000  통과 (출력 16,562 / 27,528 토큰)
 *
 * 분량 상한을 넣은 뒤로는 32000까지 쓰지 않지만 상한은 넉넉히 둡니다.
 * 잘린 리포트는 결제한 사용자에게 보여줄 수 없어 어차피 다시 만들어야 하고,
 * 그 재생성 비용이 상한을 높이 두는 것보다 비쌉니다.
 * 실제 사용량은 reports.output_tokens로 확인합니다.
 *
 * 원가 통제는 아래 두 가지로만 합니다.
 *   1. 검색 결과 절단 (search.ts CONTEXT_LIMIT) — 입력 통제
 *   2. 프롬프트에 명시한 섹션별 분량 범위 (spec.ts minChars/maxChars) — 출력 통제
 */
export const DEFAULT_MAX_TOKENS = 32000

/**
 * 호출 시점에 읽습니다.
 *
 * 모듈 로드 시점에 상수로 굳히면 .env.local을 나중에 읽어들이는 환경
 * (테스트 러너 등)에서 덮어쓰기가 먹지 않습니다. 실제로 실측 스크립트가
 * 기본값으로만 돌아 잘렸습니다.
 */
export function getMaxTokens(): number {
  return Number(process.env.AI_MAX_TOKENS) || DEFAULT_MAX_TOKENS
}

/**
 * 사고량 단계 (PRD 8.13).
 *
 * Sonnet 5에서 `thinking: { type: 'enabled', budget_tokens: N }`은 400입니다.
 * 이 모델 계열에서 budget_tokens는 제거됐고, 지원되는 조절 수단은
 * `output_config.effort` 하나입니다.
 *
 *   low / medium / high / xhigh / max   (미지정 시 high)
 *
 * 실측에서 출력 토큰의 3분의 2 이상이 thinking이었고 그것이 시간과 원가의
 * 병목이었습니다. 검색은 2초라 병목이 아닙니다. 따라서 effort를 내려
 * 사고량을 줄입니다.
 *
 * ── 둘 다 medium (실측 22건) ──
 *
 * 정확도는 low에서도 유지됩니다. 오행 수치, 십신 매핑, 12지지 관계,
 * 궁합 점수, 검색 결과 반영이 전부 계산값과 맞았습니다. low를 못 쓰는
 * 이유는 정확도가 아니라 섹션 분량입니다.
 *
 *                소요    원가   하한 미달 섹션
 *   필기 low      85초   121원   회당 1~3개
 *   필기 medium  144초   201원   회당 0개
 *   면접 low      67초    99원   회당 3~4개
 *   면접 medium  173초   233원   회당 1~3개
 *
 * 섹션 하한 미달은 프롬프트의 구성 지시(spec.ts structure)로 크게
 * 줄였습니다. 필기 기준 회당 8~11개에서 1~3개까지 왔습니다. 마지막
 * 1~3개를 0으로 만든 것은 effort였습니다.
 *
 * 합계가 하한을 넘겨도 섹션별로 편차가 크면 사용자는 어떤 부분을 얇게
 * 느낍니다. 계산값을 정확히 인용해도 두 문장으로 끝내면 3,900원짜리로
 * 읽히지 않습니다.
 *
 * 원가 201원과 233원은 판매가 3,900원의 5.2퍼센트와 6.0퍼센트입니다.
 *
 * 소요가 목표보다 깁니다(필기 90초 목표에 144초). 대기 화면 문구와
 * 간격을 이 실측에 맞춰 두었습니다(chat-scripts.ts). 시간을 줄여야 하면
 * 환경변수 한 줄로 되돌릴 수 있고, 그때는 미달 섹션이 다시 생깁니다.
 *
 *   AI_EFFORT_WRITTEN=low
 */
export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

const EFFORTS: Effort[] = ['low', 'medium', 'high', 'xhigh', 'max']

const DEFAULT_EFFORT: Record<ReportType, Effort> = {
  필기: 'medium',
  면접: 'medium',
}

function parseEffort(value: string | undefined): Effort | null {
  if (!value) return null
  const v = value.trim().toLowerCase()
  return (EFFORTS as string[]).includes(v) ? (v as Effort) : null
}

/**
 * 호출 시점에 읽습니다. getMaxTokens와 같은 이유입니다 (.env.local 로드 순서).
 *
 *   AI_EFFORT_WRITTEN    필기
 *   AI_EFFORT_INTERVIEW  면접
 *
 * 잘못된 값은 조용히 무시하고 기본값을 씁니다. 오타 하나로 전체 생성이
 * 400으로 죽는 것보다 낫습니다.
 */
export function getEffort(type: ReportType): Effort {
  const raw =
    type === '필기' ? process.env.AI_EFFORT_WRITTEN : process.env.AI_EFFORT_INTERVIEW
  return parseEffort(raw) ?? DEFAULT_EFFORT[type]
}

export type ProviderName = 'anthropic' | 'deepseek'

export interface GenerateResult {
  /** 섹션 키 → 본문 */
  content: Record<string, string>
  inputTokens: number
  outputTokens: number
  generationMs: number
  /** 실제로 쓴 provider와 model. reports 테이블에 기록합니다 */
  provider: ProviderName
  model: string
  /** 실제로 쓴 사고량 단계. 목업이면 null */
  effort: Effort | null
  /**
   * 응답의 stop_reason. 실측 기록용입니다.
   *
   * max_tokens는 여기까지 오지 못하고 '출력 잘림'으로 던져집니다.
   * 정상 흐름에서는 항상 end_turn입니다.
   */
  stopReason: string | null
  /** API 키가 없어 목업을 돌려준 경우 */
  mock: boolean
}

export type GenerateErrorKind =
  | 'AI API 타임아웃'
  | '검색 API 실패'
  | '응답 파싱 오류'
  | '토큰 한도 초과'
  /** stop_reason이 max_tokens — 본문이 잘렸으므로 사용자에게 보여주지 않습니다 */
  | '출력 잘림'
  /** 생성은 끝났으나 분량이 목표의 70%에 못 미침 */
  | '분량 미달'
  | '알 수 없는 오류'

export class GenerateError extends Error {
  kind: GenerateErrorKind
  constructor(kind: GenerateErrorKind, message?: string) {
    super(message ?? kind)
    this.name = 'GenerateError'
    this.kind = kind
  }
}

export interface AIProvider {
  name: ProviderName
  /** 이 provider가 실제 호출 가능한 상태인지 (키가 있는지) */
  isConfigured(): boolean
  /** 설정된 모델 ID */
  model(): string
  generate(material: PromptMaterial, spec: ReportSpec): Promise<GenerateResult>
}

/**
 * 실패 원인을 남기되 본문 전체를 로그에 쏟지 않도록 잘라 씁니다.
 *
 * JSON 오류 메시지에 "at position N"이 있으면 그 주변을 보여줍니다.
 * 앞뒤 200자만 봐서는 5,000자짜리 응답의 어디가 깨졌는지 알 수 없습니다.
 * 실제로 두 번 다 그것 때문에 원인을 못 짚었습니다.
 */
function peek(text: string, message?: string): string {
  const at = message?.match(/position (\d+)/)
  if (at) {
    const pos = Number(at[1])
    const from = Math.max(0, pos - 120)
    const to = Math.min(text.length, pos + 120)
    return (
      `길이 ${text.length} · ${pos} 부근 "${text.slice(from, pos)}` +
      `<<여기>>${text.slice(pos, to)}"`
    )
  }

  const n = 200
  const head = text.slice(0, n)
  const tail = text.length > n * 2 ? text.slice(-n) : ''
  return `길이 ${text.length} · 앞 "${head}"${tail ? ` · 뒤 "${tail}"` : ''}`
}

/** 정규식에 키를 그대로 넣기 위해 특수문자를 막습니다 */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** JSON 문자열 이스케이프를 되돌립니다 */
function unescapeJsonString(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

/**
 * JSON 문법을 포기하고 키 이름으로 값만 긁어냅니다.
 *
 * 실측 12건 중 2건이 파싱에서 죽었습니다. 두 번 다 본문 자체는 멀쩡했고
 * 봉투만 깨져 있었습니다. 실패로 돌리면 3,900원짜리 생성을 통째로 다시
 * 해야 하는데, 그 비용이 이 함수보다 훨씬 비쌉니다.
 *
 *   Bad control character in string literal    문자열 안의 날것 줄바꿈
 *   Unexpected non-whitespace character after JSON
 *                                              문자열 안의 이스케이프 안 된
 *                                              따옴표로 객체가 일찍 닫힘
 *
 * 두 번째는 escapeRawControlChars로도 못 고칩니다. 따옴표가 어긋나면
 * 문자열 안팎 판정 자체가 무너지기 때문입니다.
 *
 * 그래서 마지막 수단으로 구조를 무시하고 `"키": "` 위치만 찾아 다음 키
 * 직전까지를 값으로 봅니다. 값 안에 따옴표나 줄바꿈이 몇 개 있든 상관이
 * 없습니다.
 *
 * 기대한 키를 절반도 못 찾으면 포기합니다. 그때는 응답이 실제로 망가진
 * 것이고, 억지로 살린 반쪽짜리 리포트를 결제한 사용자에게 보여주는 것이
 * 더 나쁩니다.
 */
export function extractByKeys(
  text: string,
  keys: string[]
): Record<string, string> | null {
  if (keys.length === 0) return null

  const marks = keys
    .map((key) => {
      const m = new RegExp(`"${escapeRegExp(key)}"\\s*:\\s*"`).exec(text)
      return m ? { key, keyStart: m.index, valueStart: m.index + m[0].length } : null
    })
    .filter((x): x is { key: string; keyStart: number; valueStart: number } => x !== null)
    .sort((a, b) => a.valueStart - b.valueStart)

  if (marks.length * 2 < keys.length) return null

  const out: Record<string, string> = {}

  for (let i = 0; i < marks.length; i += 1) {
    const limit = i + 1 < marks.length ? marks[i + 1].keyStart : text.length
    let raw = text.slice(marks[i].valueStart, limit)

    // 값 뒤에 붙은 닫는 따옴표·쉼표·중괄호를 순서대로 떼어냅니다
    raw = raw.replace(/\s+$/, '')
    if (raw.endsWith('}')) raw = raw.slice(0, -1).replace(/\s+$/, '')
    if (raw.endsWith(',')) raw = raw.slice(0, -1).replace(/\s+$/, '')
    if (raw.endsWith('"')) raw = raw.slice(0, -1)

    const value = unescapeJsonString(raw).trim()
    if (value) out[marks[i].key] = value
  }

  return Object.keys(out).length > 0 ? out : null
}

/**
 * 문자열 값 안에 이스케이프되지 않은 제어문자(주로 줄바꿈)를 고칩니다.
 *
 * effort를 low로 낮춘 뒤 실측 4건 중 1건이 여기서 죽었습니다. 본문은
 * 멀쩡하고 JSON 문법만 어긋난 경우인데, 실패로 돌리면 3,900원짜리 생성을
 * 통째로 다시 해야 합니다. 고쳐 읽는 편이 싸고 사용자 대기도 짧습니다.
 *
 * 문자열 안인지 밖인지만 추적하면 되므로 파서를 새로 쓰지 않습니다.
 * 백슬래시 이스케이프를 건너뛰어야 \" 를 문자열 끝으로 오해하지 않습니다.
 */
function escapeRawControlChars(text: string): string {
  const out: string[] = []
  let inString = false
  let escaped = false

  for (const ch of text) {
    if (escaped) {
      out.push(ch)
      escaped = false
      continue
    }

    if (inString && ch === '\\') {
      out.push(ch)
      escaped = true
      continue
    }

    if (ch === '"') {
      inString = !inString
      out.push(ch)
      continue
    }

    if (inString && ch < ' ') {
      if (ch === '\n') out.push('\\n')
      else if (ch === '\r') out.push('\\r')
      else if (ch === '\t') out.push('\\t')
      else out.push(`\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`)
      continue
    }

    out.push(ch)
  }

  return out.join('')
}

/**
 * JSON을 한 번에 못 읽어 고쳐 읽은 횟수. 프로세스 단위 누적입니다.
 *
 * 프롬프트에 이스케이프 지시를 넣었지만 지켜지는지는 재 봐야 압니다.
 * 빈도가 높으면 지시를 더 조여야 합니다.
 *
 *   escaped  제어문자만 고쳐서 다시 읽음 (가벼운 복구)
 *   loose    JSON 문법을 포기하고 키로 긁어냄 (마지막 수단)
 */
const repairs = { escaped: 0, loose: 0 }

export function getParseRepairCount(): { escaped: number; loose: number } {
  return { ...repairs }
}

export function resetParseRepairCount(): void {
  repairs.escaped = 0
  repairs.loose = 0
}

/**
 * 모델이 코드 블록으로 감싸거나 앞뒤에 설명을 붙이는 경우가 있어
 * 벗겨낸 뒤 파싱합니다.
 */
export function parseSections(
  text: string,
  /** 기대하는 섹션 키. 마지막 복구 단계에서 씁니다 */
  keys: string[] = []
): Record<string, string> {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : trimmed

  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end < 0) throw new GenerateError('응답 파싱 오류', peek(trimmed))

  const slice = body.slice(start, end + 1)

  let parsed: unknown
  try {
    parsed = JSON.parse(slice)
  } catch {
    try {
      parsed = JSON.parse(escapeRawControlChars(slice))
      repairs.escaped += 1
      console.warn(
        `[JSON 복구] 문자열 안의 제어문자를 이스케이프해 다시 읽었습니다 ` +
          `(누적 ${repairs.escaped}회). 프롬프트의 이스케이프 지시가 안 먹히고 있습니다.`
      )
    } catch (e) {
      // 봉투만 깨지고 본문은 멀쩡한 경우가 많습니다. 키로 긁어냅니다.
      const loose = extractByKeys(slice, keys)
      if (loose) {
        repairs.loose += 1
        console.warn(
          `[JSON 복구] 문법을 포기하고 키로 긁어냈습니다 ` +
            `(누적 ${repairs.loose}회, ${Object.keys(loose).length}/${keys.length}개). ` +
            `${e instanceof Error ? e.message : String(e)}`
        )
        return loose
      }

      // 무엇이 왔는지 모르면 고칠 수가 없습니다. 실패 지점 주변을 남깁니다.
      throw new GenerateError(
        '응답 파싱 오류',
        `${e instanceof Error ? e.message : String(e)} · ` +
          peek(slice, e instanceof Error ? e.message : undefined)
      )
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new GenerateError('응답 파싱 오류')
  }

  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v
    else if (Array.isArray(v)) out[k] = v.filter((x) => typeof x === 'string').join('\n\n')
  }

  if (Object.keys(out).length === 0) throw new GenerateError('응답 파싱 오류')
  return out
}

/**
 * API 키가 없을 때 쓰는 목업.
 *
 * PRD 8.3, 8.4의 섹션 구조를 그대로 따릅니다. 화면 개발과 테스트에 씁니다.
 * 사주 해석으로 읽히면 안 되므로 각 문단에 샘플이라는 것을 밝혀 둡니다.
 */
export function mockContent(spec: ReportSpec): Record<string, string> {
  const out: Record<string, string> = {}

  for (const s of spec.sections) {
    if (s.source === 'calc') continue

    out[s.key] = [
      `[샘플] "${s.title}" 섹션입니다. AI API 키를 넣으면 실제 내용이 생성됩니다.`,
      s.brief ?? '',
      `이 문단은 화면 배치와 분량을 확인하기 위한 자리 채움이며 사주 해석이 아닙니다. 실제 리포트는 계산된 사주 값과 시험 정보를 재료로 이 섹션 기준 ${s.minChars}자 이상 작성됩니다.`,
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  return out
}
