'use client'

/**
 * 차면서 늘어나는 막대 (FIX_3 [9]-2, [9]-3)
 *
 * 오행 분포, 시험 유형 궁합, 랜딩 미리보기가 같은 모양의 가로 막대를
 * 씁니다. 값이 이미 채워진 채로 나타나면 그냥 그림이고, 0에서 자라면
 * "계산된 값"으로 읽힙니다.
 *
 * 화면에 들어올 때 한 번만 재생합니다. 스크롤을 되돌릴 때마다 다시
 * 자라면 읽던 자리를 놓칩니다.
 *
 * 애니메이션은 width만 씁니다. 트랙(회색 바탕)은 처음부터 제자리에
 * 있으므로 레이아웃이 흔들리지 않습니다.
 */

import { motion, useReducedMotion } from 'framer-motion'

import { EASE, REVEAL_DURATION, REVEAL_STAGGER } from '@/lib/motion'

interface Props {
  /** 0~100 */
  percent: number
  color: string
  /** 목록에서 순서대로 자라게 할 때 */
  index?: number
  /** 트랙과 막대의 높이 */
  height?: number
  label: string
}

export default function GrowBar({
  percent,
  color,
  index = 0,
  height = 8,
  label,
}: Props) {
  const shouldReduceMotion = useReducedMotion()
  const width = `${Math.max(0, Math.min(100, percent))}%`

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        height,
        background: 'var(--bg)',
        borderRadius: 'var(--radius-round)',
      }}
      role="img"
      aria-label={label}
    >
      {shouldReduceMotion ? (
        <div
          className="h-full"
          style={{ width, background: color, borderRadius: 'var(--radius-round)' }}
        />
      ) : (
        <motion.div
          className="h-full"
          style={{ background: color, borderRadius: 'var(--radius-round)' }}
          initial={{ width: 0 }}
          whileInView={{ width }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{
            duration: REVEAL_DURATION,
            delay: index * REVEAL_STAGGER,
            ease: EASE,
          }}
        />
      )}
    </div>
  )
}
