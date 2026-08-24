'use client'

/**
 * 결제 (PRD 12장, 14.9)
 *
 * PG 계약 전이라 더미 결제로 흐름만 완성합니다.
 * 결제 버튼을 누르면 payments에 기록하고 리포트 생성으로 넘어갑니다.
 *
 * TODO: 사용자 확인 필요
 * 포트원 또는 토스페이먼츠 계약 후 실제 결제 위젯으로 교체해야 합니다.
 * 소액 결제이므로 계약 전 건당 최소 수수료 유무를 반드시 확인하시기 바랍니다 (PRD 12.1).
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { PRICE } from '@/components/result/LockedCTA'
import {
  PAID_SESSION_KEY,
  SESSION_KEY,
  toUserInput,
  type Answers,
} from '@/lib/content/chat-flow'
import { DDAY_NOTICE } from '@/lib/ai/spec'
import { getReportDdayRange, diffDays } from '@/lib/saju/fortune'
import { parseLocalDateTime } from '@/lib/saju/calculate'
import type { UserInput } from '@/lib/content/assemble'

type Phase = 'ready' | 'paying' | 'generating' | 'error'

export default function CheckoutView({ queryId }: { queryId: string | null }) {
  const router = useRouter()

  const [input, setInput] = useState<UserInput | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [phase, setPhase] = useState<Phase>('ready')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { answers?: Answers }
        if (parsed.answers?.examDate) setInput(toUserInput(parsed.answers))
      }
      const paid = sessionStorage.getItem(PAID_SESSION_KEY)
      if (paid) {
        const parsed = JSON.parse(paid) as { companyName?: string }
        setCompanyName(parsed.companyName ?? null)
      }
    } catch {
      // 세션이 없으면 아래에서 안내합니다
    }
  }, [])

  const dday = input
    ? diffDays(new Date(), parseLocalDateTime(input.examDate, null))
    : null
  const ddayRange = dday !== null ? getReportDdayRange(dday) : null
  const notice = ddayRange ? DDAY_NOTICE[ddayRange] : []

  const productLabel =
    input?.examType === '면접' ? '면접 상세 리포트' : '시험 전 상세 플랜'

  async function handlePay() {
    if (!input) return
    setPhase('paying')
    setError(null)

    try {
      // 1. 조회 기록 저장 (이미 있으면 그 id를 돌려줍니다)
      let qid = queryId
      if (!qid) {
        const res = await fetch('/api/queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent('/checkout')}`)
          return
        }
        if (!res.ok) throw new Error('query')
        qid = ((await res.json()) as { id: string }).id
      }

      // 2. 결제 (더미)
      const payRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: qid,
          productType: input.examType === '면접' ? '면접' : '필기',
          couponCode: coupon.trim() || null,
        }),
      })
      if (payRes.status === 401) {
        router.push(`/login?next=${encodeURIComponent('/checkout')}`)
        return
      }
      if (!payRes.ok) throw new Error('payment')
      const paymentId = ((await payRes.json()) as { id?: string }).id ?? null

      // 3. 리포트 생성
      setPhase('generating')
      const repRes = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId: qid, companyName, paymentId }),
      })

      const repJson = (await repRes.json().catch(() => ({}))) as {
        id?: string
        error?: string
      }

      // 생성에 실패해도 리포트 행은 만들어졌으므로 실패 화면으로 보냅니다
      if (repJson.id) {
        router.push(`/report/${repJson.id}`)
        return
      }

      throw new Error(repJson.error ?? 'report')
    } catch {
      setPhase('error')
      setError('결제 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  if (!input) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-screen text-center">
        <p className="text-body">결제할 결과를 찾지 못했어요.</p>
        <button
          type="button"
          onClick={() => router.push('/start')}
          className="min-h-[48px] w-full text-body font-semibold text-white"
          style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
        >
          다시 시작하기
        </button>
      </main>
    )
  }

  const busy = phase === 'paying' || phase === 'generating'

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md">
      <header className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로"
          className="flex h-11 w-11 items-center justify-center"
          style={{ color: 'var(--text)' }}
        >
          <ChevronLeft size={24} aria-hidden />
        </button>
        <h1 className="text-card-title">결제</h1>
      </header>

      <div className="space-y-card-gap px-screen pt-4">
        <div
          className="p-card"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <p className="text-card-title">{productLabel}</p>
          <p className="mt-1 text-body" style={{ color: 'var(--text-sub)' }}>
            {companyName ?? input.examName}
            {dday !== null && ` · D-${dday}`}
          </p>

          <div
            className="mt-4 flex items-baseline justify-between"
            style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}
          >
            <span className="text-body">결제 금액</span>
            <span className="text-score">{PRICE.toLocaleString()}원</span>
          </div>
        </div>

        {/* PRD 8.6 결제 전 안내 — 기대와 결과가 어긋나지 않도록 */}
        {notice.length > 0 && (
          <div
            className="p-card"
            style={{ background: 'var(--surface)', borderRadius: 'var(--radius-card)' }}
          >
            {notice.map((line, i) => (
              <p key={i} className="text-body" style={{ color: 'var(--text-sub)' }}>
                {line}
              </p>
            ))}
          </div>
        )}

        {/* PRD 12.6 쿠폰 */}
        <div
          className="p-card"
          style={{ background: 'var(--surface)', borderRadius: 'var(--radius-card)' }}
        >
          <label htmlFor="coupon" className="text-label" style={{ color: 'var(--text-sub)' }}>
            쿠폰 코드 (선택)
          </label>
          <input
            id="coupon"
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="쿠폰이 있으시면 입력해 주세요"
            className="mt-1 min-h-[48px] w-full px-4 text-body"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              color: 'var(--text)',
            }}
          />
        </div>

        {/* PRD 12.3 청약철회 제한 고지 — 결제 버튼 위에 동의 체크박스 */}
        <label className="flex items-start gap-2 px-1 text-body">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0"
          />
          <span style={{ color: 'var(--text-sub)' }}>
            콘텐츠 제공이 시작되면 청약철회가 제한됩니다. 이에 동의합니다.
          </span>
        </label>

        {error && (
          <p className="text-label" style={{ color: 'var(--score-low)' }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={!agreed || busy}
          className="min-h-[52px] w-full text-body font-semibold text-white disabled:opacity-40"
          style={{
            background: 'var(--button)',
            borderRadius: 'var(--radius-button)',
            boxShadow: 'var(--shadow-button)',
          }}
        >
          {phase === 'paying'
            ? '결제 처리 중'
            : phase === 'generating'
              ? '리포트를 만드는 중'
              : `${PRICE.toLocaleString()}원 결제하기`}
        </button>

        <p className="pb-8 text-label" style={{ color: 'var(--text-sub)' }}>
          PG 연동 전이라 실제 결제는 일어나지 않습니다. 결제 흐름 확인용입니다.
        </p>
      </div>
    </main>
  )
}
