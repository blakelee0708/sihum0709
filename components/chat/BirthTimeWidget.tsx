'use client'

/**
 * 태어난 시간 입력 (FIX_3 [3]-3)
 *
 * 기본 time 입력은 "오전 12시"와 "오후 12시"가 헷갈립니다. 배포 화면에서
 * "오전 12시 53분"이 선택되는 것을 확인했습니다. 자정과 정오를 12로
 * 부르는 관례 때문인데, 한국어에서는 새벽·밤이라고 부르는 쪽이 자연스럽습니다.
 *
 * 그래서 하루를 네 구간으로 먼저 나눕니다.
 *
 *   새벽  00~05
 *   오전  06~11
 *   오후  12~17
 *   밤    18~23
 *
 * 구간을 고르면 그 구간의 시(6개)를 버튼으로 보여줍니다. 분은 선택이라
 * 안 넣으면 0분으로 처리합니다.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'

import { optionMotion } from '@/lib/motion'
import { useTap } from '@/components/motion/Pressable'

interface Period {
  id: string
  label: string
  /** 시작 시(0, 6, 12, 18). 여기부터 6시간 */
  from: number
}

export const BIRTH_PERIODS: Period[] = [
  { id: 'dawn', label: '새벽', from: 0 },
  { id: 'morning', label: '오전', from: 6 },
  { id: 'afternoon', label: '오후', from: 12 },
  { id: 'night', label: '밤', from: 18 },
]

interface Props {
  /** 'HH:mm' */
  onSubmit: (value: string) => void
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 24시를 그 구간에서 부르는 이름으로. 새벽 0시, 오후 12시, 밤 9시 */
function hourLabel(hour: number): string {
  if (hour === 0) return '0시'
  if (hour <= 12) return `${hour}시`
  return `${hour - 12}시`
}

export default function BirthTimeWidget({ onSubmit }: Props) {
  const [period, setPeriod] = useState<Period | null>(null)
  const [hour, setHour] = useState<number | null>(null)
  const [minute, setMinute] = useState('')
  const tap = useTap()

  const minuteValue = minute === '' ? 0 : Number(minute)
  const minuteValid = minuteValue >= 0 && minuteValue <= 59

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (hour === null || !minuteValid) return
        onSubmit(`${pad(hour)}:${pad(minuteValue)}`)
      }}
      className="space-y-2"
    >
      <div className="grid grid-cols-4 gap-2">
        {BIRTH_PERIODS.map((p, i) => {
          const selected = period?.id === p.id
          return (
            <motion.button
              key={p.id}
              {...optionMotion(i)}
              whileTap={tap}
              type="button"
              onClick={() => {
                setPeriod(p)
                setHour(null)
              }}
              aria-pressed={selected}
              className="min-h-[44px] w-full px-2 py-[11px] text-chat"
              style={{
                background: selected ? 'var(--primary)' : 'var(--surface)',
                border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-button)',
                color: selected ? '#FFFFFF' : 'var(--text)',
              }}
            >
              {p.label}
            </motion.button>
          )
        })}
      </div>

      {period && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }, (_, i) => period.from + i).map((h, i) => {
            const selected = hour === h
            return (
              <motion.button
                key={h}
                {...optionMotion(i)}
                whileTap={tap}
                type="button"
                onClick={() => setHour(h)}
                aria-pressed={selected}
                className="min-h-[44px] w-full px-2 py-[11px] text-chat"
                style={{
                  background: selected ? 'var(--primary)' : 'var(--surface)',
                  border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-button)',
                  color: selected ? '#FFFFFF' : 'var(--text)',
                }}
              >
                {hourLabel(h)}
              </motion.button>
            )
          })}
        </div>
      )}

      {hour !== null && (
        <label className="relative block">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            value={minute}
            maxLength={2}
            placeholder="분 (몰라도 괜찮아요)"
            onChange={(e) => setMinute(e.target.value.replace(/\D/g, '').slice(0, 2))}
            aria-label="분"
            className="min-h-[44px] w-full px-[14px] py-[11px] text-chat"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              color: 'var(--text)',
            }}
          />
        </label>
      )}

      {!minuteValid && (
        <p role="alert" className="px-1 text-label" style={{ color: 'var(--fire)' }}>
          분은 0부터 59까지예요.
        </p>
      )}

      <motion.button
        {...optionMotion(2)}
        whileTap={tap}
        type="submit"
        disabled={hour === null || !minuteValid}
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
