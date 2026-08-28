/**
 * 리포트 후 대화 호출 (FIX_4 [3])
 *
 * 리포트 생성(provider.ts)과 나눠 둡니다. 요구가 정반대입니다.
 *
 *   리포트  섹션 14개 · 7,000자 · JSON · 150초
 *   대화    3~5문장 · 평문 · 몇 초
 *
 * 같은 provider 인터페이스에 억지로 태우면 max_tokens와 effort, 파싱까지
 * 전부 분기가 됩니다. 여기서는 평문 한 덩어리만 받으면 됩니다.
 *
 * 시스템 프롬프트에 리포트 전문이 통째로 들어가므로 매 턴 입력이 큽니다.
 * 캐싱을 걸어 두 번째 턴부터는 캐시 읽기 요금만 나가게 합니다. 캐시 읽기도
 * 입력 토큰이므로 원가 계산에는 합칩니다.
 */

import type AnthropicSdk from '@anthropic-ai/sdk'

import { GenerateError } from './provider'

/** 3~5문장이면 넉넉합니다. 길게 답하면 리포트를 다시 읽는 것과 같아집니다 */
const MAX_TOKENS = 1200

/** 짧은 답변에 사고를 많이 시킬 이유가 없습니다 */
const EFFORT = 'low'

const DEFAULT_MODEL = 'claude-sonnet-5'

const TIMEOUT_MS = 60_000

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatTurnResult {
  text: string
  inputTokens: number
  outputTokens: number
  mock: boolean
}

type SdkModule = typeof import('@anthropic-ai/sdk')

let sdkPromise: Promise<SdkModule> | null = null

function loadSdk(): Promise<SdkModule> {
  if (!sdkPromise) sdkPromise = import('@anthropic-ai/sdk')
  return sdkPromise
}

export function isChatConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

/**
 * 키가 없을 때 쓰는 목업 답변.
 *
 * 개발 환경에서 대화 흐름(게이지, 버튼 재표시, 소진)을 끝까지 눌러볼 수
 * 있어야 합니다. 목업이라는 것을 문장에 밝혀 실제 답변과 헷갈리지 않게 합니다.
 */
function mockAnswer(question: string): string {
  return `(목업 답변) "${question}"에 대한 답변입니다. ANTHROPIC_API_KEY를 넣으면 실제 답변이 생성됩니다.`
}

export async function runChatTurn(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<ChatTurnResult> {
  const last = messages[messages.length - 1]

  if (!isChatConfigured()) {
    return {
      text: mockAnswer(last?.content ?? ''),
      inputTokens: 0,
      outputTokens: 0,
      mock: true,
    }
  }

  const sdk = await loadSdk()
  const Anthropic = sdk.default

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: TIMEOUT_MS,
    maxRetries: 0,
  })

  let response: AnthropicSdk.Message
  try {
    response = await client.messages.create({
      model: process.env.AI_CHAT_MODEL ?? process.env.AI_MODEL ?? DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      // 리포트 전문이 들어 있어 매 턴 같은 부분이 큽니다. 캐싱합니다
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      output_config: { effort: EFFORT },
      // temperature / thinking 을 넣지 마십시오. 400이 납니다 (providers/anthropic.ts)
    })
  } catch (e) {
    throw toChatError(e, sdk)
  }

  const text = response.content
    .filter((c): c is AnthropicSdk.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('')
    .trim()

  if (!text) throw new GenerateError('알 수 없는 오류', '빈 응답')

  const usage = response.usage
  return {
    text,
    inputTokens:
      usage.input_tokens +
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0),
    outputTokens: usage.output_tokens,
    mock: false,
  }
}

function toChatError(e: unknown, sdk: SdkModule): GenerateError {
  if (e instanceof GenerateError) return e

  const A = sdk.default
  if (e instanceof A.APIConnectionTimeoutError) return new GenerateError('AI API 타임아웃')
  if (e instanceof A.RateLimitError) return new GenerateError('토큰 한도 초과', e.message)
  if (e instanceof A.APIError) {
    return new GenerateError('알 수 없는 오류', `${e.status ?? ''} ${e.message}`.trim())
  }
  return new GenerateError('알 수 없는 오류', String(e))
}
