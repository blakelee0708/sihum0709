'use client'

/**
 * 합격이 말풍선 (PRD 21.12)
 *
 * 아바타 30x30 원형, 말풍선 최대 폭 250px, 왼쪽 위만 각진 모서리.
 * 타이핑 애니메이션은 쓰지 않고 페이드인만 적용합니다 (PRD 14.6).
 */

import Image from 'next/image'
import { motion } from 'framer-motion'

import { CHARACTER_NAME, CHARACTER_PROFILE } from '@/lib/content/characters'
import { bubbleMotion } from '@/lib/motion'

interface Props {
  lines: string[]
  /** 복원 시에는 모션 없이 즉시 표시합니다 (PRD 14.8) */
  instant?: boolean
}

export default function BotBubble({ lines, instant = false }: Props) {
  const anim = instant
    ? { initial: false as const, animate: { opacity: 1, y: 0 } }
    : bubbleMotion

  return (
    <div className="flex items-start gap-2">
      <Image
        src={CHARACTER_PROFILE}
        alt={CHARACTER_NAME}
        width={30}
        height={30}
        className="shrink-0 rounded-full object-cover"
        style={{ background: '#8ECDF5' }}
      />
      <motion.div
        {...anim}
        className="max-w-[250px] px-3 py-2.5 text-chat"
        style={{
          background: 'var(--surface-1)',
          borderRadius: '2px 12px 12px 12px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </motion.div>
    </div>
  )
}
