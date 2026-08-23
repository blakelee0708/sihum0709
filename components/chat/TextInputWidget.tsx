'use client'

/**
 * 텍스트 입력 위젯 (PRD 14.6)
 *
 * 자유 텍스트 입력창을 상시 노출하지 않고, 필요한 단계에서만 띄웁니다.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'

import { optionMotion } from '@/lib/motion'

interface Props {
  placeholder?: string
  skipLabel?: string
  onSubmit: (value: string) => void
  onSkip?: () => void
  maxLength?: number
}

export default function TextInputWidget({
  placeholder,
  skipLabel,
  onSubmit,
  onSkip,
  maxLength = 40,
}: Props) {
  const [value, setValue] = useState('')
  const trimmed = value.trim()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (trimmed) onSubmit(trimmed)
      }}
      className="space-y-2"
    >
      <motion.input
        {...optionMotion(0)}
        autoFocus
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
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
        disabled={!trimmed}
        className="min-h-[44px] w-full text-chat text-white disabled:opacity-40"
        style={{
          background: 'var(--button)',
          borderRadius: 'var(--radius-button)',
        }}
      >
        확인
      </motion.button>

      {skipLabel && onSkip && (
        <motion.button
          {...optionMotion(2)}
          type="button"
          onClick={onSkip}
          className="min-h-[44px] w-full text-chat"
          style={{ color: 'var(--text-sub)' }}
        >
          {skipLabel}
        </motion.button>
      )}
    </form>
  )
}
