/**
 * 유료 리포트 (PRD 14.11)
 *
 * 결제 완료 시 저장된 결과를 읽습니다. 재열람 시 AI를 다시 부르지 않습니다 (PRD 8.16).
 * 생성 중이면 대화형 진행 표시를, 실패했으면 재시도 화면을 보여줍니다.
 */

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import Disclaimer from '@/components/layout/Disclaimer'
import ElementBar from '@/components/report/ElementBar'
import FailedState from '@/components/report/FailedState'
import GeneratingState from '@/components/report/GeneratingState'
import KakaoShareButton from '@/components/report/KakaoShareButton'
import MonthCalendar from '@/components/report/MonthCalendar'
import ReportSection, { ReportBody } from '@/components/report/ReportSection'
import ReportCover from '@/components/report/ReportCover'
import SajuTable from '@/components/report/SajuTable'
import {
  buildFreeResult,
  formatExamDate,
  type ExamPeriod,
  type UserInput,
} from '@/lib/content/assemble'
import { getMonthFlow } from '@/lib/saju/fortune'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'
import { getReportSpec, type SectionSpec } from '@/lib/ai/spec'
import { isZombie } from '@/lib/ai/run-report'
import type { ReportDdayRange } from '@/lib/saju/fortune'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export const metadata: Metadata = { title: '내 리포트 · 시험사주' }

interface ReportContent {
  sections: SectionSpec[]
  generated: Record<string, string>
  /** AI 생성분 앞에 붙는 미리 쓴 조각 (PRD 8.18) */
  fragments?: {
    compatibility?: string
    position?: string
    shipsin?: string
    pattern?: string
  }
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
  /** 생성 시작 시각. 좀비 판별에 씁니다 (PRD 14.12) */
  started_at: string | null
  created_at: string | null
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
    .select(
      'id, user_id, query_id, report_type, dday_range, content, status, retry_count, started_at, created_at'
    )
    .eq('id', id)
    .maybeSingle<ReportRow>()

  if (!report || report.user_id !== user.id) notFound()

  const { data: query } = await supabase
    .from('queries')
    .select(
      'exam_name, exam_category, exam_type, exam_period, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title, company_name'
    )
    .eq('id', report.query_id)
    .maybeSingle<QueryRow>()

  if (!query) notFound()

  const reportType = report.report_type === '면접' ? '면접' : '필기'

  // PRD 14.12 재진입 처리 — status로 분기합니다
  if (report.status === 'failed') {
    return <FailedState reportId={report.id} retryCount={report.retry_count ?? 0} />
  }

  // 환불된 건은 열지 않습니다
  if (report.status === 'refunded') {
    return (
      <FailedState
        reportId={report.id}
        retryCount={3}
        headline="환불된 리포트예요"
        description={[
          '이 리포트는 환불 처리되었습니다.',
          '다시 필요하시면 새로 결제해 주세요.',
        ]}
      />
    )
  }

  // 계산 섹션은 저장하지 않고 매번 다시 계산합니다. 같은 입력이면 같은 값입니다.
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

  const free = buildFreeResult(userInput)
  const examYear = Number(query.exam_date.slice(0, 4))

  // 명식과 오행 분포는 AI 없이도 이미 값이 있으므로 대기 중에 먼저 보여줍니다 (PRD 14.11)
  if (report.status !== 'completed' || !report.content) {
    // 서버가 중간에 죽으면 pending인 채로 남습니다. started_at으로 판별합니다.
    const base = report.started_at ?? report.created_at
    const elapsedMs = base ? Date.now() - new Date(base).getTime() : 0

    return (
      <GeneratingState
        reportId={report.id}
        retryCount={report.retry_count ?? 0}
        zombie={isZombie(report.started_at, report.created_at)}
        elapsedMs={elapsedMs}
        reportType={reportType}
        vars={{
          name: query.name,
          examDate: formatExamDate(query.exam_date),
          exam: query.exam_name,
          company: query.company_name,
          jobTitle: query.job_title,
        }}
        saju={free.saju}
        profile={free.profile}
      />
    )
  }

  const monthFlow = getMonthFlow(free.saju, examYear)

  // 제목은 구간마다 다릅니다 (PRD 8.8). 저장된 구간으로 다시 만듭니다.
  const spec = getReportSpec(reportType, report.dday_range as ReportDdayRange, examYear, {
    hasStartTime: Boolean(query.exam_start_time),
  })

  const content = report.content
  const provider = user.app_metadata?.provider

  const [y, m, d] = query.exam_date.split('-').map(Number)

  let visibleIndex = 0

  return (
    <main className="mx-auto max-w-md pb-6">
      <header className="px-screen pt-6">
        <h1 className="text-headline">{spec.title}</h1>
        <p className="mt-2 text-body">
          {query.name ? `${query.name}님 · ` : ''}
          {query.company_name ?? query.exam_name}
          {query.job_title ? ` · ${query.job_title}` : ''}
        </p>
        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          {y}년 {m}월 {d}일 · {free.dday >= 0 ? `D-${free.dday}` : `D+${Math.abs(free.dday)}`}
        </p>

        {/* 표지 — 지수 3개와 유형 뱃지 (PRD 8.3, 8.4) */}
        <ReportCover
          examType={reportType}
          examDayScore={free.examDayScore}
          todayScore={free.todayScore}
          potentialScore={free.potentialScore}
          badge={free.badge}
          compatibility={content.compatibility}
        />

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

          const body = content.generated[section.key]

          // 조각이 앞에, AI 생성분이 뒤에 옵니다 (PRD 8.18).
          // 순서를 바꾸면 사주 해석의 일관성이 무너집니다.
          const lead =
            section.key === 'pattern'
              ? content.fragments?.shipsin
              : section.key === 'strategy'
                ? content.fragments?.pattern
                : section.key === 'compatibility'
                  ? content.fragments?.compatibility ?? content.fragments?.position
                  : undefined

          // 계산 섹션은 그림이 먼저 오고 해설이 뒤에 붙습니다
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
                {body && <ReportBody body={body} />}
              </ReportSection>
            )
          }

          if (section.key === 'calendar') {
            return (
              <ReportSection key={section.key} index={index} title={section.title}>
                <MonthCalendar data={monthFlow} year={examYear} />
                {body && <ReportBody body={body} />}
              </ReportSection>
            )
          }

          if (section.key === 'compatibility') {
            return (
              <ReportSection
                key={section.key}
                index={index}
                title={section.title}
                lead={lead}
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

          if (!body && !lead) return null

          return (
            <ReportSection
              key={section.key}
              index={index}
              title={section.title}
              lead={lead}
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
