/**
 * provider 선택 (PRD 8.12, 8.14)
 *
 * AI_PROVIDER 환경변수로 고릅니다. 키가 없으면 목업 리포트를 돌려주고
 * 화면 개발과 테스트가 이어지게 합니다.
 */

import type { PromptMaterial } from './prompt'
import type { ReportSpec } from './spec'
import { AnthropicProvider } from './providers/anthropic'
import { DeepSeekProvider } from './providers/deepseek'
import type { AIProvider, GenerateResult, ProviderName } from './provider'

export {
  GenerateError,
  getMaxTokens,
  parseSections,
  type GenerateErrorKind,
  type GenerateResult,
} from './provider'

const PROVIDERS: Record<ProviderName, () => AIProvider> = {
  anthropic: () => new AnthropicProvider(),
  deepseek: () => new DeepSeekProvider(),
}

export function getProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER ?? 'anthropic') as ProviderName
  const make = PROVIDERS[name] ?? PROVIDERS.anthropic
  return make()
}

/** 실제 호출 가능한 상태인지 (키가 있는지) */
export function isAIConfigured(): boolean {
  return getProvider().isConfigured()
}

export async function generateReport(
  material: PromptMaterial,
  spec: ReportSpec
): Promise<GenerateResult> {
  return getProvider().generate(material, spec)
}
