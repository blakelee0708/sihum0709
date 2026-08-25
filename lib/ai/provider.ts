/**
 * AI provider 인터페이스 (PRD 8.12, 8.14)
 *
 * 나중에 다른 모델로 A/B 테스트하거나 갈아끼울 수 있도록 구현을 분리합니다.
 * 호출부(pipeline.ts)는 이 인터페이스만 알면 됩니다.
 */

import type { ReportSpec } from './spec'
import type { PromptMaterial } from './prompt'

/**
 * PRD 8.12 원가 통제 장치 — 출력 상한.
 *
 * 기본 6000입니다. AI_MAX_TOKENS로 덮어쓸 수 있게 둔 이유는 아래와 같습니다.
 * Sonnet 5는 새 토크나이저를 써서 같은 한국어 문장이 이전 모델보다 최대
 * 1.35배 많은 토큰으로 계산됩니다. 섹션 11개 × 5-6문장이면 6000을 넘겨
 * stop_reason이 max_tokens로 잘립니다. 실측값에 맞춰 조정하십시오.
 */
export const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS) || 6000

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
 * 모델이 코드 블록으로 감싸거나 앞뒤에 설명을 붙이는 경우가 있어
 * 벗겨낸 뒤 파싱합니다.
 */
export function parseSections(text: string): Record<string, string> {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : trimmed

  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end < 0) throw new GenerateError('응답 파싱 오류')

  let parsed: unknown
  try {
    parsed = JSON.parse(body.slice(start, end + 1))
  } catch {
    throw new GenerateError('응답 파싱 오류')
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
      '이 문단은 화면 배치와 분량을 확인하기 위한 자리 채움이며 사주 해석이 아닙니다. 실제 리포트는 계산된 사주 값과 시험 정보를 재료로 5-6문장씩 작성됩니다.',
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  return out
}
