'use client'

/**
 * 무료 지급과 쿠폰 발급 (PRD 22.11), 공지 배너 (PRD 22.15)
 *
 * 무료 지급은 즉시 리포트를 만들고 payments에 is_granted true로 기록합니다.
 * 매출 집계에서 제외됩니다.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const field = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-button)',
  color: 'var(--text)',
}

const submitStyle = {
  background: 'var(--button)',
  borderRadius: 'var(--radius-button)',
}

function useSubmit() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function post(endpoint: string, body: unknown, successText: string) {
    setBusy(true)
    setMessage(null)
    setOk(false)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }

      if (!res.ok) {
        setMessage(data.error ?? '처리하지 못했습니다')
        return false
      }

      setOk(true)
      setMessage(successText)
      router.refresh()
      return true
    } catch {
      setMessage('처리하지 못했습니다')
      return false
    } finally {
      setBusy(false)
    }
  }

  return { busy, message, ok, post }
}

function Result({ message, ok }: { message: string | null; ok: boolean }) {
  if (!message) return null
  return (
    <p className="text-label" style={{ color: ok ? 'var(--score-high)' : 'var(--score-low)' }}>
      {message}
    </p>
  )
}

/** 직접 지급 (CS용) */
export function GrantForm() {
  const { busy, message, ok, post } = useSubmit()
  const [queryId, setQueryId] = useState('')
  const [memo, setMemo] = useState('')

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const done = await post(
          '/api/admin/grant',
          { queryId: queryId.trim(), memo },
          '지급했습니다. 리포트가 생성되었습니다.'
        )
        if (done) {
          setQueryId('')
          setMemo('')
        }
      }}
      className="space-y-2"
    >
      <label className="block text-label" style={{ color: 'var(--text-sub)' }}>
        조회 ID (queries.id)
      </label>
      <input
        type="text"
        value={queryId}
        onChange={(e) => setQueryId(e.target.value)}
        placeholder="아래 최근 조회 목록에서 복사하세요"
        className="min-h-[40px] w-full px-3 text-label"
        style={field}
      />

      <label className="block text-label" style={{ color: 'var(--text-sub)' }}>
        지급 사유
      </label>
      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="예) 리포트 생성 실패 보상"
        className="min-h-[40px] w-full px-3 text-label"
        style={field}
      />

      <Result message={message} ok={ok} />

      <button
        type="submit"
        disabled={busy || !queryId.trim()}
        className="min-h-[40px] w-full text-label text-white disabled:opacity-40"
        style={submitStyle}
      >
        {busy ? '지급하는 중' : '지급하기'}
      </button>

      <p className="text-label" style={{ color: 'var(--text-sub)' }}>
        AI를 호출하므로 원가가 발생합니다. 매출 집계에서는 제외됩니다.
      </p>
    </form>
  )
}

/** 쿠폰 발급 (마케팅용) */
export function CouponForm() {
  const { busy, message, ok, post } = useSubmit()
  const [code, setCode] = useState('')
  const [discountValue, setDiscountValue] = useState('100')
  const [discountType, setDiscountType] = useState('percent')
  const [maxUses, setMaxUses] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [memo, setMemo] = useState('')

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const done = await post(
          '/api/admin/coupon',
          {
            code,
            discountType,
            discountValue: Number(discountValue),
            maxUses: maxUses ? Number(maxUses) : null,
            validUntil: validUntil || null,
            memo,
          },
          '발급했습니다.'
        )
        if (done) setCode('')
      }}
      className="space-y-2"
    >
      <label className="block text-label" style={{ color: 'var(--text-sub)' }}>
        코드
      </label>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="FREE2026"
        className="min-h-[40px] w-full px-3 text-label"
        style={field}
      />

      <label className="block text-label" style={{ color: 'var(--text-sub)' }}>
        할인
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          className="min-h-[40px] flex-1 px-3 text-label"
          style={field}
        />
        <select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value)}
          className="min-h-[40px] px-3 text-label"
          style={field}
        >
          <option value="percent">퍼센트</option>
          <option value="amount">원</option>
        </select>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-label" style={{ color: 'var(--text-sub)' }}>
            사용 한도 (비우면 무제한)
          </label>
          <input
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="50"
            className="min-h-[40px] w-full px-3 text-label"
            style={field}
          />
        </div>
        <div className="flex-1">
          <label className="block text-label" style={{ color: 'var(--text-sub)' }}>
            유효 기간
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="min-h-[40px] w-full px-3 text-label"
            style={field}
          />
        </div>
      </div>

      <label className="block text-label" style={{ color: 'var(--text-sub)' }}>
        메모
      </label>
      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="예) 인플루언서 제공"
        className="min-h-[40px] w-full px-3 text-label"
        style={field}
      />

      <Result message={message} ok={ok} />

      <button
        type="submit"
        disabled={busy || !code.trim()}
        className="min-h-[40px] w-full text-label text-white disabled:opacity-40"
        style={submitStyle}
      >
        {busy ? '발급하는 중' : '발급하기'}
      </button>
    </form>
  )
}

/** 공지 배너 (PRD 22.15) */
export function NoticeForm({ current }: { current: string | null }) {
  const { busy, message, ok, post } = useSubmit()
  const router = useRouter()
  const [text, setText] = useState('')
  const [active, setActive] = useState(true)

  async function turnOff() {
    await fetch('/api/admin/notice', { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {current && (
        <div
          className="p-3"
          style={{ background: 'var(--bg)', borderRadius: 'var(--radius-button)' }}
        >
          <p className="text-label" style={{ color: 'var(--text-sub)' }}>
            지금 노출 중
          </p>
          <p className="mt-1 text-body">{current}</p>
          <button
            type="button"
            onClick={turnOff}
            className="mt-2 min-h-[36px] px-3 text-label"
            style={{
              border: '1px solid var(--score-low)',
              borderRadius: 'var(--radius-button)',
              color: 'var(--score-low)',
            }}
          >
            배너 끄기
          </button>
        </div>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const done = await post(
            '/api/admin/notice',
            { message: text, isActive: active },
            '저장했습니다.'
          )
          if (done) setText('')
        }}
        className="space-y-2"
      >
        <label className="block text-label" style={{ color: 'var(--text-sub)' }}>
          문구
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예) 8월 25일 새벽 2시~4시 점검 예정"
          className="min-h-[40px] w-full px-3 text-label"
          style={field}
        />

        <label className="flex min-h-[36px] items-center gap-2 text-label">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          바로 활성화
        </label>

        <Result message={message} ok={ok} />

        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="min-h-[40px] w-full text-label text-white disabled:opacity-40"
          style={submitStyle}
        >
          {busy ? '저장 중' : '저장'}
        </button>
      </form>
    </div>
  )
}
