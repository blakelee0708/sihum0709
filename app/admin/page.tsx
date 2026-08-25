/**
 * 관리자 대시보드 (PRD 22.5)
 *
 * 처리 필요 항목이 0이 아니면 상단에 강조 표시합니다.
 */

import Link from 'next/link'

import StatCard from '@/components/admin/StatCard'
import AdminCard from '@/components/admin/AdminCard'
import { adminDb } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

/** PRD 8.12 — Sonnet 5 백만 토큰당 입력 $2, 출력 $10. 환율 1,400원 */
const USD_PER_INPUT = 2 / 1_000_000
const USD_PER_OUTPUT = 10 / 1_000_000
const KRW = 1400

function startOfToday(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function startOfMonth(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

/**
 * 건수만 세는 헬퍼.
 *
 * supabase-js의 빌더 타입이 체이닝 단계마다 달라져 그대로 쓰기 번거로우므로,
 * 필터를 거는 부분만 느슨하게 받고 결과에서 count만 꺼냅니다.
 */
type CountFilter = (q: any) => any // eslint-disable-line @typescript-eslint/no-explicit-any

async function count(
  db: ReturnType<typeof adminDb>,
  table: string,
  build: CountFilter
): Promise<number> {
  const q = db.from(table).select('*', { count: 'exact', head: true })
  const { count: n } = (await build(q)) as { count: number | null }
  return n ?? 0
}

export default async function AdminDashboard() {
  const db = adminDb()
  const today = startOfToday()
  const month = startOfMonth()

  // 오늘 지표
  const [views, payments, failed, openInquiries] = await Promise.all([
    count(db, 'queries', (q) => q.gte('created_at', today)),
    db
      .from('payments')
      .select('amount, is_granted')
      .gte('paid_at', today)
      .is('refunded_at', null),
    count(db, 'reports', (q) => q.eq('status', 'failed')),
    count(db, 'inquiries', (q) => q.eq('status', 'open')),
  ])

  const paidToday = (payments.data ?? []).filter((p) => !p.is_granted)
  const revenueToday = paidToday.reduce((a, p) => a + (p.amount ?? 0), 0)

  const { count: refundsToday } = await db
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .gte('refunded_at', today)

  // AI 원가 (PRD 22.13)
  const [{ data: todayTokens }, { data: monthTokens }] = await Promise.all([
    db.from('reports').select('input_tokens, output_tokens').gte('created_at', today),
    db.from('reports').select('input_tokens, output_tokens').gte('created_at', month),
  ])

  const cost = (rows: { input_tokens: number | null; output_tokens: number | null }[] | null) =>
    Math.round(
      (rows ?? []).reduce(
        (a, r) =>
          a + (r.input_tokens ?? 0) * USD_PER_INPUT + (r.output_tokens ?? 0) * USD_PER_OUTPUT,
        0
      ) * KRW
    )

  // 최근 7일 조회수와 결제 건수
  const week: { date: string; queries: number; payments: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)

    const [q, p] = await Promise.all([
      count(db, 'queries', (x) =>
        x.gte('created_at', d.toISOString()).lt('created_at', next.toISOString())
      ),
      count(db, 'payments', (x) =>
        x
          .gte('paid_at', d.toISOString())
          .lt('paid_at', next.toISOString())
          .eq('is_granted', false)
      ),
    ])

    week.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, queries: q, payments: p })
  }

  const maxQ = Math.max(...week.map((w) => w.queries), 1)
  const needsAttention = failed > 0 || openInquiries > 0

  return (
    <div className="space-y-section">
      <h1 className="text-headline">대시보드</h1>

      <section>
        <h2 className="text-card-title">오늘</h2>
        <div className="mt-3 grid grid-cols-2 gap-card-gap lg:grid-cols-4">
          <StatCard label="조회" value={views} />
          <StatCard label="결제" value={paidToday.length} />
          <StatCard label="매출" value={`${revenueToday.toLocaleString()}원`} />
          <StatCard label="환불" value={refundsToday ?? 0} />
        </div>
      </section>

      <section>
        <h2 className="text-card-title">처리 필요</h2>
        <div className="mt-3 grid gap-card-gap sm:grid-cols-2">
          <Link href="/admin/reports?status=failed">
            <StatCard
              label="리포트 생성 실패"
              value={`${failed}건`}
              emphasize={failed > 0}
              sub={failed > 0 ? '눌러서 확인' : '없음'}
            />
          </Link>
          <Link href="/admin/inquiries">
            <StatCard
              label="미처리 문의"
              value={`${openInquiries}건`}
              emphasize={openInquiries > 0}
              sub={openInquiries > 0 ? '눌러서 확인' : '없음'}
            />
          </Link>
        </div>

        {!needsAttention && (
          <p className="mt-2 text-label" style={{ color: 'var(--text-sub)' }}>
            지금 처리할 항목이 없습니다.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-card-title">최근 7일</h2>
        <AdminCard>
          <ul className="space-y-2">
            {week.map((w) => (
              <li key={w.date} className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-label" style={{ color: 'var(--text-sub)' }}>
                  {w.date}
                </span>
                <span
                  className="h-3 shrink-0"
                  style={{
                    width: `${Math.max((w.queries / maxQ) * 60, w.queries > 0 ? 2 : 0)}%`,
                    background: 'var(--primary)',
                    borderRadius: 4,
                  }}
                />
                <span className="text-label" style={{ color: 'var(--text)' }}>
                  조회 {w.queries} · 결제 {w.payments}
                </span>
              </li>
            ))}
          </ul>
        </AdminCard>
      </section>

      <section>
        <h2 className="text-card-title">AI 원가</h2>
        <p className="mt-2 text-body">
          오늘 {cost(todayTokens).toLocaleString()}원 · 이번 달{' '}
          {cost(monthTokens).toLocaleString()}원
        </p>
        <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
          claude-sonnet-5 기준 (입력 $2 / 출력 $10 per 1M, 환율 {KRW.toLocaleString()}원)
        </p>
      </section>
    </div>
  )
}
