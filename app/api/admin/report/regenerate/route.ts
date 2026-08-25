/**
 * 리포트 재생성 (PRD 22.6)
 *
 * 사용자 재시도(PRD 14.12)와 달리 관리자가 임의 리포트를 다시 만듭니다.
 * retry_count 제한을 받지 않습니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { adminDb, requireAdmin, UnauthorizedError } from '@/lib/admin/auth'
import { GenerateError } from '@/lib/ai/generate'
import { runPipeline } from '@/lib/ai/pipeline'
import type { UserInput } from '@/lib/content/assemble'
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
      'exam_name, exam_category, exam_type, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title, company_name'
    )
    .eq('id', report.query_id)
    .maybeSingle()

  if (!query) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const userInput: UserInput = {
    name: query.name,
    examName: query.exam_name,
    examCategory: query.exam_category,
    examType: query.exam_type as ExamType,
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
          foundedDate: out.foundedDate,
          companyName: query.company_name,
          mock: out.generated.mock,
        },
        status: 'completed',
        error_message: null,
        input_tokens: out.generated.inputTokens,
        output_tokens: out.generated.outputTokens,
        generation_ms: out.generated.generationMs,
      })
      .eq('id', report.id)

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
