/**
 * 조회 기록 저장 (PRD 11.2, 13.1)
 *
 * 무료 결과 하단의 "내 결과 저장하기"에서 호출합니다.
 * 로그인하지 않았으면 401을 돌려주고, 클라이언트가 로그인 화면으로 보냅니다.
 *
 * 계산 결과 일부를 함께 캐싱해 마이페이지와 홈에서 재계산을 줄입니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { buildFreeResult, type UserInput } from '@/lib/content/assemble'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

const EXAM_TYPES: ExamType[] = ['필기', '면접', '실기']

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  let body: Partial<UserInput>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  if (
    !body.examName ||
    !body.examDate ||
    !body.birthDate ||
    !body.examType ||
    !EXAM_TYPES.includes(body.examType as ExamType)
  ) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const input: UserInput = {
    name: body.name ?? null,
    examName: body.examName,
    examCategory: body.examCategory ?? null,
    examType: body.examType as ExamType,
    examDate: body.examDate,
    startTime: body.startTime ?? null,
    birthDate: body.birthDate,
    birthTime: body.birthTime ?? null,
    hasBirthTime: Boolean(body.hasBirthTime),
    companyScale: (body.companyScale as CompanyScale | null) ?? null,
    workType: (body.workType as WorkType | null) ?? null,
    jobTitle: body.jobTitle ?? null,
  }

  const result = buildFreeResult(input)

  // 같은 시험을 다시 저장하면 중복 카드가 쌓이므로 먼저 확인합니다
  const { data: existing } = await supabase
    .from('queries')
    .select('id')
    .eq('user_id', user.id)
    .eq('exam_name', input.examName)
    .eq('exam_date', input.examDate)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ id: existing.id, existed: true })
  }

  const { data, error } = await supabase
    .from('queries')
    .insert({
      user_id: user.id,
      exam_name: input.examName,
      exam_category: input.examCategory,
      exam_type: input.examType,
      exam_date: input.examDate,
      exam_start_time: input.startTime,
      company_scale: input.companyScale,
      work_type: input.workType,
      job_title: input.jobTitle,
      birth_date: input.birthDate,
      birth_time: input.birthTime,
      has_birth_time: input.hasBirthTime,
      name: input.name,
      day_stem: result.saju.dayStemName,
      day_pillar_index: result.saju.dayPillarIndex,
      strong_element: result.profile.strong,
      weak_element: result.profile.weak,
      exam_day_score: result.examDayScore,
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  }

  // 프로필에 생년월일이 비어 있으면 채워둡니다 (PRD 11.4, 11.5)
  await supabase
    .from('profiles')
    .update({
      name: input.name ?? undefined,
      birth_date: input.birthDate,
      birth_time: input.birthTime,
      has_birth_time: input.hasBirthTime,
    })
    .eq('id', user.id)
    .is('birth_date', null)

  return NextResponse.json({ id: data.id })
}
