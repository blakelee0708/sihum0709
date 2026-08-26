'use client'

/**
 * 랜딩 하단 CTA (PRD 14.4, 21.12)
 *
 * 히어로의 버튼과 같은 모양입니다. 스크롤을 끝까지 내린 사용자가
 * 위로 되돌아가지 않게 같은 자리에 한 번 더 둡니다.
 *
 * 눌림 반응 때문에 클라이언트 컴포넌트로 뺐습니다. 페이지 자체는
 * 서버 컴포넌트로 두어야 크롤러가 본문을 그대로 읽습니다 (PRD 14.4).
 */

import type { ReactNode } from 'react'

import { MotionLink, useTap } from '@/components/motion/Pressable'

interface Props {
  href: string
  children: ReactNode
}

export default function CtaLink({ href, children }: Props) {
  const tap = useTap()

  return (
    <MotionLink
      href={href}
      whileTap={tap}
      className="flex min-h-[52px] w-full items-center justify-center text-body font-semibold text-white"
      style={{
        background: 'var(--button)',
        borderRadius: 'var(--radius-button)',
        boxShadow: 'var(--shadow-button)',
      }}
    >
      {children}
    </MotionLink>
  )
}
