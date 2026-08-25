'use client'

/**
 * 알림 신청 (PRD 8.2 실기 준비 중, 12.7 결제 의사 측정)
 *
 * 실기는 1차 출시에서 유료 상품이 없습니다. CTA 자리에 안내만 두면
 * 수요를 알 수 없으므로, 여기서 이메일을 받아 실제 관심을 측정합니다.
 */

import { useState } from 'react'
import { Check } from 'lucide-react'

import { track } from '@/lib/analytics'

interface Props {
  reason: 'practical' | 'price'
  examName: string
  examType: string
  priceShown?: number
  onDone?: () => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function WaitlistForm({
  reason,
  examName,
  examType,
  priceShown,
  onDone,
}: Props) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!EMAIL_RE.test(email.trim())) {
      setError('이메일 주소를 확인해 주세요.')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          reason,
          examName,
          examType,
          priceShown,
        }),
      })

      if (!res.ok) throw new Error('failed')

      track('waitlist_submitted', { reason, examType })
      setDone(true)
      onDone?.()
    } catch {
      setError('신청하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-body">
        <Check size={18} aria-hidden style={{ color: 'var(--score-high)' }} />
        <span>준비되면 알려드릴게요.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <label htmlFor="waitlist-email" className="sr-only">
        알림받을 이메일
      </label>
      <input
        id="waitlist-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="알림받을 이메일"
        className="min-h-[48px] w-full px-4 text-body"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-button)',
          color: 'var(--text)',
        }}
      />

      <button
        type="submit"
        disabled={busy}
        className="min-h-[48px] w-full text-body font-semibold text-white disabled:opacity-40"
        style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
      >
        {busy ? '신청하는 중' : '알림 받기'}
      </button>

      {error && (
        <p className="text-label" style={{ color: 'var(--score-low)' }}>
          {error}
        </p>
      )}
    </form>
  )
}
