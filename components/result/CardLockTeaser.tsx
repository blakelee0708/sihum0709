'use client'

/**
 * 카드 안 부분 잠금 (PRD 3.4)
 *
 * 앞부분은 공개하고 뒤가 잠깁니다. 읽다가 막히게 하는 것이 목적입니다.
 * 제목만 있으면 무엇인지 모르므로 한두 줄 설명을 함께 둡니다.
 *
 * 각 잠금에 [더 자세히 보기]를 두고 전부 같은 결제 화면으로 보냅니다.
 * 어디서 읽다가 멈춰도 결제 경로가 있어야 합니다 (PRD 14.9).
 */

import { MotionLink, useTap } from '@/components/motion/Pressable'
import { ChevronRight, Lock } from 'lucide-react'

import type { CardLock } from '@/lib/content/assemble'
import { track } from '@/lib/analytics'

interface Props {
  lock: CardLock
  href: string
  /** 어느 카드에서 눌렀는지 (PRD 22.12) */
  cardId: number
  examType: string
}

export default function CardLockTeaser({ lock, href, cardId, examType }: Props) {
  const tap = useTap()
  return (
    <div
      className="mt-4 p-4"
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-button)',
      }}
    >
      <p className="flex items-center gap-1 text-body font-semibold">
        <Lock size={16} aria-hidden style={{ color: 'var(--primary)' }} />
        {lock.title}
      </p>

      <p className="mt-2 text-label" style={{ color: 'var(--text-sub)' }}>
        {lock.teaser}
      </p>

      <MotionLink
        whileTap={tap}
        href={href}
        onClick={() => track('card_lock_click', { examType, cardId })}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1 text-body font-semibold"
        style={{
          border: '1px solid var(--primary)',
          borderRadius: 'var(--radius-button)',
          color: 'var(--primary)',
        }}
      >
        더 자세히 보기
        <ChevronRight size={16} aria-hidden />
      </MotionLink>
    </div>
  )
}
