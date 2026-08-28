'use client'

/**
 * 대화 마지막 [결과 보기] 버튼 (FIX_3 [7]-1, FIX_4 [2]-1)
 *
 * 누르면 글자가 점 세 개로 바뀌며 대기가 시작됩니다. 대기 연출과 시트는
 * 호출부(app/start/page.tsx)가 맡고, 이 버튼은 눌렸다는 것만 알립니다.
 * 예전에는 여기서 0.8초를 세고 넘겼는데, 이제 5초 연출이 그 자리를
 * 대신하므로 곧바로 넘깁니다.
 *
 * 점으로 바뀐 뒤에도 버튼은 그대로 남습니다. 대기 화면이 위를 덮지만,
 * 덮이지 않는 순간에도 폭이 흔들리지 않아야 합니다. 폭은 w-full이라
 * 글자가 점이 되어도 줄지 않고, 높이는 최소 44px로 고정돼 있습니다.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'

import DotsLoader from '@/components/motion/DotsLoader'
import { useOptionMotion } from '@/components/motion/motion-safe'
import { useTap } from '@/components/motion/Pressable'

interface Props {
  label: string
  onFinish: () => void
}

export default function FinishButton({ label, onFinish }: Props) {
  const [loading, setLoading] = useState(false)
  const tap = useTap()
  const optionMotion = useOptionMotion()

  function handleClick() {
    if (loading) return
    setLoading(true)
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
