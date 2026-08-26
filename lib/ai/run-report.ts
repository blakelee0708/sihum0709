/**
 * 리포트 생성과 저장 (PRD 14.12 서버 완결 구조)
 *
 * 생성을 클라이언트가 붙잡고 있으면 사용자가 브라우저를 닫는 순간 결제한
 * 건이 공중에 뜹니다. 그래서 라우트는 reports 행을 먼저 만들어 id를 바로
 * 돌려주고, 생성은 `after()`로 응답 뒤에 이어서 수행합니다.
 *
 *   결제 완료
 *      → reports 행 생성 (status: pending, started_at 기록)
 *      → id를 즉시 응답
 *      → after()가 생성을 끝까지 수행 (사용자가 나가도 서버는 계속 실행)
 *      → 완료 시 content 저장, status: completed
 *
 * 클라이언트는 /report/[id]에서 상태만 폴링합니다.
 */

import { runPipeline } from './pipeline'
import { logSearches } from './search-log'
import { GenerateError } from './generate'
import type { UserInput } from '../content/assemble'
import type { createServiceClient } from '../supabase/server'

type Service = NonNullable<ReturnType<typeof createServiceClient>>

export interface RunReportInput {
  service: Service
  reportId: string
  userInput: UserInput
  companyName: string | null
  /** 실패가 이미 몇 번 쌓였는지. 분량 미달일 때 한 번 더 올립니다 */
  retryCount?: number
}

/**
 * 생성해서 저장합니다. 던지지 않습니다.
 *
 * `after()` 안에서 돌기 때문에 예외를 밖으로 올려도 받아줄 곳이 없습니다.
 * 실패는 reports.status에 남기는 것으로 끝냅니다.
 */
export async function runAndSaveReport(input: RunReportInput): Promise<void> {
  const { service, reportId, userInput, companyName } = input

  try {
    const out = await runPipeline({ userInput, companyName })

    await service
      .from('reports')
      .update({
        report_type: out.reportType,
        dday_range: out.ddayRange,
        content: {
          sections: out.spec.sections,
          generated: out.generated.content,
          compatibility: out.compatibility
            ? { score: out.compatibility.score, relation: out.compatibility.relation }
            : null,
          fragments: out.fragments,
          foundedDate: out.foundedDate,
          companyName,
          mock: out.generated.mock,
          // 섹션별 글자 수 (PRD 8.3).
          //
          // total_chars 한 칸으로는 어느 섹션이 얇았는지 알 수 없습니다.
          // 컬럼을 늘리지 않고 content JSON 안에 같이 넣어 두면 관리자
          // 화면에서 리포트를 열 때 그대로 볼 수 있습니다.
          lengths: {
            total: out.length.total,
            target: out.length.target,
            targetMax: out.length.targetMax,
            sections: out.length.sections,
            short: out.length.short,
            long: out.length.long,
            effort: out.generated.effort,
          },
        },
        status: 'completed',
        error_message: null,
        provider: out.generated.provider,
        model: out.generated.model,
        input_tokens: out.generated.inputTokens,
        output_tokens: out.generated.outputTokens,
        generation_ms: out.generated.generationMs,
        // 분량 분포를 보려고 남깁니다 (PRD 8.3). 출력 원가의 근거이기도 합니다.
        total_chars: out.length.total,
      })
      .eq('id', reportId)

    await logSearches(out.searchLogs)
  } catch (e) {
    const kind = e instanceof GenerateError ? e.kind : '알 수 없는 오류'

    await service
      .from('reports')
      .update({
        status: 'failed',
        error_message: kind,
        // 분량 미달은 모델이 응답은 했는데 부실한 경우입니다. 같은 프롬프트로
        // 계속 다시 부르면 원가만 쌓이므로 첫 실패부터 횟수에 넣습니다 (PRD 8.3).
        ...(kind === '분량 미달'
          ? { retry_count: (input.retryCount ?? 0) + 1 }
          : {}),
      })
      .eq('id', reportId)
  }
}

/**
 * pending인 채로 이 시간을 넘기면 좀비로 봅니다 (PRD 14.12).
 *
 * 서버가 중간에 죽으면 status가 pending으로 남아 화면에서 영원히
 * "만들고 있어요"가 됩니다. Vercel 함수 상한이 500초이므로 10분이면
 * 정상 생성이 끝났어야 하는 시간입니다.
 */
export const ZOMBIE_AFTER_MS = 10 * 60 * 1000

/** pending이 좀비인지 (started_at이 없으면 created_at으로 봅니다) */
export function isZombie(
  startedAt: string | null,
  createdAt: string | null,
  now: Date = new Date()
): boolean {
  const base = startedAt ?? createdAt
  if (!base) return false
  return now.getTime() - new Date(base).getTime() > ZOMBIE_AFTER_MS
}
