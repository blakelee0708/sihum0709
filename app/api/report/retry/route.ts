/**
 * 사용자 재시도 (PRD 14.12)
 *
 * 이미 결제된 건이므로 추가 과금 없이 AI를 다시 호출합니다.
 * retry_count가 3을 넘으면 더 이상 받지 않고 문의로 안내합니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

/**
 * Vercel 서버리스 최대 실행 시간 (초).
 *
 * 리포트 생성 실측이 필기 189초, 면접 122초입니다. 기본값으로는 끝나기 전에 함수가 죽습니다.
 * Vercel Hobby 플랜은 60초가 상한이라 이 값이 무시되고 실패합니다.
 * 출시 전 Pro 플랜이 필요합니다.
 */
export const maxDuration = 300

import { runPipeline } from '@/lib/ai/pipeline'
import { logSearches } from '@/lib/ai/search-log'
import { GenerateError } from '@/lib/ai/generate'
import type { UserInput } from '@/lib/content/assemble'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'
import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

const MAX_RETRY = 3

interface ReportRow {
  id: string
  user_id: string
  query_id: string
  retry_count: number | null
  status: string | null
}

interface QueryRow {
  exam_name: string
  exam_category: string | null
  exam_type: string
  exam_date: string
  exam_start_time: string | null
  birth_date: string
  birth_time: string | null
  has_birth_time: boolean
  name: string | null
  company_scale: string | null
  work_type: string | null
  job_title: string | null
  company_name: string | null
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
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

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: report } = await supabase
    .from('reports')
    .select('id, user_id, query_id, retry_count, status')
    .eq('id', body.reportId)
    .maybeSingle<ReportRow>()

  if (!report || report.user_id !== user.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const retryCount = report.retry_count ?? 0
  if (retryCount >= MAX_RETRY) {
    return NextResponse.json({ error: 'retry limit' }, { status: 429 })
  }

  const { data: query } = await supabase
    .from('queries')
    .select(
      'exam_name, exam_category, exam_type, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title, company_name'
    )
    .eq('id', report.query_id)
    .maybeSingle<QueryRow>()

  if (!query) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // reports는 사용자 정책이 select 전용입니다 (PRD 13.2)
  const service = createServiceClient()
  if (!service) {
    return NextResponse.json({ error: 'service key required' }, { status: 503 })
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

  await service
    .from('reports')
    .update({ status: 'pending', retry_count: retryCount + 1 })
    .eq('id', report.id)

  try {
    const out = await runPipeline({ userInput, companyName: query.company_name })

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

    return NextResponse.json({ id: report.id, mock: out.generated.mock })
  } catch (e) {
    const kind = e instanceof GenerateError ? e.kind : '알 수 없는 오류'

    await service
      .from('reports')
      .update({ status: 'failed', error_message: kind })
      .eq('id', report.id)

    return NextResponse.json({ id: report.id, error: kind }, { status: 500 })
  }
}
