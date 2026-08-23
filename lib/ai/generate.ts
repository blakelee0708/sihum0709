/**
 * 리포트 생성 (PRD 8.12, 8.15)
 *
 * 모델 claude-sonnet-5, 출력 상한 6000 토큰.
 * 시스템 프롬프트에 캐싱을 걸어 반복 비용을 줄입니다.
 *
 * API 키가 없으면 샘플 JSON을 돌려주고 화면 개발이 이어지게 합니다.
 */

import { buildUserPrompt, SYSTEM_PROMPT, type PromptMaterial } from './prompt'
import type { ReportSpec } from './spec'

/** PRD 8.12 원가 통제 장치 */
const MAX_TOKENS = 6000
const DEFAULT_MODEL = 'claude-sonnet-5'

export interface GenerateResult {
  content: Record<string, string>
  inputTokens: number
  outputTokens: number
  generationMs: number
  /** API 키가 없어 샘플을 돌려준 경우 */
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
    this.kind = kind
  }
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

/**
 * TODO: 사용자 확인 필요
 * ANTHROPIC_API_KEY를 .env.local에 넣어야 실제 생성이 일어납니다.
 * 키가 없는 동안에는 아래 목업 리포트가 저장됩니다.
 */
export async function generateReport(
  material: PromptMaterial,
  spec: ReportSpec
): Promise<GenerateResult> {
  const started = Date.now()

  if (!isAIConfigured()) {
    return {
      content: mockContent(spec),
      inputTokens: 0,
      outputTokens: 0,
      generationMs: Date.now() - started,
      mock: true,
    }
  }

  const userPrompt = buildUserPrompt(material, spec)

  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            // 시스템 프롬프트는 매 요청 동일하므로 캐싱합니다 (PRD 8.12)
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(90_000),
    })
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') {
      throw new GenerateError('AI API 타임아웃')
    }
    throw new GenerateError('알 수 없는 오류', String(e))
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 429) throw new GenerateError('토큰 한도 초과', body.slice(0, 200))
    throw new GenerateError('알 수 없는 오류', `${res.status} ${body.slice(0, 200)}`)
  }

  const json = (await res.json()) as {
    content?: { type: string; text?: string }[]
    usage?: { input_tokens?: number; output_tokens?: number }
    stop_reason?: string
  }

  if (json.stop_reason === 'max_tokens') {
    throw new GenerateError('토큰 한도 초과')
  }

  const text = (json.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('')

  const content = parseSections(text)

  return {
    content,
    inputTokens: json.usage?.input_tokens ?? 0,
    outputTokens: json.usage?.output_tokens ?? 0,
    generationMs: Date.now() - started,
    mock: false,
  }
}

/** 모델이 코드 블록으로 감싸는 경우가 있어 벗겨낸 뒤 파싱합니다 */
export function parseSections(text: string): Record<string, string> {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : trimmed

  // 앞뒤에 설명이 붙은 경우 첫 { 부터 마지막 } 까지만 취합니다
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
 * API 키가 없을 때 쓰는 샘플.
 *
 * 화면 구성을 확인하기 위한 자리 채움입니다. 사주 해석으로 읽히면 안 되므로
 * 각 문단에 샘플이라는 것을 밝혀 둡니다.
 */
function mockContent(spec: ReportSpec): Record<string, string> {
  const out: Record<string, string> = {}

  for (const s of spec.sections) {
    if (s.source === 'calc') continue
    out[s.key] = [
      `[샘플] "${s.title}" 섹션입니다. ANTHROPIC_API_KEY를 넣으면 실제 내용이 생성됩니다.`,
      s.brief ?? '',
      '이 문단은 화면 배치를 확인하기 위한 자리 채움이며 사주 해석이 아닙니다.',
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  return out
}
