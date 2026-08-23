'use client'

/**
 * 시간 선택기 + 모름 (PRD 14.6)
 *
 * 시작 시간과 태어난 시간에 사용합니다.
 * 모른다고 선택하면 null로 저장하고, 시작 시간이면 카드 8을 숨깁니다 (PRD 6.5).
 * 태어난 시간이면 3기둥으로 진행합니다 (PRD 4.3.3).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'

import { optionMotion } from '@/lib/motion'

interface Props {
  skipLabel: string
  onSubmit: (value: string) => void
  onSkip: () => void
}

export default function TimePickerWidget({ skipLabel, onSubmit, onSkip }: Props) {
  const [value, setValue] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (value) onSubmit(value)
      }}
      className="space-y-2"
    >
      <motion.input
        {...optionMotion(0)}
        type="time"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-h-[44px] w-full px-[14px] py-[11px] text-chat"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-button)',
          color: 'var(--text)',
        }}
      />

      <motion.button
        {...optionMotion(1)}
        type="submit"
        disabled={!value}
        className="min-h-[44px] w-full text-chat text-white disabled:opacity-40"
        style={{
          background: 'var(--button)',
          borderRadius: 'var(--radius-button)',
        }}
      >
        확인
      </motion.button>

      <motion.button
        {...optionMotion(2)}
        type="button"
        onClick={onSkip}
        className="min-h-[44px] w-full text-chat"
        style={{ color: 'var(--text-sub)' }}
      >
        {skipLabel}
      </motion.button>
    </form>
  )
}
