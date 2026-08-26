'use client'

/**
 * 스크롤 리빌 목록 (FIX_3 [6]-3)
 *
 * Reveal은 요소 하나마다 index를 받아 delay를 계산합니다. 목록에서는
 * 순서가 바뀌면 delay도 손으로 고쳐야 합니다.
 *
 * 여기서는 부모에 whileInView, 자식에 variants를 줍니다. 스태거가
 * 자동으로 걸리고, 부모가 화면에 들어온 시점을 기준으로 하므로 항목이
 * 몇 개든 한 번에 흐릅니다.
 *
 * blur는 쓰지 않습니다. 요소 여러 개가 동시에 블러를 벗으면 프레임이
 * 떨어집니다. 블러는 히어로 진입에만 씁니다 (lib/motion.ts).
 */

import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

import { listContainer, listItem, REVEAL_MARGIN } from '@/lib/motion'

type Tag = 'div' | 'ul' | 'li' | 'section'

interface ListProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  as?: Tag
}

/** 부모. 화면에 들어오면 자식들을 순서대로 밀어 올립니다 */
export function RevealList({ children, className, style, as = 'div' }: ListProps) {
  const shouldReduceMotion = useReducedMotion()
  const Component = motion[as]

  if (shouldReduceMotion) {
    return (
      <Component className={className} style={style}>
        {children}
      </Component>
    )
  }

  return (
    <Component
      className={className}
      style={style}
      variants={listContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: REVEAL_MARGIN }}
    >
      {children}
    </Component>
  )
}

/** 자식. 부모가 없으면 아무 일도 일어나지 않습니다 */
export function RevealItem({ children, className, style, as = 'div' }: ListProps) {
  const shouldReduceMotion = useReducedMotion()
  const Component = motion[as]

  if (shouldReduceMotion) {
    return (
      <Component className={className} style={style}>
        {children}
      </Component>
    )
  }

  return (
    <Component className={className} style={style} variants={listItem}>
      {children}
    </Component>
  )
}
