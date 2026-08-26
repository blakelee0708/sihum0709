/**
 * 유료 리포트 생성 (PRD 8장, 14.11, 14.12)
 *
 * 결제가 완료된 건에 대해 호출합니다.
 * 같은 리포트를 다시 열 때는 저장된 결과를 쓰고 AI를 다시 부르지 않습니다 (PRD 8.17).
 *
 * 생성을 기다리지 않고 리포트 id를 바로 돌려줍니다. 생성은 after()가
 * 응답 뒤에 이어서 수행하므로 사용자가 브라우저를 닫아도 끝까지 만들어
 * 저장됩니다 (PRD 14.12). 클라이언트는 /report/[id]에서 상태만 폴링합니다.
 */

import { NextResponse, after, type NextRequest } from 'next/server'

/**
 * Vercel 서버리스 최대 실행 시간 (초).
 *
 * 목표 소요는 필기 90초, 면접 130초입니다 (PRD 8.3, 8.4 분량 축소 후).
 * 검색이 느린 날이나 AI 응답이 지연되는 경우가 있어 상한을 넉넉히 둡니다.
 * Vercel Hobby는 60초가 상한이라 이 값이 무시됩니다. Pro에서 최대 800초까지
 * 올릴 수 있고, 클라이언트 타임아웃(240초)이 먼저 걸리므로 사용자 대기
 * 시간은 그 안에서 통제됩니다 (PRD 15.1).
 */
export const maxDuration = 500

import { runAndSaveReport } from '@/lib/ai/run-report'
import type { ExamPeriod, UserInput } from '@/lib/content/assemble'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'
import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface QueryRow {
  id: string
  user_id: string | null
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

  let body: { queryId?: string; companyName?: string; paymentId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  if (!body.queryId) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: query } = await supabase
    .from('queries')
    .select(
      'id, user_id, exam_name, exam_category, exam_type, exam_period, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title, company_name'
    )
    .eq('id', body.queryId)
    .maybeSingle<QueryRow>()

  if (!query || query.user_id !== user.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  // 이미 만든 리포트가 있으면 재호출하지 않습니다 (PRD 8.16)
  const { data: existing } = await supabase
    .from('reports')
    .select('id, status, retry_count')
    .eq('query_id', query.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.status === 'completed') {
    return NextResponse.json({ id: existing.id, existed: true })
  }

  // reports는 사용자 정책이 select 전용입니다 (PRD 13.2). 쓰기는 service_role로 합니다.
  const service = createServiceClient()
  if (!service) {
    return NextResponse.json({ error: 'service key required' }, { status: 503 })
  }

  const companyName = body.companyName?.trim() || query.company_name || null

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

  // 기업명을 새로 받았으면 조회 기록에 남깁니다
  if (companyName && companyName !== query.company_name) {
    await supabase.from('queries').update({ company_name: companyName }).eq('id', query.id)
  }

  // 생성 전에 pending 행을 만들어 실패해도 흔적이 남게 합니다
  const reportId =
    existing?.id ??
    (
      await service
        .from('reports')
        .insert({
          user_id: user.id,
          query_id: query.id,
          report_type: query.exam_type === '면접' ? '면접' : '필기',
          dday_range: 'normal',
          status: 'pending',
          // 좀비 판별 기준입니다 (PRD 14.12)
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single()
    ).data?.id

  if (!reportId) {
    return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  }

  // 실패했던 행을 다시 쓰는 경우 상태와 시작 시각을 되돌립니다
  if (existing?.id) {
    await service
      .from('reports')
      .update({
        status: 'pending',
        error_message: null,
        started_at: new Date().toISOString(),
      })
      .eq('id', reportId)
  }

  // 결제 내역에서 리포트로 바로 갈 수 있도록 먼저 연결합니다 (PRD 14.15).
  // 생성 결과와 무관하므로 응답 전에 끝냅니다.
  await linkPayment(service, body.paymentId ?? null, user.id, reportId)

  // 응답을 먼저 보내고 생성을 이어서 수행합니다. 사용자가 나가도 계속 돌아
  // 저장을 마칩니다 (PRD 14.12).
  after(async () => {
    await runAndSaveReport({
      service,
      reportId,
      userInput,
      companyName,
      retryCount: existing?.retry_count ?? 0,
    })
  })

  return NextResponse.json({ id: reportId, status: 'pending' })
}

/**
 * 결제 건과 리포트를 연결합니다 (PRD 14.15 결제 내역의 리포트 보기).
 * paymentId를 못 받았으면 이 사용자의 아직 연결되지 않은 최근 결제에 붙입니다.
 */
async function linkPayment(
  service: ReturnType<typeof createServiceClient>,
  paymentId: string | null,
  userId: string,
  reportId: string
) {
  if (!service) return

  if (paymentId) {
    await service.from('payments').update({ report_id: reportId }).eq('id', paymentId)
    return
  }

  const { data } = await service
    .from('payments')
    .select('id')
    .eq('user_id', userId)
    .is('report_id', null)
    .order('paid_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data) {
    await service.from('payments').update({ report_id: reportId }).eq('id', data.id)
  }
}
