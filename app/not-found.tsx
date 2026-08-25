/** 404 화면. 기본 영문 화면 대신 운이가 안내합니다 */

import Image from 'next/image'
import Link from 'next/link'

import { CHARACTER_NAME } from '@/lib/content/characters'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-screen text-center">
      <Image
        src="/character/char-02.png"
        alt={`살짝 걱정스러운 표정의 ${CHARACTER_NAME}`}
        width={180}
        height={180}
        className="h-[160px] w-[160px] object-contain"
      />

      <h1 className="mt-3 text-headline">찾는 화면이 없어요</h1>
      <p className="mt-3 text-body" style={{ color: 'var(--text-sub)' }}>
        주소가 바뀌었거나 지워진 화면일 수 있어요.
      </p>

      <div className="mt-6 w-full space-y-2">
        <Link
          href="/"
          className="flex min-h-[52px] w-full items-center justify-center text-body font-semibold text-white"
          style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
        >
          홈으로 가기
        </Link>
        <Link
          href="/start"
          className="flex min-h-[52px] w-full items-center justify-center text-body font-semibold"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            color: 'var(--text)',
          }}
        >
          시험운 보러 가기
        </Link>
      </div>
    </main>
  )
}
