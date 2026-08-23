/**
 * 마이페이지 (탭 3) — PRD 14.13, 14.14
 *
 * 로그인 상태면 계정 정보와 리포트 목록을, 비로그인이면 로그인 유도를 보여줍니다.
 */

import type { Metadata } from 'next'

import EmptyState from '@/components/my/EmptyState'
import MenuList from '@/components/my/MenuList'
import ReportList, { type ReportListItem } from '@/components/my/ReportList'
import LogoutButton from '@/components/my/LogoutButton'
import DeleteAccountButton from '@/components/my/DeleteAccountButton'
import { buildFreeResult, type UserInput } from '@/lib/content/assemble'
import { parseLocalDateTime } from '@/lib/saju/calculate'
import { diffDays } from '@/lib/saju/fortune'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export const metadata: Metadata = { title: '마이페이지 · 시험사주' }

const ACCOUNT_MENU = [
  { label: '내 정보 수정', href: '/my/profile' },
  { label: '결제 내역', href: '/my/payments' },
]

const SUPPORT_MENU = [
  { label: '문의하기', href: '/my/inquiry' },
  { label: '자주 묻는 질문', href: '/my/faq' },
]

const POLICY_MENU = [
  { label: '알림 설정', href: '/my/settings' },
  { label: '이용약관', href: '/terms' },
  { label: '개인정보 처리방침', href: '/privacy' },
]

const GUEST_MENU = [...SUPPORT_MENU, ...POLICY_MENU.slice(1)]

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
  exam_day_score: number | null
}

interface ReportRow {
  id: string
  query_id: string
  status: string | null
}

function formatBirth(
  birthDate: string | null,
  birthTime: string | null,
  hasBirthTime: boolean | null
): string | null {
  if (!birthDate) return null
  const [y, m, d] = birthDate.split('-').map(Number)
  const base = `${y}년 ${m}월 ${d}일`
  if (!hasBirthTime || !birthTime) return `${base} · 태어난 시간 모름`
  return `${base} ${birthTime.slice(0, 5)}`
}

export default async function MyPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-md">
        <h1 className="px-screen pt-6 text-headline">마이페이지</h1>
        <EmptyState />
        <div className="mt-section space-y-card-gap px-screen">
          <MenuList items={GUEST_MENU} />
        </div>
      </main>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="mx-auto max-w-md">
        <h1 className="px-screen pt-6 text-headline">마이페이지</h1>
        <EmptyState />
        <div className="mt-section space-y-card-gap px-screen">
          <MenuList items={GUEST_MENU} />
        </div>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, birth_date, birth_time, has_birth_time')
    .eq('id', user.id)
    .maybeSingle()

  const { data: queryRows } = await supabase
    .from('queries')
    .select(
      'id, exam_name, exam_type, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title, exam_day_score'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: reportRows } = await supabase
    .from('reports')
    .select('id, query_id, status')
    .eq('user_id', user.id)

  const reportByQuery = new Map<string, ReportRow>()
  for (const r of (reportRows ?? []) as ReportRow[]) reportByQuery.set(r.query_id, r)

  const today = new Date()
  const items: ReportListItem[] = ((queryRows ?? []) as QueryRow[]).map((row) => {
    const report = reportByQuery.get(row.id) ?? null

    // 저장된 점수가 없으면 그 자리에서 다시 계산합니다
    let score = row.exam_day_score
    if (score === null) {
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
      score = buildFreeResult(input, today).examDayScore
    }

    return {
      queryId: row.id,
      reportId: report?.id ?? null,
      examName: row.exam_name,
      examType: row.exam_type,
      examDate: row.exam_date,
      dday: diffDays(today, parseLocalDateTime(row.exam_date, null)),
      examDayScore: score,
      isPaid: Boolean(report && report.status === 'completed'),
      status: report?.status ?? null,
    }
  })

  const provider = user.app_metadata?.provider
  const providerLabel =
    provider === 'kakao' ? '카카오 계정' : provider === 'google' ? '구글 계정' : '이메일 계정'

  return (
    <main className="mx-auto max-w-md pb-4">
      <h1 className="px-screen pt-6 text-headline">마이페이지</h1>

      <section className="px-screen pt-4">
        <p className="text-card-title">{profile?.name ?? user.email}</p>
        {formatBirth(
          profile?.birth_date ?? null,
          profile?.birth_time ?? null,
          profile?.has_birth_time ?? null
        ) && (
          <p className="mt-1 text-body" style={{ color: 'var(--text-sub)' }}>
            {formatBirth(
              profile?.birth_date ?? null,
              profile?.birth_time ?? null,
              profile?.has_birth_time ?? null
            )}
          </p>
        )}
        <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
          {providerLabel}
        </p>
      </section>

      <section className="px-screen pt-section">
        <h2 className="text-card-title">내 리포트</h2>
        <div className="mt-3">
          <ReportList items={items} />
        </div>
      </section>

      <div className="mt-section space-y-card-gap px-screen">
        <MenuList items={ACCOUNT_MENU} />
        <MenuList items={SUPPORT_MENU} />
        <MenuList items={POLICY_MENU} />
      </div>

      <div className="mt-section space-y-2 px-screen">
        <LogoutButton />
        <DeleteAccountButton />
      </div>
    </main>
  )
}
