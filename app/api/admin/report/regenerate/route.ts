/**
 * 리포트 재생성 (PRD 22.6)
 *
 * 사용자 재시도(PRD 14.12)와 달리 관리자가 임의 리포트를 다시 만듭니다.
 * retry_count 제한을 받지 않습니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

/**
 * Vercel 서버리스 최대 실행 시간 (초).
 *
 * 플랜마다 상한이 다릅니다. Hobby는 60초, 그 위는 300초입니다. 상한을
 * 넘는 값을 주면 배포 자체가 실패합니다. 500으로 뒀다가 여기서 막혔습니다.
 *
 *   The value for maxDuration must be between 1 second and 300 seconds
 *
 * 실측 소요는 필기 144초, 면접 173초이고 가장 오래 걸린 건이 223초입니다
 * (PRD 8.13, effort medium). 300초면 그 위로 여유가 있고, 클라이언트
 * 타임아웃(240초)이 먼저 걸리므로 사용자 대기 시간은 그 안에서
 * 통제됩니다 (PRD 15.1).
 *
 * Hobby(60초)에서는 생성이 중간에 죽어 pending으로 남습니다. 유료 리포트를
 * 여시려면 플랜을 올려야 합니다.
 */
export const maxDuration = 300

import { adminDb, requireAdmin, UnauthorizedError } from '@/lib/admin/auth'
import { GenerateError } from '@/lib/ai/generate'
import { runPipeline } from '@/lib/ai/pipeline'
import { logSearches } from '@/lib/ai/search-log'
import type { ExamPeriod, UserInput } from '@/lib/content/assemble'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
    }
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  let body: { reportId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  if (!body.reportId) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const db = adminDb()

  const { data: report } = await db
    .from('reports')
    .select('id, query_id')
    .eq('id', body.reportId)
    .maybeSingle()

  if (!report) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { data: query } = await db
    .from('queries')
    .select(
      'exam_name, exam_category, exam_type, exam_period, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title, company_name'
    )
    .eq('id', report.query_id)
    .maybeSingle()

  if (!query) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const userInput: UserInput = {
    name: query.name,
    examName: query.exam_name,
    examCategory: query.exam_category,
    examType: query.exam_type as ExamType,
    examPeriod: query.exam_period as ExamPeriod | null,
    examDate: query.exam_date,
    startTime: query.exam_start_time,
    birthDate: query.birth_date,
    birthTime: query.birth_time,
    hasBirthTime: query.has_birth_time,
    companyScale: query.company_scale as CompanyScale | null,
    workType: query.work_type as WorkType | null,
    jobTitle: query.job_title,
  }

  await db.from('reports').update({ status: 'pending' }).eq('id', report.id)

  try {
    const out = await runPipeline({ userInput, companyName: query.company_name })

    await db
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
          companyName: query.company_name,
          mock: out.generated.mock,
        },
        status: 'completed',
        error_message: null,
        // 실제 사용량을 남깁니다. Sonnet 5는 새 토크나이저를 쓰므로
        // PRD 8.12의 원가 추정치는 하한으로 보고 여기 쌓인 값으로 검증합니다.
        provider: out.generated.provider,
        model: out.generated.model,
        input_tokens: out.generated.inputTokens,
        output_tokens: out.generated.outputTokens,
        generation_ms: out.generated.generationMs,
        // 분량 분포를 보려고 남깁니다 (PRD 8.3). 출력 원가의 근거이기도 합니다.
        total_chars: out.length.total,
      })
      .eq('id', report.id)

    // 재시도도 검색 크레딧을 씁니다 (PRD 22.14)
    await logSearches(out.searchLogs)

    return NextResponse.json({ ok: true, mock: out.generated.mock })
  } catch (e) {
    const kind = e instanceof GenerateError ? e.kind : '알 수 없는 오류'
    await db
      .from('reports')
      .update({ status: 'failed', error_message: kind })
      .eq('id', report.id)
    return NextResponse.json({ error: kind }, { status: 500 })
  }
}
