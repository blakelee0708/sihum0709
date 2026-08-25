'use client'

/**
 * 화면 오류 처리.
 *
 * 사용자가 할 수 있는 행동(다시 시도, 문의)을 함께 둡니다.
 * 오류 내용은 화면에 그대로 노출하지 않습니다.
 */

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { CHARACTER_NAME } from '@/lib/content/characters'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 서버 로그로 남깁니다. 화면에는 보여주지 않습니다
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-screen text-center">
      <Image
        src="/character/char-02.png"
        alt={`살짝 걱정스러운 표정의 ${CHARACTER_NAME}`}
        width={180}
        height={180}
        className="h-[160px] w-[160px] object-contain"
      />

      <h1 className="mt-3 text-headline">잠깐 문제가 생겼어요</h1>
      <p className="mt-3 text-body" style={{ color: 'var(--text-sub)' }}>
        다시 시도해 보시고, 계속 안 되면 문의를 남겨주세요.
      </p>

      {error.digest && (
        <p className="mt-2 text-label" style={{ color: 'var(--text-sub)' }}>
          오류 번호 {error.digest}
        </p>
      )}

      <div className="mt-6 w-full space-y-2">
        <button
          type="button"
          onClick={reset}
          className="min-h-[52px] w-full text-body font-semibold text-white"
          style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
        >
          다시 시도하기
        </button>
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
