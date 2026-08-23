/**
 * 유료 리포트 (PRD 14.11)
 *
 * 결제 완료 시 저장된 결과를 읽습니다. 재열람 시 AI를 다시 부르지 않습니다 (PRD 8.16).
 * 생성 중이면 대화형 진행 표시를, 실패했으면 재시도 화면을 보여줍니다.
 */

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import GeneratingChat from '@/components/chat/GeneratingChat'
import Disclaimer from '@/components/layout/Disclaimer'
import ElementBar from '@/components/report/ElementBar'
import FailedState from '@/components/report/FailedState'
import KakaoShareButton from '@/components/report/KakaoShareButton'
import MonthCalendar from '@/components/report/MonthCalendar'
import ReportSection from '@/components/report/ReportSection'
import SajuTable from '@/components/report/SajuTable'
import { buildFreeResult, formatExamDate, type UserInput } from '@/lib/content/assemble'
import { getMonthFlow } from '@/lib/saju/fortune'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'
import type { SectionSpec } from '@/lib/ai/spec'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export const metadata: Metadata = { title: '내 리포트 · 시험사주' }

interface ReportContent {
  sections: SectionSpec[]
  generated: Record<string, string>
  compatibility: { score: number; relation: string } | null
  foundedDate: string | null
  companyName: string | null
  mock?: boolean
}

interface ReportRow {
  id: string
  user_id: string
  query_id: string
  report_type: string
  dday_range: string
  content: ReportContent | null
  status: string | null
  retry_count: number | null
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

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!isSupabaseConfigured) redirect('/my')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=${encodeURIComponent(`/report/${id}`)}`)

  const { data: report } = await supabase
    .from('reports')
    .select('id, user_id, query_id, report_type, dday_range, content, status, retry_count')
    .eq('id', id)
    .maybeSingle<ReportRow>()

  if (!report || report.user_id !== user.id) notFound()

  const { data: query } = await supabase
    .from('queries')
    .select(
      'exam_name, exam_category, exam_type, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title, company_name'
    )
    .eq('id', report.query_id)
    .maybeSingle<QueryRow>()

  if (!query) notFound()

  const reportType = report.report_type === '면접' ? '면접' : '필기'

  if (report.status === 'failed') {
    return <FailedState reportId={report.id} retryCount={report.retry_count ?? 0} />
  }

  if (report.status !== 'completed' || !report.content) {
    return (
      <GeneratingChat
        reportType={reportType}
        examDate={formatExamDate(query.exam_date)}
        company={query.company_name ?? undefined}
      />
    )
  }

  // 계산 섹션은 저장하지 않고 매번 다시 계산합니다. 같은 입력이면 같은 값입니다.
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

  const free = buildFreeResult(userInput)
  const examYear = Number(query.exam_date.slice(0, 4))
  const monthFlow = getMonthFlow(free.saju, examYear)

  const content = report.content
  const provider = user.app_metadata?.provider

  const [y, m, d] = query.exam_date.split('-').map(Number)

  let visibleIndex = 0

  return (
    <main className="mx-auto max-w-md pb-6">
      <header className="px-screen pt-6">
        <h1 className="text-headline">
          {reportType === '면접' ? '면접 상세 리포트' : '시험 전 상세 플랜'}
        </h1>
        <p className="mt-2 text-body">
          {query.name ? `${query.name}님 · ` : ''}
          {query.company_name ?? query.exam_name}
        </p>
        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          {y}년 {m}월 {d}일
        </p>

        {content.mock && (
          <p
            className="mt-3 p-3 text-label"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-button)',
              color: 'var(--text-sub)',
            }}
          >
            샘플 리포트입니다. ANTHROPIC_API_KEY를 넣으면 실제 내용이 생성됩니다.
          </p>
        )}
      </header>

      <div className="mt-section space-y-card-gap px-screen">
        {content.sections.map((section) => {
          if (!section.highlight) visibleIndex += 1
          const index = visibleIndex

          if (section.key === 'saju') {
            return (
              <ReportSection key={section.key} index={index} title={section.title}>
                <SajuTable saju={free.saju} />
                <div className="mt-4">
                  <ElementBar
                    scores={free.profile.scores}
                    strong={free.profile.strong}
                    weak={free.profile.weak}
                  />
                </div>
              </ReportSection>
            )
          }

          if (section.key === 'calendar') {
            return (
              <ReportSection key={section.key} index={index} title={section.title}>
                <MonthCalendar data={monthFlow} year={examYear} />
              </ReportSection>
            )
          }

          const body = content.generated[section.key]

          // 궁합 섹션은 미리 쓴 조각이 앞에 오고 AI 생성분이 뒤에 붙습니다
          if (section.key === 'compatibility') {
            return (
              <ReportSection
                key={section.key}
                index={index}
                title={section.title}
                body={body}
              >
                {content.compatibility && (
                  <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                    궁합 점수 {content.compatibility.score} · 관계{' '}
                    {content.compatibility.relation}
                    {content.foundedDate && ` · 설립 ${content.foundedDate}`}
                  </p>
                )}
              </ReportSection>
            )
          }

          if (!body) return null

          return (
            <ReportSection
              key={section.key}
              index={index}
              title={section.title}
              body={body}
              highlight={section.highlight}
            />
          )
        })}
      </div>

      <div className="mt-section px-screen">
        <KakaoShareButton reportId={report.id} isKakaoUser={provider === 'kakao'} />
      </div>

      <Disclaimer />
    </main>
  )
}
