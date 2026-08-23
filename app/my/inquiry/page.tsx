'use client'

/**
 * 문의하기 (PRD 14.16)
 *
 * 비로그인 상태에서도 문의할 수 있어야 합니다.
 * 결제 전에 궁금한 점이 생길 수 있습니다.
 */

import { useState } from 'react'

import SubHeader from '@/components/layout/SubHeader'

const CATEGORIES = [
  '결제 · 환불',
  '리포트 내용',
  '계정 · 로그인',
  '오류 신고',
  '기타',
] as const

export default function InquiryPage() {
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [content, setContent] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, content: content.trim(), email: email.trim() }),
      })

      if (!res.ok) throw new Error('failed')
      setSent(true)
    } catch {
      setError('보내지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const field = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-button)',
    color: 'var(--text)',
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md pb-10">
        <SubHeader title="문의하기" />
        <div
          className="mx-screen mt-4 p-card text-center"
          style={{ background: 'var(--surface)', borderRadius: 'var(--radius-card)' }}
        >
          <p className="text-body">문의를 접수했어요.</p>
          <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
            답변은 {email}으로 보내드릴게요.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md pb-10">
      <SubHeader title="문의하기" />

      <form onSubmit={handleSubmit} className="space-y-5 px-screen pt-4">
        <div>
          <label htmlFor="category" className="text-label" style={{ color: 'var(--text-sub)' }}>
            어떤 문의인가요?
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 min-h-[48px] w-full px-4 text-body"
            style={field}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content" className="text-label" style={{ color: 'var(--text-sub)' }}>
            내용
          </label>
          <textarea
            id="content"
            required
            rows={6}
            value={content}
            maxLength={2000}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full p-4 text-body"
            style={field}
          />
        </div>

        <div>
          <label htmlFor="email" className="text-label" style={{ color: 'var(--text-sub)' }}>
            답변받을 이메일
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 min-h-[48px] w-full px-4 text-body"
            style={field}
          />
        </div>

        {error && (
          <p className="text-label" style={{ color: 'var(--score-low)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !content.trim() || !email.trim()}
          className="min-h-[52px] w-full text-body font-semibold text-white disabled:opacity-40"
          style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
        >
          {busy ? '보내는 중' : '보내기'}
        </button>
      </form>
    </main>
  )
}
