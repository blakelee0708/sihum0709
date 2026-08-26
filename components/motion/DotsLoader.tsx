'use client'

/**
 * 버튼 안 점 세 개 (FIX_3 [10]-1)
 *
 * 점이 순서대로 커졌다 작아집니다. 진행률을 아는 척하는 막대보다,
 * "받았고 처리 중"만 말하는 쪽이 정직합니다.
 *
 * 버튼 폭은 호출부에서 min-width로 고정해야 합니다. 글자가 점으로
 * 바뀌면서 폭이 줄면 화면이 덜컥거립니다.
 */

import { motion, useReducedMotion } from 'framer-motion'

export default function DotsLoader({ color = '#FFFFFF' }: { color?: string }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <span className="flex items-center justify-center gap-1.5" role="status">
      <span className="sr-only">준비하는 중</span>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="block h-1.5 w-1.5 rounded-full"
          style={{ background: color }}
          animate={
            shouldReduceMotion
              ? undefined
              : { opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }
          }
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  )
}
