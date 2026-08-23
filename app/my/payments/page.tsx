/**
 * 결제 내역 (PRD 12.4, 14.15)
 *
 * 전자상거래법상 상품명, 결제 금액, 결제 일시, 결제 수단, 거래 상태를 표시합니다.
 * 취소된 건은 취소 일시를 함께 표시합니다.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import SubHeader from '@/components/layout/SubHeader'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export const metadata: Metadata = { title: '결제 내역 · 시험사주' }

interface PaymentRow {
  id: string
  report_id: string | null
  amount: number
  product_type: string
  payment_method: string | null
  paid_at: string
  refunded_at: string | null
  is_granted: boolean
}

const PRODUCT_LABEL: Record<string, string> = {
  필기: '시험 전 7일 상세 플랜',
  면접: '면접 상세 리포트',
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

export default async function PaymentsPage() {
  if (!isSupabaseConfigured) redirect('/my')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=%2Fmy%2Fpayments')

  const { data: rows } = await supabase
    .from('payments')
    .select('id, report_id, amount, product_type, payment_method, paid_at, refunded_at, is_granted')
    .eq('user_id', user.id)
    .order('paid_at', { ascending: false })

  const payments = (rows ?? []) as PaymentRow[]

  return (
    <main className="mx-auto max-w-md pb-10">
      <SubHeader title="결제 내역" />

      <div className="space-y-card-gap px-screen pt-4">
        {payments.length === 0 ? (
          <p
            className="p-card text-body"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              color: 'var(--text-sub)',
            }}
          >
            결제 내역이 없습니다.
          </p>
        ) : (
          payments.map((p) => (
            <div
              key={p.id}
              className="p-card"
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <p className="text-card-title">
                {PRODUCT_LABEL[p.product_type] ?? p.product_type}
              </p>

              <p className="mt-2 text-body">
                {formatDateTime(p.paid_at)} · {p.amount.toLocaleString()}원
              </p>
              <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                {p.is_granted ? '무료 지급' : (p.payment_method ?? '결제 수단 미기록')}
              </p>

              {p.refunded_at ? (
                <p className="mt-2 text-label" style={{ color: 'var(--score-low)' }}>
                  결제 취소 ({formatDateTime(p.refunded_at)})
                </p>
              ) : (
                <p className="mt-2 text-label" style={{ color: 'var(--score-high)' }}>
                  결제 완료
                </p>
              )}

              {p.report_id && !p.refunded_at && (
                <div className="mt-3 flex justify-end">
                  <Link
                    href={`/report/${p.report_id}`}
                    className="flex min-h-[40px] items-center px-4 text-label font-semibold text-white"
                    style={{
                      background: 'var(--button)',
                      borderRadius: 'var(--radius-button)',
                    }}
                  >
                    리포트 보기
                  </Link>
                </div>
              )}
            </div>
          ))
        )}

        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          결제 관련 문의는{' '}
          <Link href="/my/inquiry" className="underline">
            문의하기
          </Link>
          를 이용해 주세요.
        </p>
      </div>
    </main>
  )
}
