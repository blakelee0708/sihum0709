'use client'

/**
 * 눌림 반응 (PRD 21.12)
 *
 * 모바일에는 hover가 없습니다. 손가락이 화면을 덮고 있어서 눌렸다는 것을
 * 알려줄 시각 신호가 이것뿐입니다. 반응이 없으면 사용자는 안 눌렸다고
 * 생각하고 한 번 더 누릅니다.
 *
 * 0.97은 눈에 보이되 레이아웃이 흔들리지 않는 선입니다. 더 줄이면
 * 카드가 통째로 움찔거리고, 덜 줄이면 눌렸는지 알 수 없습니다.
 *
 * MotionLink / MotionButton은 next/link와 button을 감싼 것입니다.
 * div로 한 겹 더 싸면 레이아웃이 바뀌므로 요소 자체를 모션으로 만듭니다.
 */

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

import { TAP_SCALE } from '@/lib/motion'

/** 눌림만 담당합니다. 나머지 속성은 그대로 넘어갑니다 */
export const MotionLink = motion(Link)
export const MotionButton = motion.button

/** whileTap에 넣을 값. reduced motion이면 눌림도 끕니다 */
export function useTap(): { scale: number } | undefined {
  const shouldReduceMotion = useReducedMotion()
  return shouldReduceMotion ? undefined : { scale: TAP_SCALE }
}
