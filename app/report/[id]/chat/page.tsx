/**
 * 리포트 후 대화 화면 (FIX_4 [3]-1)
 *
 * 리포트 하단의 "합격이와 더 자세하게 이야기하러 가기"로 들어옵니다.
 * 3,900원에 포함된 기능이라 결제 확인이 따로 없고, 리포트가 완료된
 * 건인지만 봅니다.
 *
 * 대화 내용은 conversations에 저장돼 있어 나갔다 들어와도 이어집니다
 * (FIX_4 [3]-10). 서버에서 미리 읽어 첫 화면부터 그려 둡니다.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import ReportChat, { type ChatViewMessage } from '@/components/chat/ReportChat'
import { CHARACTER_NAME } from '@/lib/content/characters'
import { getChatQuestions } from '@/lib/content/chat-questions'
import { isExhausted, remainingRatio } from '@/lib/ai/chat-cost'
import {
  buildFreeResult,
  type ExamPeriod,
  type UserInput,
} from '@/lib/content/assemble'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export const metadata: Metadata = { title: `${CHARACTER_NAME}와 이야기하기 · 시험사주` }

interface ReportRow {
  id: string
  user_id: string
  query_id: string
  report_type: string
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
}

interface ConversationRow {
  messages: ChatViewMessage[] | null
  total_cost: number | null
  turn_count: number | null
}

export default async function ReportChatPage({
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

  if (!user) redirect(`/login?next=${encodeURIComponent(`/report/${id}/chat`)}`)

  const { data: report } = await supabase
    .from('reports')
    .select('id, user_id, query_id, report_type, status')
    .eq('id', id)
    .maybeSingle<ReportRow>()

  if (!report || report.user_id !== user.id) notFound()

  // 아직 만들어지는 중이거나 실패한 건은 대화할 재료가 없습니다
  if (report.status !== 'completed') redirect(`/report/${id}`)

  const { data: query } = await supabase
    .from('queries')
    .select(
      'exam_name, exam_category, exam_type, exam_period, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title'
    )
    .eq('id', report.query_id)
    .maybeSingle<QueryRow>()

  if (!query) notFound()

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
  const reportType = report.report_type === '면접' ? '면접' : '필기'

  const { data: conversation } = await supabase
    .from('conversations')
    .select('messages, total_cost, turn_count')
    .eq('report_id', report.id)
    .maybeSingle<ConversationRow>()

  const state = {
    totalCost: Number(conversation?.total_cost ?? 0),
    turnCount: conversation?.turn_count ?? 0,
  }
  const messages = conversation?.messages ?? []

  const greeting = [
    `${query.name ? `${query.name}님, ` : ''}리포트는 잘 읽으셨나요?`,
    '리포트에 다 담지 못한 이야기가 남아 있어요. 궁금한 것을 골라 주세요.',
  ]

  return (
    <main className="min-h-[100dvh]" style={{ background: 'var(--bg)' }}>
      <header className="mx-auto flex max-w-md items-center px-2 py-2">
        <Link
          href={`/report/${report.id}`}
          aria-label="리포트로 돌아가기"
          className="flex h-11 w-11 items-center justify-center"
          style={{ color: 'var(--text)' }}
        >
          <ChevronLeft size={24} aria-hidden />
        </Link>
      </header>

      <ReportChat
        reportId={report.id}
        greeting={greeting}
        initialMessages={messages}
        initialGauge={remainingRatio(state)}
        initialExhausted={isExhausted(state)}
        questions={getChatQuestions(reportType, free.dday)}
        initialAskedIds={messages
          .filter((m) => m.role === 'user' && m.questionId)
          .map((m) => m.questionId as string)}
      />
    </main>
  )
}
