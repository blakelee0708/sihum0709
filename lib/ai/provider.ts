/**
 * AI provider 인터페이스 (PRD 8.12, 8.14)
 *
 * 나중에 다른 모델로 A/B 테스트하거나 갈아끼울 수 있도록 구현을 분리합니다.
 * 호출부(pipeline.ts)는 이 인터페이스만 알면 됩니다.
 */

import type { ReportSpec } from './spec'
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

/** 실패 원인을 남기되 본문 전체를 로그에 쏟지 않도록 앞뒤만 잘라 씁니다 */
function peek(text: string): string {
  const n = 200
  const head = text.slice(0, n)
  const tail = text.length > n * 2 ? text.slice(-n) : ''
  return `길이 ${text.length} · 앞 "${head}"${tail ? ` · 뒤 "${tail}"` : ''}`
}

/**
 * 모델이 코드 블록으로 감싸거나 앞뒤에 설명을 붙이는 경우가 있어
 * 벗겨낸 뒤 파싱합니다.
 */
export function parseSections(text: string): Record<string, string> {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : trimmed

  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end < 0) throw new GenerateError('응답 파싱 오류', peek(trimmed))

  let parsed: unknown
  try {
    parsed = JSON.parse(body.slice(start, end + 1))
  } catch (e) {
    // 무엇이 왔는지 모르면 고칠 수가 없습니다. 앞뒤 일부를 남깁니다.
    throw new GenerateError(
      '응답 파싱 오류',
      `${e instanceof Error ? e.message : String(e)} · ${peek(body)}`
    )
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
