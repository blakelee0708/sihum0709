/**
 * 무료 지급 (PRD 22.11)
 *
 * CS 보상, 지인 테스트, 인플루언서 제공에 씁니다.
 * 지급하면 즉시 리포트를 만들고 payments에 is_granted true로 기록합니다.
 * 매출 집계에서 제외됩니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { adminDb, requireAdmin, UnauthorizedError } from '@/lib/admin/auth'
import { GenerateError } from '@/lib/ai/generate'
import { runPipeline } from '@/lib/ai/pipeline'
import type { UserInput } from '@/lib/content/assemble'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'

export async function POST(req: NextRequest) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
    }
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  let body: { queryId?: string; memo?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  if (!body.queryId) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const db = adminDb()

  const { data: query } = await db
    .from('queries')
    .select(
      'id, user_id, exam_name, exam_category, exam_type, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title, company_name'
    )
    .eq('id', body.queryId)
    .maybeSingle()

  if (!query || !query.user_id) {
    return NextResponse.json({ error: '로그인 사용자의 조회만 지급할 수 있습니다' }, { status: 400 })
  }

  if (query.exam_type === '실기') {
    return NextResponse.json({ error: '실기는 유료 상품이 없습니다' }, { status: 400 })
  }

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

  const { data: created } = await db
    .from('reports')
    .insert({
      user_id: query.user_id,
      query_id: query.id,
      report_type: query.exam_type === '면접' ? '면접' : '필기',
      dday_range: 'normal',
      status: 'pending',
      granted_by: admin.email,
    })
    .select('id')
    .single()

  if (!created) return NextResponse.json({ error: 'insert failed' }, { status: 500 })

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
        input_tokens: out.generated.inputTokens,
        output_tokens: out.generated.outputTokens,
        generation_ms: out.generated.generationMs,
        // 분량 분포를 보려고 남깁니다 (PRD 8.3). 출력 원가의 근거이기도 합니다.
        total_chars: out.length.total,
      })
      .eq('id', created.id)

    // 매출 집계에서 빠지도록 금액 0, is_granted true로 남깁니다
    await db.from('payments').insert({
      user_id: query.user_id,
      report_id: created.id,
      payment_id: `GRANT-${Date.now()}`,
      amount: 0,
      product_type: out.reportType,
      payment_method: '무료 지급',
      is_granted: true,
      paid_at: new Date().toISOString(),
      refund_reason: body.memo?.slice(0, 200) ?? null,
    })

    return NextResponse.json({ ok: true, reportId: created.id })
  } catch (e) {
    const kind = e instanceof GenerateError ? e.kind : '알 수 없는 오류'
    await db
      .from('reports')
      .update({ status: 'failed', error_message: kind })
      .eq('id', created.id)
    return NextResponse.json({ error: kind }, { status: 500 })
  }
}
