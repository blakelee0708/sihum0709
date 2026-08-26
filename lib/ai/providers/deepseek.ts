/**
 * DeepSeek provider — 스텁 (PRD 8.14 A/B 테스트용)
 *
 * 아직 구현하지 않았습니다. 결제 전환율이 확인된 뒤 모델을 비교할 때
 * 이 파일을 채우면 됩니다. 인터페이스는 AnthropicProvider와 같습니다.
 *
 * TODO: 사용자 확인 필요
 * 붙이시려면 아래가 필요합니다.
 *   1. DEEPSEEK_API_KEY 환경변수
 *   2. generate() 안에서 OpenAI 호환 엔드포인트 호출
 *      (https://api.deepseek.com/chat/completions)
 *   3. 응답에서 JSON을 꺼내 parseSections로 파싱
 *
 * 주의할 점 — 이 서비스의 프롬프트는 한국어 격식체와 사주 용어를 다룹니다.
 * 모델을 바꾸면 문장 품질이 상품 가치와 직결되므로, 바꾸기 전에 같은 입력으로
 * 양쪽 리포트를 뽑아 사람이 읽고 비교해야 합니다.
 */

import type { PromptMaterial } from '../prompt'
import type { ReportSpec } from '../spec'
import {
  GenerateError,
  mockContent,
  type AIProvider,
  type GenerateResult,
} from '../provider'

const DEFAULT_MODEL = 'deepseek-chat'

export class DeepSeekProvider implements AIProvider {
  readonly name = 'deepseek' as const

  isConfigured(): boolean {
    // 구현 전까지는 항상 false입니다. 목업으로 떨어집니다.
    return false
  }

  model(): string {
    return process.env.AI_MODEL ?? DEFAULT_MODEL
  }

  async generate(
    _material: PromptMaterial,
    spec: ReportSpec
  ): Promise<GenerateResult> {
    const started = Date.now()

    if (!this.isConfigured()) {
      return {
        content: mockContent(spec),
        inputTokens: 0,
        outputTokens: 0,
        generationMs: Date.now() - started,
        provider: this.name,
        model: this.model(),
        effort: null,
        stopReason: null,
        mock: true,
      }
    }

    throw new GenerateError('알 수 없는 오류', 'DeepSeek provider는 아직 구현되지 않았습니다')
  }
}
