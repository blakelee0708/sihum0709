'use client'

/**
 * 대화 마지막 [결과 보기] 버튼 (FIX_3 [7]-1)
 *
 * 눌림 반응만 담당합니다. 로딩 상태는 [10]에서 붙입니다.
 */

import { motion } from 'framer-motion'

import { optionMotion } from '@/lib/motion'
import { useTap } from '@/components/motion/Pressable'

interface Props {
  label: string
  onFinish: () => void
}

export default function FinishButton({ label, onFinish }: Props) {
  const tap = useTap()

  return (
    <motion.button
      {...optionMotion(0)}
      whileTap={tap}
      type="button"
      onClick={onFinish}
      className="min-h-[44px] w-full py-3 text-chat text-white"
      style={{
        background: 'var(--button)',
        borderRadius: 'var(--radius-button)',
        boxShadow: 'var(--shadow-button)',
      }}
    >
      {label}
    </motion.button>
  )
}
