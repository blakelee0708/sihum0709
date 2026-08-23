/**
 * 마이페이지 비로그인 빈 상태 (PRD 14.14)
 *
 * 빈 상태가 로그인 유도 지점이 됩니다.
 */

import Image from 'next/image'
import Link from 'next/link'

import { CHARACTER_NAME } from '@/lib/content/characters'

export default function EmptyState() {
  return (
    <div className="px-screen py-8 text-center">
      <Image
        src="/character/char-03.png"
        alt={`차분하게 정면을 보고 있는 ${CHARACTER_NAME}`}
        width={160}
        height={160}
        className="mx-auto h-[140px] w-[140px] object-contain"
      />

      <p className="mt-3 text-card-title">로그인하고 결과를 저장하세요</p>
      <p className="mt-1 text-body" style={{ color: 'var(--text-sub)' }}>
        다음에 입력 없이 볼 수 있어요
      </p>

      <Link
        href={`/login?next=${encodeURIComponent('/my')}`}
        className="mt-5 flex min-h-[52px] w-full items-center justify-center text-body font-semibold text-white"
        style={{
          background: 'var(--button)',
          borderRadius: 'var(--radius-button)',
          boxShadow: 'var(--shadow-button)',
        }}
      >
        로그인하기
      </Link>
    </div>
  )
}
