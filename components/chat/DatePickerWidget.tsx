'use client'

/**
 * 달력 선택기 (PRD 14.6)
 *
 * 시험 날짜와 생년월일에 사용합니다. 두 경우의 적정 범위가 달라
 * min/max와 기본 표시 연도를 다르게 받습니다.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'

import { optionMotion } from '@/lib/motion'

interface Props {
  /** 'exam'이면 오늘 이후, 'birth'면 오늘 이전으로 제한합니다 */
  mode: 'exam' | 'birth'
  onSubmit: (value: string) => void
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function DatePickerWidget({ mode, onSubmit }: Props) {
  const today = todayKey()
  const [value, setValue] = useState('')

  // 절기 테이블 범위가 1940-2030이므로 그 안으로 제한합니다 (PRD 4.1.1)
  const min = mode === 'birth' ? '1940-01-01' : today
  const max = mode === 'birth' ? today : '2030-12-31'

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
        type="date"
        value={value}
        min={min}
        max={max}
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
    </form>
  )
}
