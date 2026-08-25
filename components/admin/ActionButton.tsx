'use client'

/**
 * 관리자 동작 버튼 (재생성, 환불, 삭제 등)
 *
 * 되돌릴 수 없는 동작은 확인을 한 번 받습니다.
 * 처리 중에는 잠기고, 결과를 그 자리에 표시합니다.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  label: string
  /** 처리 중 표시할 문구 */
  busyLabel?: string
  endpoint: string
  method?: 'POST' | 'DELETE'
  body?: Record<string, unknown>
  /** 누르면 먼저 물어볼 문장. 없으면 바로 실행합니다 */
  confirm?: string
  /** 사유를 함께 받을지 (환불 등) */
  askReason?: boolean
  variant?: 'default' | 'primary' | 'danger'
}

export default function ActionButton({
  label,
  busyLabel = '처리 중',
  endpoint,
  method = 'POST',
  body,
  confirm,
  askReason,
  variant = 'default',
}: Props) {
  const router = useRouter()
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  async function run() {
    setBusy(true)
    setMessage(null)
    setFailed(false)

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'DELETE' ? undefined : JSON.stringify({ ...body, reason }),
      })

      const data = (await res.json().catch(() => ({}))) as { error?: string; mock?: boolean }

      if (!res.ok) {
        setFailed(true)
        setMessage(data.error ?? '처리하지 못했습니다')
        return
      }

      setMessage(data.mock ? '처리했습니다 (더미 결제라 PG 호출 없음)' : '처리했습니다')
      setAsking(false)
      router.refresh()
    } catch {
      setFailed(true)
      setMessage('처리하지 못했습니다')
    } finally {
      setBusy(false)
    }
  }

  const style =
    variant === 'primary'
      ? { background: 'var(--button)', color: '#fff', border: 'none' }
      : variant === 'danger'
        ? { background: 'transparent', color: 'var(--score-low)', border: '1px solid var(--score-low)' }
        : { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }

  if (message && !failed) {
    return (
      <span className="text-label" style={{ color: 'var(--score-high)' }}>
        {message}
      </span>
    )
  }

  if (asking) {
    return (
      <div className="w-full space-y-2">
        <p className="text-label" style={{ color: 'var(--text)' }}>
          {confirm}
        </p>

        {askReason && (
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="사유 (선택)"
            className="min-h-[36px] w-full px-3 text-label"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              color: 'var(--text)',
            }}
          />
        )}

        {message && failed && (
          <p className="text-label" style={{ color: 'var(--score-low)' }}>
            {message}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAsking(false)}
            className="min-h-[36px] flex-1 px-3 text-label"
            style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-button)' }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="min-h-[36px] flex-1 px-3 text-label disabled:opacity-40"
            style={{
              background: 'var(--score-low)',
              color: '#fff',
              borderRadius: 'var(--radius-button)',
            }}
          >
            {busy ? busyLabel : '확인'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => (confirm ? setAsking(true) : run())}
        disabled={busy}
        className="min-h-[36px] px-3 text-label disabled:opacity-40"
        style={{ ...style, borderRadius: 'var(--radius-button)' }}
      >
        {busy ? busyLabel : label}
      </button>

      {message && failed && (
        <span className="text-label" style={{ color: 'var(--score-low)' }}>
          {message}
        </span>
      )}
    </span>
  )
}
