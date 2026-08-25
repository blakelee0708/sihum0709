/**
 * 리포트 관리 (PRD 22.6)
 *
 * 가장 먼저 필요해지는 화면입니다.
 * 결제는 됐는데 결과물이 없는 상태를 방치하면 안 됩니다.
 */

import Link from 'next/link'

import ActionButton from '@/components/admin/ActionButton'
import AdminCard, { AdminEmpty } from '@/components/admin/AdminCard'
import { adminDb } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'failed', label: '실패' },
  { key: 'pending', label: '대기' },
  { key: 'completed', label: '완료' },
] as const

interface ReportRow {
  id: string
  user_id: string
  query_id: string
  report_type: string
  status: string | null
  error_message: string | null
  retry_count: number | null
  input_tokens: number | null
  output_tokens: number | null
  generation_ms: number | null
  granted_by: string | null
  created_at: string
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  completed: { text: '완료', color: 'var(--score-high)' },
  pending: { text: '대기', color: 'var(--text-sub)' },
  failed: { text: '실패', color: 'var(--score-low)' },
  refunded: { text: '환불됨', color: 'var(--text-sub)' },
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const filter = FILTERS.some((f) => f.key === status) ? status! : 'all'

  const db = adminDb()

  let query = db
    .from('reports')
    .select(
      'id, user_id, query_id, report_type, status, error_message, retry_count, input_tokens, output_tokens, generation_ms, granted_by, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50)

  if (filter !== 'all') query = query.eq('status', filter)

  const { data: rows } = await query
  const reports = (rows ?? []) as ReportRow[]

  // 사용자 이메일과 대상 시험명을 함께 보여줍니다
  const userIds = [...new Set(reports.map((r) => r.user_id))]
  const queryIds = [...new Set(reports.map((r) => r.query_id))]

  const [{ data: users }, { data: queries }] = await Promise.all([
    userIds.length
      ? db.from('profiles').select('id, name').in('id', userIds)
      : Promise.resolve({ data: [] }),
    queryIds.length
      ? db.from('queries').select('id, exam_name, company_name').in('id', queryIds)
      : Promise.resolve({ data: [] }),
  ])

  const nameById = new Map((users ?? []).map((u) => [u.id, u.name as string | null]))
  const examById = new Map(
    (queries ?? []).map((q) => [q.id, (q.company_name as string) || (q.exam_name as string)])
  )

  return (
    <div className="space-y-4">
      <h1 className="text-headline">리포트 관리</h1>

      <nav className="flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'all' ? '/admin/reports' : `/admin/reports?status=${f.key}`}
            className="flex min-h-[36px] items-center px-3 text-label"
            style={{
              background: filter === f.key ? 'var(--primary)' : 'var(--surface)',
              color: filter === f.key ? '#fff' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
            }}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {reports.length === 0 ? (
        <AdminEmpty message="해당하는 리포트가 없습니다." />
      ) : (
        <ul className="space-y-card-gap">
          {reports.map((r) => {
            const s = STATUS_LABEL[r.status ?? 'pending'] ?? STATUS_LABEL.pending
            const retry = r.retry_count ?? 0

            return (
              <li key={r.id}>
                <AdminCard>
                  <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                    {formatDateTime(r.created_at)}
                  </p>

                  <p className="mt-1 text-body">
                    {nameById.get(r.user_id) ?? '이름 없음'}
                    <span className="ml-2 text-label" style={{ color: 'var(--text-sub)' }}>
                      {r.user_id.slice(0, 8)}
                    </span>
                  </p>

                  <p className="mt-1 text-body">
                    {r.report_type} · {examById.get(r.query_id) ?? '대상 없음'}
                  </p>

                  <p className="mt-2 text-body" style={{ color: s.color }}>
                    {s.text}
                    {r.error_message && ` · ${r.error_message}`}
                    {retry > 0 && ` · 재시도 ${retry}회`}
                    {r.granted_by && ` · 무료 지급 (${r.granted_by})`}
                  </p>

                  {(r.input_tokens || r.generation_ms) && (
                    <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
                      토큰 입력 {r.input_tokens ?? 0} / 출력 {r.output_tokens ?? 0}
                      {r.generation_ms ? ` · ${(r.generation_ms / 1000).toFixed(1)}초` : ''}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionButton
                      label="재생성"
                      busyLabel="만드는 중"
                      endpoint="/api/admin/report/regenerate"
                      body={{ reportId: r.id }}
                      confirm="AI를 다시 호출합니다. 원가가 발생합니다. 진행할까요?"
                      variant="primary"
                    />

                    <Link
                      href={`/admin/users?q=${r.user_id}`}
                      className="flex min-h-[36px] items-center px-3 text-label"
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-button)',
                        color: 'var(--text)',
                      }}
                    >
                      사용자 보기
                    </Link>
                  </div>
                </AdminCard>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
