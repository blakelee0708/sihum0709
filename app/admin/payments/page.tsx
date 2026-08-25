/**
 * 결제 관리 (PRD 22.7, 22.8)
 *
 * PG 취소 가능 여부를 표시합니다. 카드는 당일 취소와 이후 취소 처리가 다르고,
 * 휴대폰 소액결제는 당월 내에만 취소가 가능합니다.
 */

import Link from 'next/link'

import ActionButton from '@/components/admin/ActionButton'
import AdminCard, { AdminEmpty } from '@/components/admin/AdminCard'
import StatCard from '@/components/admin/StatCard'
import { adminDb } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

interface PaymentRow {
  id: string
  user_id: string | null
  report_id: string | null
  payment_id: string | null
  amount: number
  product_type: string
  payment_method: string | null
  coupon_code: string | null
  is_granted: boolean
  paid_at: string
  refunded_at: string | null
  refund_reason: string | null
  refunded_by: string | null
}

function fmt(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 같은 달 안이면 대부분의 수단이 PG에서 취소됩니다 (PRD 22.7) */
function isCancelable(paidAt: string): boolean {
  const p = new Date(paidAt)
  const now = new Date()
  return p.getFullYear() === now.getFullYear() && p.getMonth() === now.getMonth()
}

function defaultFrom(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const sp = await searchParams
  const from = sp.from || defaultFrom()
  const to = sp.to || todayStr()

  const db = adminDb()

  const { data: rows } = await db
    .from('payments')
    .select(
      'id, user_id, report_id, payment_id, amount, product_type, payment_method, coupon_code, is_granted, paid_at, refunded_at, refund_reason, refunded_by'
    )
    .gte('paid_at', `${from}T00:00:00`)
    .lte('paid_at', `${to}T23:59:59`)
    .order('paid_at', { ascending: false })
    .limit(200)

  const payments = (rows ?? []) as PaymentRow[]

  const paid = payments.filter((p) => !p.is_granted && !p.refunded_at)
  const refunded = payments.filter((p) => p.refunded_at)
  const granted = payments.filter((p) => p.is_granted)

  const revenue = paid.reduce((a, p) => a + p.amount, 0)
  const refundAmount = refunded.reduce((a, p) => a + p.amount, 0)

  // 상품별 / 수단별 분포 (PRD 22.7)
  const byProduct = new Map<string, number>()
  const byMethod = new Map<string, number>()
  for (const p of paid) {
    byProduct.set(p.product_type, (byProduct.get(p.product_type) ?? 0) + 1)
    const m = p.payment_method ?? '미기록'
    byMethod.set(m, (byMethod.get(m) ?? 0) + 1)
  }

  const couponUsed = payments.filter((p) => p.coupon_code).length

  return (
    <div className="space-y-4">
      <h1 className="text-headline">결제 관리</h1>

      <form className="flex flex-wrap items-end gap-2" method="get">
        <label className="text-label" style={{ color: 'var(--text-sub)' }}>
          기간
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="ml-2 min-h-[36px] px-2 text-label"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
            }}
          />
        </label>
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="min-h-[36px] px-2 text-label"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
          }}
        />
        <button
          type="submit"
          className="min-h-[36px] px-4 text-label text-white"
          style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
        >
          조회
        </button>
      </form>

      <div className="grid grid-cols-2 gap-card-gap lg:grid-cols-4">
        <StatCard label="결제" value={`${paid.length}건`} sub={`${revenue.toLocaleString()}원`} />
        <StatCard
          label="환불"
          value={`${refunded.length}건`}
          sub={`${refundAmount.toLocaleString()}원`}
        />
        <StatCard label="순매출" value={`${(revenue - refundAmount).toLocaleString()}원`} />
        <StatCard label="무료 지급" value={`${granted.length}건`} sub={`쿠폰 ${couponUsed}건`} />
      </div>

      {paid.length > 0 && (
        <AdminCard>
          <p className="text-label" style={{ color: 'var(--text-sub)' }}>
            상품별 · 수단별
          </p>
          <p className="mt-1 text-body">
            {[...byProduct].map(([k, v]) => `${k} ${v}건`).join(' · ') || '없음'}
          </p>
          <p className="text-body" style={{ color: 'var(--text-sub)' }}>
            {[...byMethod].map(([k, v]) => `${k} ${v}건`).join(' · ') || '없음'}
          </p>
        </AdminCard>
      )}

      {payments.length === 0 ? (
        <AdminEmpty message="해당 기간에 결제 내역이 없습니다." />
      ) : (
        <ul className="space-y-card-gap">
          {payments.map((p) => (
            <li key={p.id}>
              <AdminCard>
                <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                  {fmt(p.paid_at)}
                </p>

                <p className="mt-1 text-body">
                  {p.product_type} 리포트 · {p.amount.toLocaleString()}원
                  {p.is_granted && ' (무료 지급)'}
                </p>

                <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                  {p.payment_method ?? '수단 미기록'}
                  {p.coupon_code && ` · 쿠폰 ${p.coupon_code}`}
                  {p.user_id ? ` · ${p.user_id.slice(0, 8)}` : ' · 탈퇴 회원'}
                </p>

                {p.refunded_at ? (
                  <p className="mt-2 text-label" style={{ color: 'var(--score-low)' }}>
                    환불 완료 ({fmt(p.refunded_at)})
                    {p.refunded_by && ` · ${p.refunded_by}`}
                    {p.refund_reason && ` · ${p.refund_reason}`}
                  </p>
                ) : (
                  <p className="mt-2 text-label" style={{ color: 'var(--text-sub)' }}>
                    {p.is_granted
                      ? '무료 지급 건 (매출 집계 제외)'
                      : isCancelable(p.paid_at)
                        ? 'PG 취소 가능'
                        : 'PG 취소 기간 경과 — 계좌 이체로 처리해야 합니다'}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {!p.refunded_at && !p.is_granted && (
                    <ActionButton
                      label="환불"
                      endpoint="/api/admin/payment/refund"
                      body={{ paymentId: p.id }}
                      confirm="환불하면 리포트 열람이 차단됩니다. 진행할까요?"
                      askReason
                      variant="danger"
                    />
                  )}

                  {p.report_id && (
                    <Link
                      href={`/admin/reports`}
                      className="flex min-h-[36px] items-center px-3 text-label"
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-button)',
                        color: 'var(--text)',
                      }}
                    >
                      리포트 보기
                    </Link>
                  )}
                </div>
              </AdminCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
