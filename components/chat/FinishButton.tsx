'use client'

/**
 * 대화 마지막 [결과 보기] 버튼 (FIX_3 [7]-1, [10]-1, [10]-2)
 *
 * 무료 결과는 AI 호출 없이 계산과 조립만으로 만들어지므로 즉시 끝납니다.
 * 그런데 누르자마자 화면이 바뀌면 눌린 것을 인지할 틈이 없어, 눌렸는지
 * 확신이 안 서고 한 번 더 누르게 됩니다. 최소 0.8초는 점 세 개를
 * 보여줍니다.
 *
 * 폭은 w-full이라 글자가 점으로 바뀌어도 줄지 않습니다. 높이는 최소
 * 44px로 고정돼 있어 세로도 흔들리지 않습니다.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'

import DotsLoader from '@/components/motion/DotsLoader'
import { MIN_LOADING_MS, optionMotion } from '@/lib/motion'
import { useTap } from '@/components/motion/Pressable'

interface Props {
  label: string
  onFinish: () => void
}

export default function FinishButton({ label, onFinish }: Props) {
  const [loading, setLoading] = useState(false)
  const tap = useTap()

  async function handleClick() {
    if (loading) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, MIN_LOADING_MS))
    onFinish()
  }

  return (
    <motion.button
      {...optionMotion(0)}
      whileTap={loading ? undefined : tap}
      type="button"
      disabled={loading}
      onClick={handleClick}
      aria-busy={loading}
      className="min-h-[44px] w-full py-3 text-chat text-white"
      style={{
        background: 'var(--button)',
        borderRadius: 'var(--radius-button)',
        boxShadow: 'var(--shadow-button)',
      }}
    >
      {loading ? <DotsLoader /> : label}
    </motion.button>
  )
}
