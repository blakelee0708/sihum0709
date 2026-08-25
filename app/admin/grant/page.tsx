/**
 * 무료 지급 · 쿠폰 · 공지 배너 (PRD 22.11, 22.15)
 *
 * 용도는 CS 보상, 지인 테스트, 인플루언서 제공, 이벤트 당첨입니다.
 */

import AdminCard, { AdminEmpty } from '@/components/admin/AdminCard'
import { adminDb } from '@/lib/admin/auth'

import { CouponForm, GrantForm, NoticeForm } from './GrantForms'

export const dynamic = 'force-dynamic'

function fmt(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default async function AdminGrantPage() {
  const db = adminDb()

  const [{ data: coupons }, { data: notice }, { data: recentQueries }] = await Promise.all([
    db
      .from('coupons')
      .select('code, discount_type, discount_value, max_uses, used_count, valid_until, memo')
      .order('created_at', { ascending: false })
      .limit(20),
    db
      .from('notices')
      .select('message')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from('queries')
      .select('id, user_id, exam_name, exam_type, exam_date, name, created_at')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="space-y-section">
      <h1 className="text-headline">무료 지급 · 쿠폰</h1>

      <section>
        <h2 className="text-card-title">직접 지급 (CS용)</h2>
        <div className="mt-3">
          <AdminCard>
            <GrantForm />
          </AdminCard>
        </div>
      </section>

      <section>
        <h2 className="text-card-title">최근 조회 (지급 대상 찾기)</h2>
        <div className="mt-3">
          {(recentQueries ?? []).length === 0 ? (
            <AdminEmpty message="로그인 사용자의 조회 기록이 없습니다." />
          ) : (
            <AdminCard>
              <ul className="space-y-3">
                {(recentQueries ?? []).map((q) => (
                  <li key={q.id as string}>
                    <p className="text-body">
                      {(q.name as string) ?? '이름 없음'} · {q.exam_name as string} (
                      {q.exam_type as string})
                    </p>
                    <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                      시험일 {q.exam_date as string} · {fmt(q.created_at as string)} 조회
                    </p>
                    <code
                      className="mt-1 block text-label"
                      style={{ color: 'var(--primary)', wordBreak: 'break-all' }}
                    >
                      {q.id as string}
                    </code>
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-card-title">쿠폰 발급 (마케팅용)</h2>
        <div className="mt-3">
          <AdminCard>
            <CouponForm />
          </AdminCard>
        </div>
      </section>

      <section>
        <h2 className="text-card-title">발급된 쿠폰</h2>
        <div className="mt-3">
          {(coupons ?? []).length === 0 ? (
            <AdminEmpty message="발급된 쿠폰이 없습니다." />
          ) : (
            <ul className="space-y-card-gap">
              {(coupons ?? []).map((c) => (
                <li key={c.code as string}>
                  <AdminCard>
                    <p className="text-body">
                      {c.code as string} ·{' '}
                      {c.discount_type === 'percent'
                        ? `${c.discount_value}%`
                        : `${(c.discount_value as number).toLocaleString()}원`}{' '}
                      · {c.used_count ?? 0}
                      {c.max_uses ? `/${c.max_uses}` : ''} 사용
                    </p>
                    <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                      {c.valid_until ? `${fmt(c.valid_until as string)}까지` : '기간 제한 없음'}
                      {c.memo ? ` · ${c.memo as string}` : ''}
                    </p>
                  </AdminCard>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-card-title">공지 배너</h2>
        <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
          활성화하면 홈 최상단에 표시됩니다. 장애 시 문의를 크게 줄일 수 있습니다.
        </p>
        <div className="mt-3">
          <AdminCard>
            <NoticeForm current={(notice?.message as string) ?? null} />
          </AdminCard>
        </div>
      </section>
    </div>
  )
}
