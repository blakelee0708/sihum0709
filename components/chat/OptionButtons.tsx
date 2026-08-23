'use client'

/**
 * 선택지 버튼 (PRD 21.11)
 *
 * 선택지가 6개를 넘으면 2열 그리드로 배치합니다.
 * 380px 화면에서 3열은 사용하지 않습니다.
 * 최소 높이 44px를 유지합니다 (PRD 21.9 접근성).
 */

import { motion } from 'framer-motion'
import { Calendar, Clock, Keyboard } from 'lucide-react'

import { optionMotion } from '@/lib/motion'
import type { StepOption } from '@/lib/content/chat-flow'

const ICONS = {
  keyboard: Keyboard,
  calendar: Calendar,
  clock: Clock,
} as const

interface Props {
  options: StepOption[]
  onSelect: (value: string) => void
  /** 마지막에 붙는 자유 입력 버튼 */
  freeInputLabel?: string
  onFreeInput?: () => void
  /** 자유 입력 버튼에 붙는 아이콘 */
  freeInputIcon?: keyof typeof ICONS
}

export default function OptionButtons({
  options,
  onSelect,
  freeInputLabel,
  onFreeInput,
  freeInputIcon = 'keyboard',
}: Props) {
  const twoColumn = options.length > 6
  const FreeIcon = ICONS[freeInputIcon]

  return (
    <div className="space-y-2">
      <div className={twoColumn ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
        {options.map((o, i) => (
          <motion.button
            key={o.value}
            {...optionMotion(i)}
            type="button"
            onClick={() => onSelect(o.value)}
            className="min-h-[44px] w-full px-[14px] py-[11px] text-chat"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              color: 'var(--text)',
            }}
          >
            {o.label}
          </motion.button>
        ))}
      </div>

      {freeInputLabel && onFreeInput && (
        <motion.button
          {...optionMotion(options.length)}
          type="button"
          onClick={onFreeInput}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 px-[14px] py-[11px] text-chat"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            color: 'var(--text-sub)',
          }}
        >
          <FreeIcon size={16} aria-hidden />
          {freeInputLabel}
        </motion.button>
      )}
    </div>
  )
}
