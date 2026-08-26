'use client'

/**
 * 합격이 말풍선 (PRD 21.12)
 *
 * 아바타 30x30 원형, 말풍선 최대 폭 250px, 왼쪽 위만 각진 모서리.
 * 타이핑 애니메이션은 쓰지 않고 페이드인만 적용합니다 (PRD 14.6).
 *
 * ── lines의 원소 하나가 말풍선 하나입니다 ──
 *
 * 전에는 배열 전체가 말풍선 하나였고 원소가 한 줄이었습니다. 세 문장을
 * 말하면 말풍선이 길어져 읽기 부담이 생깁니다.
 *
 * 지금은 말풍선을 나눠 순차로 띄웁니다. 아바타는 맨 위에 한 번만
 * 그립니다. 연속된 말에 아바타가 세 번 나오면 세 사람이 말하는 것처럼
 * 보입니다.
 *
 * 한 말풍선 안에서 줄을 바꿔야 하면 원소 안에 \n을 넣습니다.
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

      <div className="flex flex-col items-start gap-1.5">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            {...(instant ? INSTANT : bubbleMotion(i))}
            className="max-w-[250px] whitespace-pre-line px-3 py-2.5 text-chat"
            style={{
              background: 'var(--surface-1)',
              borderRadius: '2px 12px 12px 12px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {line}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/** 복원 시에는 모션 없이 즉시 표시합니다 (PRD 14.8) */
const INSTANT = {
  initial: false as const,
  animate: { opacity: 1, y: 0 },
}
