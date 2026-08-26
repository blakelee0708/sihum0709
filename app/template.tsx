'use client'

/**
 * 페이지 전환 (PRD 21.12)
 *
 * ── template.tsx인 이유 ──
 *
 * layout.tsx는 라우트가 바뀌어도 인스턴스를 유지합니다. 그래서 마운트
 * 애니메이션이 한 번만 돌고 끝납니다. template.tsx는 라우트마다 새로
 * 마운트되므로 진입 애니메이션이 매번 재생됩니다.
 *
 * ── 나가는 화면을 애니메이션하지 않는 이유 ──
 *
 * App Router에서 나가는 화면을 붙잡아 두려면 AnimatePresence로 감싸고
 * 라우트를 직접 들고 있어야 합니다. 그러면 서버 컴포넌트 스트리밍과
 * 프리페치가 어긋나고, 뒤로 가기에서 화면이 겹칩니다. 라우팅이 끊기는
 * 것보다 들어오는 쪽만 부드럽게 하는 편이 낫습니다.
 *
 * 나가는 느낌은 누른 버튼의 whileTap이 대신합니다. 손끝에서 눌리고
 * 다음 화면이 떠오르면 전환으로 읽힙니다.
 *
 * ── y: 12 ──
 *
 * 24px은 카드 리빌용입니다. 화면 전체가 그만큼 움직이면 멀미가 납니다.
 * 절반만 씁니다.
 */

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

import { EASE, PAGE_ENTER_DURATION, PAGE_ENTER_Y } from '@/lib/motion'

export default function Template({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: PAGE_ENTER_Y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: PAGE_ENTER_DURATION, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
