/**
 * 무료 결과 (PRD 3.2, 14.9)
 *
 * 대화에서 넘어온 경우 sessionStorage의 답변으로 그립니다.
 * ?q=<queryId>로 들어온 경우(마이페이지, 홈 개인화 블록) 저장된 조회를 읽어옵니다.
 */

import type { Metadata } from 'next'

import type { UserInput } from '@/lib/content/assemble'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

import ResultView from './ResultView'

export const metadata: Metadata = {
  title: '내 시험운 결과 · 시험사주',
}

interface QueryRow {
  id: string
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

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  if (!q || !isSupabaseConfigured) {
    return <ResultView />
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('queries')
    .select(
      'id, exam_name, exam_category, exam_type, exam_period, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title'
    )
    .eq('id', q)
    .maybeSingle<QueryRow>()

  if (!data) return <ResultView />

  const input: UserInput = {
    name: data.name,
    examName: data.exam_name,
    examCategory: data.exam_category,
    examType: data.exam_type as ExamType,
    examDate: data.exam_date,
    startTime: data.exam_start_time,
    birthDate: data.birth_date,
    birthTime: data.birth_time,
    hasBirthTime: data.has_birth_time,
    companyScale: data.company_scale as CompanyScale | null,
    workType: data.work_type as WorkType | null,
    jobTitle: data.job_title,
  }

  return <ResultView serverInput={input} queryId={data.id} />
}
