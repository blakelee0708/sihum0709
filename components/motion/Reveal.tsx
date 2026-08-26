'use client'

/**
 * 스크롤 리빌 (PRD 21.12)
 *
 * 화면에 들어올 때 아래에서 떠오르며 나타납니다.
 *
 * ── once를 반드시 켜는 이유 ──
 *
 * `once: false`면 위아래로 스크롤할 때마다 다시 재생됩니다. 카드가 8개
 * 늘어선 결과 화면에서 스크롤을 조금만 되돌려도 전부 다시 떠올라 어지럽습니다.
 * 읽던 자리를 놓치게 만드는 애니메이션은 없느니만 못합니다.
 *
 * ── y 32, 스프링 ──
 *
 * 24px tween에서 32px 스프링으로 올렸습니다 (FIX_3 [6]-4). 24px은
 * 스크롤 중에 눈에 잘 안 들어오고, tween은 끝에서 딱 멈춰 기계적으로
 * 보입니다. 값은 lib/motion.ts에 모여 있습니다.
 *
 * ── margin: '-60px' ──
 *
 * 요소가 화면 아래 경계에 닿는 순간이 아니라 60px 들어온 뒤에 시작합니다.
 * 경계에서 바로 시작하면 스크롤 속도가 빠를 때 이미 다 보이는 카드가
 * 뒤늦게 떠오릅니다.
 *
 * ── prefers-reduced-motion ──
 *
 * 켜져 있으면 애니메이션 없이 최종 상태로 바로 그립니다. opacity 0에서
 * 멈춰 내용이 안 보이는 사고를 막으려고 initial 자체를 false로 둡니다.
 */

import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

import { REVEAL_MARGIN, REVEAL_SPRING, REVEAL_STAGGER, REVEAL_Y } from '@/lib/motion'

interface Props {
  children: ReactNode
  /** 목록에서 순차로 나타나게 할 때 (delay = index × 0.06초) */
  index?: number
  className?: string
  style?: CSSProperties
  /** li, section 등으로 바꿔야 할 때 */
  as?: 'div' | 'li' | 'section' | 'article'
}

export default function Reveal({
  children,
  index = 0,
  className,
  style,
  as = 'div',
}: Props) {
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
      initial={{ opacity: 0, y: REVEAL_Y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: REVEAL_MARGIN }}
      transition={{ ...REVEAL_SPRING, delay: index * REVEAL_STAGGER }}
    >
      {children}
    </Component>
  )
}
