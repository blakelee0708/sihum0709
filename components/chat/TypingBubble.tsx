'use client'

/**
 * 타이핑 인디케이터 (FIX_3 [8]-4)
 *
 * 첫 인사에만 씁니다. 매 질문마다 넣으면 9단계를 거치는 동안 기다리는
 * 시간만 쌓입니다. 첫 화면에서 한 번, 0.3초면 "합격이가 말을 시작한다"는
 * 것만 전달하고 끝납니다.
 *
 * 말풍선 자리를 그대로 차지하므로 사라질 때 화면이 튀지 않습니다.
 */

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

import { CHARACTER_NAME, CHARACTER_PROFILE } from '@/lib/content/characters'
import { useBubbleMotion } from '@/components/motion/motion-safe'

export default function TypingBubble() {
  const bubbleMotion = useBubbleMotion()
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="flex items-start gap-2" aria-hidden>
      <Image
        src={CHARACTER_PROFILE}
        alt=""
        width={30}
        height={30}
        className="shrink-0 rounded-full object-cover"
        style={{ background: '#8ECDF5' }}
      />

      <motion.div
        {...bubbleMotion(0)}
        className="flex items-center gap-1 px-3 py-3"
        style={{
          background: 'var(--surface-1)',
          borderRadius: '2px 12px 12px 12px',
          boxShadow: 'var(--shadow-card)',
          transformOrigin: 'left bottom',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--text-sub)' }}
            animate={shouldReduceMotion ? undefined : { opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}
