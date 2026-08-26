'use client'

/**
 * 눌림 반응 (PRD 21.12)
 *
 * 모바일에는 hover가 없습니다. 손가락이 화면을 덮고 있어서 눌렸다는 것을
 * 알려줄 시각 신호가 이것뿐입니다. 반응이 없으면 사용자는 안 눌렸다고
 * 생각하고 한 번 더 누릅니다.
 *
 * 크기·색·속도 세 가지를 겹쳐야 확실합니다. 값은 lib/motion.ts에
 * 모여 있습니다 (FIX_3 [7]-1).
 *
 * MotionLink / MotionButton은 next/link와 button을 감싼 것입니다.
 * div로 한 겹 더 싸면 레이아웃이 바뀌므로 요소 자체를 모션으로 만듭니다.
 */

import Link from 'next/link'
import { motion, useReducedMotion, type TargetAndTransition } from 'framer-motion'

import { TAP_SCALE, TAP_SPRING, TAP_SURFACE_BG } from '@/lib/motion'

/** 눌림만 담당합니다. 나머지 속성은 그대로 넘어갑니다 */
export const MotionLink = motion(Link)
export const MotionButton = motion.button

/**
 * whileTap에 넣을 값. reduced motion이면 눌림도 끕니다.
 *
 * 밝은 배경 버튼은 'surface'를 넘겨 배경까지 진해지게 합니다. 어두운
 * 버튼에 쓰면 흰 글자가 순간 안 보입니다 (lib/motion.ts).
 *
 * 배경색을 함께 바꾸려면 그 버튼의 초기 배경이 backgroundColor로
 * 지정돼 있어야 합니다. background 단축 속성으로 두면 framer가 되돌릴
 * 값을 못 찾습니다.
 */
export function useTap(
  variant: 'solid' | 'surface' = 'solid'
): TargetAndTransition | undefined {
  const shouldReduceMotion = useReducedMotion()
  if (shouldReduceMotion) return undefined

  return variant === 'surface'
    ? { scale: TAP_SCALE, backgroundColor: TAP_SURFACE_BG, transition: TAP_SPRING }
    : { scale: TAP_SCALE, transition: TAP_SPRING }
}
