/**
 * 사용자 재시도 (PRD 14.13)
 *
 * 이미 결제된 건이므로 추가 과금 없이 AI를 다시 호출합니다.
 * retry_count가 3을 넘으면 더 이상 받지 않고 문의로 안내합니다.
 *
 * 생성은 after()가 응답 뒤에 수행합니다. 클라이언트는 상태만 폴링합니다.
 */

import { NextResponse, after, type NextRequest } from 'next/server'

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

import { runAndSaveReport } from '@/lib/ai/run-report'
import type { ExamPeriod, UserInput } from '@/lib/content/assemble'
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
  exam_period: string | null
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
      'exam_name, exam_category, exam_type, exam_period, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title, company_name'
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

  await service
    .from('reports')
    .update({
      status: 'pending',
      error_message: null,
      retry_count: retryCount + 1,
      // 좀비 판별 기준을 다시 잡습니다 (PRD 14.12)
      started_at: new Date().toISOString(),
    })
    .eq('id', report.id)

  // 응답을 먼저 보내고 생성을 이어서 수행합니다 (PRD 14.12).
  // 재시도도 2-3분 걸리므로 클라이언트가 붙잡고 있지 않습니다.
  after(async () => {
    await runAndSaveReport({
      service,
      reportId: report.id,
      userInput,
      companyName: query.company_name,
      retryCount: retryCount + 1,
    })
  })

  return NextResponse.json({ id: report.id, status: 'pending' })
}
