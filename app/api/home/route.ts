/**
 * 홈 개인화 블록 데이터 (PRD 14.5)
 *
 * 로그인 사용자의 진행 중인 시험과 오늘의 운을 돌려줍니다.
 * 비로그인이거나 Supabase 미설정이면 빈 목록입니다.
 */

import { NextResponse } from 'next/server'

import { buildFreeResult, type UserInput } from '@/lib/content/assemble'
import { diffDays } from '@/lib/saju/fortune'
import { parseLocalDateTime } from '@/lib/saju/calculate'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'

interface QueryRow {
  id: string
  exam_name: string
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
}

export async function GET() {
  const empty = { name: null, queries: [] }

  if (!isSupabaseConfigured) return NextResponse.json(empty)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json(empty)

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // 아직 지나지 않은 시험만 보여줍니다
  const { data: rows } = await supabase
    .from('queries')
    .select(
      'id, exam_name, exam_type, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title'
    )
    .eq('user_id', user.id)
    .gte('exam_date', todayKey)
    .order('exam_date', { ascending: true })
    .limit(5)

  const queries = ((rows ?? []) as QueryRow[]).map((row) => {
    const input: UserInput = {
      name: row.name,
      examName: row.exam_name,
      examType: row.exam_type as ExamType,
      examDate: row.exam_date,
      startTime: row.exam_start_time,
      birthDate: row.birth_date,
      birthTime: row.birth_time,
      hasBirthTime: row.has_birth_time,
      companyScale: row.company_scale as CompanyScale | null,
      workType: row.work_type as WorkType | null,
      jobTitle: row.job_title,
    }
    const result = buildFreeResult(input, today)

    return {
      queryId: row.id,
      examName: row.exam_name,
      examType: row.exam_type,
      dday: diffDays(today, parseLocalDateTime(row.exam_date, null)),
      todayScore: result.todayScore,
    }
  })

  return NextResponse.json({ name: profile?.name ?? null, queries })
}
