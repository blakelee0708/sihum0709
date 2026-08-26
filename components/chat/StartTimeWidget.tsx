'use client'

/**
 * 시험 시작 시간 (FIX_3 [3]-4)
 *
 * 시험 시작 시각은 오전 9시, 10시가 압도적으로 많습니다. 자주 쓰는
 * 시각을 버튼으로 두면 대부분 탭 한 번으로 끝납니다.
 *
 * 직접 입력을 고를 때만 시간 입력창을 띄웁니다. 상시 노출하면 버튼을
 * 두는 의미가 없습니다.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

import { optionMotion } from '@/lib/motion'
import { useTap } from '@/components/motion/Pressable'

/** 'HH:mm' */
export const START_TIME_PRESETS: { value: string; label: string }[] = [
  { value: '09:00', label: '오전 9시' },
  { value: '10:00', label: '오전 10시' },
  { value: '13:00', label: '오후 1시' },
  { value: '14:00', label: '오후 2시' },
]

interface Props {
  /** '모르겠어요' / '아직 안 나왔어요' */
  skipLabel: string
  onSubmit: (value: string) => void
  onSkip: () => void
}

export default function StartTimeWidget({ skipLabel, onSubmit, onSkip }: Props) {
  const [manual, setManual] = useState(false)
  const [value, setValue] = useState('')
  const tap = useTap()

  if (manual) {
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
          autoFocus
          type="time"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="시험 시작 시간"
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
          whileTap={tap}
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

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {START_TIME_PRESETS.map((p, i) => (
          <motion.button
            key={p.value}
            {...optionMotion(i)}
            whileTap={tap}
            type="button"
            onClick={() => onSubmit(p.value)}
            className="min-h-[44px] w-full px-[14px] py-[11px] text-chat"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              color: 'var(--text)',
            }}
          >
            {p.label}
          </motion.button>
        ))}
      </div>

      <motion.button
        {...optionMotion(START_TIME_PRESETS.length)}
        whileTap={tap}
        type="button"
        onClick={() => setManual(true)}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 px-[14px] py-[11px] text-chat"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-button)',
          color: 'var(--text-sub)',
        }}
      >
        <Clock size={16} aria-hidden />
        직접 입력
      </motion.button>

      <motion.button
        {...optionMotion(START_TIME_PRESETS.length + 1)}
        whileTap={tap}
        type="button"
        onClick={onSkip}
        className="min-h-[44px] w-full text-chat"
        style={{ color: 'var(--text-sub)' }}
      >
        {skipLabel}
      </motion.button>
    </div>
  )
}
