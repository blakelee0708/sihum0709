'use client'

/**
 * 시작 버튼 위를 지나는 빛 (FIX_3 [7]-3)
 *
 * 버튼 안에 절대 배치하는 흰 띠입니다. 부모 버튼에 position: relative와
 * overflow: hidden이 있어야 띠가 버튼 밖으로 새지 않습니다.
 *
 * skewX(-20deg)로 비스듬히 눕힙니다. 수직으로 지나가면 로딩 바처럼
 * 보이고, 기울이면 표면을 훑고 지나간 것으로 읽힙니다.
 *
 * 손가락 아이콘은 쓰지 않습니다. 촌스럽고 사주 서비스 톤에 맞지 않습니다.
 */

import { motion, useReducedMotion } from 'framer-motion'

import { SHINE } from '@/lib/motion'

export default function ShineOverlay() {
  const shouldReduceMotion = useReducedMotion()
  if (shouldReduceMotion) return null

  return (
    <motion.span
      aria-hidden
      // skewX를 CSS transform으로 주면 framer가 x를 쓰면서 통째로 덮어씁니다.
      // framer의 style은 transform 조각을 따로 받으므로 여기에 넘깁니다.
      style={{
        skewX: -20,
        background:
          'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
      }}
      initial={{ x: '-120%' }}
      animate={SHINE.animate}
      transition={SHINE.transition}
      className="pointer-events-none absolute inset-y-0 left-0 w-[40%]"
    />
  )
}
