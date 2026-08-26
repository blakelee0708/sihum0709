/**
 * Anthropic provider (PRD 8.12)
 *
 * ── 호출 시 지켜야 하는 것 ──
 *
 * 1. temperature / top_p / top_k 를 설정하지 않습니다.
 *    Sonnet 5는 기본값이 아닌 샘플링 값을 주면 400을 돌려줍니다.
 * 2. thinking 파라미터를 수동으로 설정하지 않습니다.
 *    adaptive thinking이 기본으로 켜져 있습니다.
 * 3. max_tokens는 잘림 방지선입니다. 원가 통제 장치가 아니므로 넉넉히 둡니다.
 *    PRD 8.13이 정한 기본값 12000. AI_MAX_TOKENS로 덮어씁니다.
 * 4. 시스템 프롬프트에 cache_control을 걸어 반복 비용을 줄입니다.
 *
 * ── 토큰 계산 주의 ──
 *
 * Sonnet 5는 새 토크나이저를 씁니다. 같은 한글 텍스트가 이전 모델보다
 * 최대 1.35배 많은 토큰으로 계산됩니다. PRD 8.12의 원가 추정치(면접 112원)는
 * 하한으로 보시고, 실제 usage를 reports 테이블에 기록해 나중에 검증합니다.
 *
 * ── SDK를 정적으로 import하지 않는 이유 ──
 *
 * @anthropic-ai/sdk는 ESM 전용입니다. 정적으로 붙이면 목업 모드(키 없음)와
 * 테스트 환경에서도 무조건 로드되어 해석 오류가 납니다. 실제로 호출할 때만
 * 동적으로 불러옵니다.
 */

import type AnthropicSdk from '@anthropic-ai/sdk'

import { buildUserPrompt, SYSTEM_PROMPT, type PromptMaterial } from '../prompt'
import type { ReportSpec } from '../spec'
import {
  GenerateError,
  MAX_TOKENS,
  mockContent,
  parseSections,
  type AIProvider,
  type GenerateResult,
} from '../provider'

/** 날짜 접미사가 없는 정확한 문자열입니다. 임의로 붙이지 마십시오 */
const DEFAULT_MODEL = 'claude-sonnet-5'

/**
 * 실측 소요 시간이 필기 188.7초, 면접 121.8초입니다 (섹션 확대 전 기준).
 * PRD 14.11은 78-100초로 적었으나 섹션이 14/15개로 늘고 목표 분량이
 * 7,200 / 7,900자가 되었으므로 더 걸립니다.
 *
 * 스트리밍을 쓰므로 HTTP 타임아웃에 걸리지 않지만, 무한정 기다리지 않도록
 * 상한을 둡니다.
 */
const TIMEOUT_MS = 300_000

type SdkModule = typeof import('@anthropic-ai/sdk')

let sdkPromise: Promise<SdkModule> | null = null

function loadSdk(): Promise<SdkModule> {
  if (!sdkPromise) sdkPromise = import('@anthropic-ai/sdk')
  return sdkPromise
}

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const

  isConfigured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY)
  }

  model(): string {
    return process.env.AI_MODEL ?? DEFAULT_MODEL
  }

  async generate(
    material: PromptMaterial,
    spec: ReportSpec
  ): Promise<GenerateResult> {
    const started = Date.now()
    const model = this.model()

    if (!this.isConfigured()) {
      return {
        content: mockContent(spec),
        inputTokens: 0,
        outputTokens: 0,
        generationMs: Date.now() - started,
        provider: this.name,
        model,
        mock: true,
      }
    }

    const sdk = await loadSdk()
    const Anthropic = sdk.default

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: TIMEOUT_MS,
      // 타임아웃 재시도는 대기 시간과 원가를 두 배로 만듭니다.
      // 실패는 리포트 실패 화면(PRD 14.12)에서 사용자가 다시 누르게 합니다.
      maxRetries: 0,
    })

    let response: AnthropicSdk.Message
    try {
      // 스트리밍을 씁니다. 생성이 80초를 넘는 경우가 많아 비스트리밍으로는
      // HTTP 타임아웃에 걸립니다. 이벤트를 쓰지는 않고 완성본만 받습니다.
      const stream = client.messages.stream({
        model,
        max_tokens: MAX_TOKENS,
        // 시스템 프롬프트는 매 요청 동일하므로 캐싱합니다 (PRD 8.12)
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: buildUserPrompt(material, spec) }],
        // temperature / top_p / top_k 를 넣지 마십시오. 400이 납니다.
        // thinking 도 넣지 마십시오. adaptive가 기본입니다.
      })

      response = await stream.finalMessage()
    } catch (e) {
      throw toGenerateError(e, sdk)
    }

    // 잘린 본문은 사용자에게 보여주지 않습니다. 섹션이 중간에서 끊기거나
    // JSON이 닫히지 않은 상태이므로 실패로 처리하고 재시도하게 둡니다.
    if (response.stop_reason === 'max_tokens') {
      throw new GenerateError(
        '출력 잘림',
        `max_tokens(${MAX_TOKENS})에 걸려 본문이 잘렸습니다`
      )
    }

    if (response.stop_reason === 'refusal') {
      throw new GenerateError(
        '알 수 없는 오류',
        `모델이 응답을 거절했습니다 (${response.stop_details?.category ?? '사유 미상'})`
      )
    }

    const text = response.content
      .filter((c): c is AnthropicSdk.TextBlock => c.type === 'text')
      .map((c) => c.text)
      .join('')

    const content = parseSections(text)

    // 캐시 읽기/쓰기도 입력 토큰이므로 원가 계산에 합칩니다
    const usage = response.usage
    const inputTokens =
      usage.input_tokens +
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0)

    return {
      content,
      inputTokens,
      outputTokens: usage.output_tokens,
      generationMs: Date.now() - started,
      provider: this.name,
      model,
      mock: false,
    }
  }
}

/** SDK 예외를 리포트 실패 사유(PRD 22.6 분류)로 옮깁니다 */
function toGenerateError(e: unknown, sdk: SdkModule): GenerateError {
  if (e instanceof GenerateError) return e

  const A = sdk.default

  if (e instanceof A.APIConnectionTimeoutError) {
    return new GenerateError('AI API 타임아웃')
  }
  if (e instanceof A.RateLimitError) {
    return new GenerateError('토큰 한도 초과', e.message)
  }
  if (e instanceof A.AuthenticationError) {
    return new GenerateError('알 수 없는 오류', 'API 키가 올바르지 않습니다')
  }
  if (e instanceof A.APIError) {
    return new GenerateError('알 수 없는 오류', `${e.status ?? ''} ${e.message}`.trim())
  }

  return new GenerateError('알 수 없는 오류', String(e))
}
