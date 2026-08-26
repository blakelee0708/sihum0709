'use client'

/**
 * 리포트 생성 실패 화면 (PRD 14.13)
 *
 * 재시도는 이미 결제된 건이므로 추가 과금 없이 AI를 다시 호출합니다.
 * retry_count가 3을 넘으면 재시도 버튼을 숨기고 문의만 안내합니다.
 */

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { CHARACTER_NAME } from '@/lib/content/characters'

const MAX_RETRY = 3

interface Props {
  /** 저장된 리포트 행이 있는 경우 (PRD 14.13 기본 경로) */
  reportId?: string
  retryCount?: number
  /**
   * 리포트 id를 아직 모르는 경우 — 결제 직후 대기 타임아웃(PRD 14.11 240초).
   * 넘기면 /api/report/retry 대신 이 함수로 다시 시도합니다.
   */
  onRetry?: () => Promise<void>
  headline?: string
  /** 한 줄이 배열 한 칸입니다 */
  description?: string[]
}

const DEFAULT_DESCRIPTION = [
  '결제는 정상 처리되었습니다.',
  '아래 버튼으로 다시 시도하거나 문의를 남겨주세요.',
]

export default function FailedState({
  reportId,
  retryCount = 0,
  onRetry,
  headline = '리포트 생성에 실패했어요',
  description = DEFAULT_DESCRIPTION,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canRetry = retryCount < MAX_RETRY

  async function handleRetry() {
    setBusy(true)
    setError(null)

    if (onRetry) {
      try {
        await onRetry()
      } catch {
        setError('다시 만들지 못했어요. 잠시 후 한 번 더 시도해 주세요.')
      } finally {
        setBusy(false)
      }
      return
    }

    try {
      const res = await fetch('/api/report/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
      })

      if (res.ok) {
        router.refresh()
        return
      }

      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setError(
        data.error === 'retry limit'
          ? '재시도 횟수를 모두 사용했어요. 문의를 남겨주시면 처리해 드릴게요.'
          : '다시 만들지 못했어요. 잠시 후 한 번 더 시도해 주세요.'
      )
    } catch {
      setError('다시 만들지 못했어요. 잠시 후 한 번 더 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-screen text-center">
      <Image
        src="/character/char-02.png"
        alt={`살짝 걱정스러운 표정의 ${CHARACTER_NAME}`}
        width={180}
        height={180}
        className="h-[160px] w-[160px] object-contain"
      />

      <h1 className="mt-3 text-headline">{headline}</h1>

      <p className="mt-3 text-body" style={{ color: 'var(--text-sub)' }}>
        {description.map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </p>

      {error && (
        <p className="mt-3 text-label" style={{ color: 'var(--score-low)' }}>
          {error}
        </p>
      )}

      <div className="mt-6 w-full space-y-2">
        {canRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={busy}
            className="min-h-[52px] w-full text-body font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
          >
            {busy ? '다시 만드는 중' : '다시 시도하기'}
          </button>
        )}

        <Link
          href="/my/inquiry"
          className="flex min-h-[52px] w-full items-center justify-center text-body font-semibold"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            color: 'var(--text)',
          }}
        >
          문의하기
        </Link>
      </div>
    </main>
  )
}
