'use client'

/**
 * 랜딩 하단 CTA (PRD 14.4, 21.12, FIX_3 [7]-3)
 *
 * 히어로의 버튼과 같은 모양입니다. 스크롤을 끝까지 내린 사용자가
 * 위로 되돌아가지 않게 같은 자리에 한 번 더 둡니다.
 *
 * 숨쉬기와 빛 훑기도 히어로와 같습니다. 두 버튼이 한 화면에 같이
 * 보이는 일은 없으므로 둘 다 움직여도 어수선해지지 않습니다.
 *
 * 눌림 반응 때문에 클라이언트 컴포넌트로 뺐습니다. 페이지 자체는
 * 서버 컴포넌트로 두어야 크롤러가 본문을 그대로 읽습니다 (PRD 14.4).
 */

import type { ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'

import { MotionLink, useTap } from '@/components/motion/Pressable'
import ShineOverlay from '@/components/motion/ShineOverlay'
import { BREATHE } from '@/lib/motion'

interface Props {
  href: string
  children: ReactNode
}

export default function CtaLink({ href, children }: Props) {
  const tap = useTap()
  const shouldReduceMotion = useReducedMotion()

  return (
    <MotionLink
      href={href}
      whileTap={tap}
      animate={shouldReduceMotion ? undefined : BREATHE.animate}
      transition={shouldReduceMotion ? undefined : BREATHE.transition}
      className="relative flex min-h-[52px] w-full items-center justify-center overflow-hidden text-body font-semibold text-white"
      style={{
        background: 'var(--button)',
        borderRadius: 'var(--radius-button)',
        boxShadow: 'var(--shadow-button)',
      }}
    >
      {children}
      <ShineOverlay />
    </MotionLink>
  )
}
