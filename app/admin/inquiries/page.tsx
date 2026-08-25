/**
 * 문의 관리 (PRD 22.10)
 *
 * 해당 사용자의 결제 이력과 리포트 상태를 문의 옆에 함께 표시합니다.
 * "결제했는데 리포트가 안 보여요" 문의가 들어오면 상태를 바로 확인할 수 있어야 합니다.
 */

import Link from 'next/link'

import AdminCard, { AdminEmpty } from '@/components/admin/AdminCard'
import { adminDb } from '@/lib/admin/auth'

import InquiryReply from './InquiryReply'

export const dynamic = 'force-dynamic'

const FILTERS = [
  { key: 'open', label: '미처리' },
  { key: 'answered', label: '처리중' },
  { key: 'closed', label: '완료' },
  { key: 'all', label: '전체' },
] as const

interface InquiryRow {
  id: string
  user_id: string | null
  category: string
  content: string
  email: string
  status: string | null
  reply: string | null
  replied_at: string | null
  replied_by: string | null
  created_at: string
}

function fmt(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const filter = FILTERS.some((f) => f.key === status) ? status! : 'open'

  const db = adminDb()

  let q = db
    .from('inquiries')
    .select(
      'id, user_id, category, content, email, status, reply, replied_at, replied_by, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50)

  if (filter !== 'all') q = q.eq('status', filter)

  const { data: rows } = await q
  const inquiries = (rows ?? []) as InquiryRow[]

  // 문의한 사용자의 결제/리포트 상태를 함께 봅니다
  const userIds = [...new Set(inquiries.map((i) => i.user_id).filter(Boolean))] as string[]

  const [{ data: payments }, { data: reports }] = await Promise.all([
    userIds.length
      ? db.from('payments').select('user_id, is_granted, refunded_at').in('user_id', userIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? db.from('reports').select('user_id, status').in('user_id', userIds)
      : Promise.resolve({ data: [] }),
  ])

  const payByUser = new Map<string, number>()
  for (const p of payments ?? []) {
    if (p.is_granted || p.refunded_at) continue
    const id = p.user_id as string
    payByUser.set(id, (payByUser.get(id) ?? 0) + 1)
  }

  const failByUser = new Map<string, number>()
  for (const r of reports ?? []) {
    if (r.status !== 'failed') continue
    const id = r.user_id as string
    failByUser.set(id, (failByUser.get(id) ?? 0) + 1)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-headline">문의 관리</h1>

      <nav className="flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/inquiries?status=${f.key}`}
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

      {inquiries.length === 0 ? (
        <AdminEmpty message="해당하는 문의가 없습니다." />
      ) : (
        <ul className="space-y-card-gap">
          {inquiries.map((i) => (
            <li key={i.id}>
              <AdminCard>
                <p className="text-body" style={{ color: 'var(--primary)' }}>
                  {i.category}
                </p>
                <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                  {i.email} · {fmt(i.created_at)}
                </p>

                <p className="mt-3 whitespace-pre-wrap text-body">{i.content}</p>

                {i.user_id && (
                  <p className="mt-3 text-label" style={{ color: 'var(--text-sub)' }}>
                    이 사용자: 결제 {payByUser.get(i.user_id) ?? 0}건
                    {(failByUser.get(i.user_id) ?? 0) > 0 && (
                      <span style={{ color: 'var(--score-low)' }}>
                        {' '}
                        · 리포트 실패 {failByUser.get(i.user_id)}건
                      </span>
                    )}
                  </p>
                )}

                {i.reply && (
                  <div
                    className="mt-3 p-3"
                    style={{ background: 'var(--bg)', borderRadius: 'var(--radius-button)' }}
                  >
                    <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                      답변 {i.replied_at && fmt(i.replied_at)}
                      {i.replied_by && ` · ${i.replied_by}`}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-body">{i.reply}</p>
                  </div>
                )}

                <InquiryReply
                  inquiryId={i.id}
                  email={i.email}
                  existingReply={i.reply}
                />
              </AdminCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
