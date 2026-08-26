'use client'

/**
 * 생년월일 · 시험 날짜 숫자 입력 (FIX_3 [3]-1, [3]-2, [3]-5)
 *
 * 기본 달력(input type="date")을 쓰면 1990년을 찾으려고 달을 420번
 * 넘겨야 합니다. 여기서 이탈합니다. 년·월·일 세 칸에 숫자를 직접 적게
 * 합니다.
 *
 *   ┌────────┬──────┬──────┐
 *   │  1990  │  05  │  15  │
 *   │   년    │  월   │  일   │
 *   └────────┴──────┴──────┘
 *
 * inputMode="numeric"으로 숫자 키패드를 띄우고, 자릿수가 차면 다음 칸으로
 * 넘깁니다. 년 4자리 → 월 2자리 → 일.
 *
 * 생년월일은 음력을 받을 수 있습니다. lunar 프로퍼티가 있으면 입력값을
 * 음력으로 보고 양력으로 바꿔서 넘깁니다 (lib/saju/lunar.ts).
 */

import { forwardRef, useRef, useState, type ChangeEvent, type RefObject } from 'react'
import { motion } from 'framer-motion'

import { optionMotion } from '@/lib/motion'
import { useTap } from '@/components/motion/Pressable'
import { lunarToSolar } from '@/lib/saju/lunar'

/**
 * 절기 테이블 범위가 1940-2030입니다 (PRD 4.1.1).
 *
 * FIX_3 [3]-5는 "년 1900 이상"이라고 했는데, 1900~1939년생은 사주를
 * 계산할 절기 표가 없어 결과를 만들 수 없습니다. 그래서 하한을 1940으로
 * 둡니다. 오타로 보이는 값은 아래에서 따로 되묻습니다.
 */
export const BIRTH_MIN_YEAR = 1940
export const EXAM_MAX_YEAR = 2030

interface Props {
  /** 'exam'이면 오늘 이후, 'birth'면 오늘 이전으로 제한합니다 */
  mode: 'exam' | 'birth'
  /** 값이 있으면 입력을 음력으로 보고 양력으로 변환합니다 */
  lunar?: { isLeapMonth: boolean }
  /**
   * 양력 'YYYY-MM-DD'.
   * 음력 입력이면 변환된 양력과 입력한 음력을 함께 넘깁니다.
   */
  onSubmit: (solar: string, lunarDate?: string) => void
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 그 달의 마지막 날 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function todayParts() {
  const d = new Date()
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
}

/** 날짜만 비교합니다. 시각은 필요 없습니다 */
function dayValue(y: number, m: number, d: number): number {
  return y * 10000 + m * 100 + d
}

interface Invalid {
  message: string
  /** 있으면 그 해로 고쳐주는 버튼을 붙입니다 */
  suggestYear?: number
}

type Check = { ok: true; solar: string; lunarDate?: string } | ({ ok: false } & Invalid)

export default function DateFieldWidget({ mode, lunar, onSubmit }: Props) {
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [error, setError] = useState<Invalid | null>(null)

  const monthRef = useRef<HTMLInputElement>(null)
  const dayRef = useRef<HTMLInputElement>(null)
  const tap = useTap()

  const filled = year.length === 4 && month.length >= 1 && day.length >= 1

  /** 숫자만 남기고, 자릿수가 차면 다음 칸으로 넘깁니다 */
  function handle(
    setter: (v: string) => void,
    maxLength: number,
    next?: RefObject<HTMLInputElement>
  ) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, maxLength)
      setter(digits)
      setError(null)
      if (digits.length === maxLength) next?.current?.focus()
    }
  }

  function validate(y: number, m: number, d: number): Check {
    const today = todayParts()

    if (mode === 'birth') {
      if (y < BIRTH_MIN_YEAR || y > today.y) {
        // 1890처럼 앞자리를 잘못 적는 경우가 많습니다. 100년을 더해
        // 범위 안으로 들어오면 그 해를 제안합니다 (FIX_3 [3]-5).
        const suggest = y + 100
        if (suggest >= BIRTH_MIN_YEAR && suggest <= today.y) {
          return {
            ok: false,
            message: `${y}년이 맞으세요?\n${suggest}년을 적으신 건 아닐까요?`,
            suggestYear: suggest,
          }
        }
        return {
          ok: false,
          message: `${BIRTH_MIN_YEAR}년부터 ${today.y}년까지 입력할 수 있어요.`,
        }
      }
    } else if (y < today.y || y > EXAM_MAX_YEAR) {
      return {
        ok: false,
        message: `${today.y}년부터 ${EXAM_MAX_YEAR}년까지 입력할 수 있어요.`,
      }
    }

    if (m < 1 || m > 12) {
      return { ok: false, message: '월은 1부터 12까지예요.' }
    }

    // 음력은 달의 길이가 양력과 다릅니다. 그 날짜가 실제로 있는지는
    // 변환기가 판단하므로 여기서는 30일까지만 봅니다.
    const lastDay = lunar ? 30 : daysInMonth(y, m)
    if (d < 1 || d > lastDay) {
      return { ok: false, message: `${m}월은 ${lastDay}일까지예요.` }
    }

    if (lunar) {
      const solar = lunarToSolar({
        year: y,
        month: m,
        day: d,
        isLeapMonth: lunar.isLeapMonth,
      })
      if (!solar) {
        return {
          ok: false,
          message: lunar.isLeapMonth
            ? `${y}년에는 윤${m}월이 없어요.\n다시 확인해 주시겠어요?`
            : '음력에 없는 날짜예요.\n다시 확인해 주시겠어요?',
        }
      }
      // 변환된 양력이 절기 표 밖으로 나가는 경우가 있습니다
      // (음력 1939년 12월 → 양력 1940년 1월은 괜찮지만 그 반대도 생깁니다)
      const solarYear = Number(solar.slice(0, 4))
      if (solarYear < BIRTH_MIN_YEAR || solarYear > today.y) {
        return {
          ok: false,
          message: `${BIRTH_MIN_YEAR}년부터 ${today.y}년까지 입력할 수 있어요.`,
        }
      }
      return { ok: true, solar, lunarDate: `${y}-${pad(m)}-${pad(d)}` }
    }

    const value = dayValue(y, m, d)
    const todayValue = dayValue(today.y, today.m, today.d)

    if (mode === 'birth' && value > todayValue) {
      return { ok: false, message: '아직 오지 않은 날짜예요.' }
    }
    if (mode === 'exam' && value < todayValue) {
      return { ok: false, message: '이미 지난 날짜예요.' }
    }

    return { ok: true, solar: `${y}-${pad(m)}-${pad(d)}` }
  }

  function submit(overrideYear?: number) {
    const y = overrideYear ?? Number(year)
    const m = Number(month)
    const d = Number(day)
    if (!y || !m || !d) return

    const checked = validate(y, m, d)
    if (!checked.ok) {
      setError(checked)
      return
    }
    onSubmit(checked.solar, checked.lunarDate)
  }

  const suggestYear = error?.suggestYear

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-2"
    >
      <motion.div {...optionMotion(0)} className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
        <DateField
          label="년"
          value={year}
          maxLength={4}
          placeholder={mode === 'birth' ? '1990' : String(todayParts().y)}
          onChange={handle(setYear, 4, monthRef)}
          autoFocus
        />
        <DateField
          ref={monthRef}
          label="월"
          value={month}
          maxLength={2}
          placeholder="05"
          onChange={handle(setMonth, 2, dayRef)}
        />
        <DateField
          ref={dayRef}
          label="일"
          value={day}
          maxLength={2}
          placeholder="15"
          onChange={handle(setDay, 2)}
        />
      </motion.div>

      {error && (
        <div className="space-y-2">
          <p
            role="alert"
            className="whitespace-pre-line px-1 text-label"
            style={{ color: 'var(--fire)' }}
          >
            {error.message}
          </p>
          {suggestYear && (
            <motion.button
              whileTap={tap}
              type="button"
              onClick={() => {
                setYear(String(suggestYear))
                setError(null)
                submit(suggestYear)
              }}
              className="min-h-[44px] w-full px-[14px] py-[11px] text-chat"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                color: 'var(--text)',
              }}
            >
              {suggestYear}년으로 할게요
            </motion.button>
          )}
        </div>
      )}

      <motion.button
        {...optionMotion(1)}
        whileTap={tap}
        type="submit"
        disabled={!filled}
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

interface FieldProps {
  label: string
  value: string
  maxLength: number
  placeholder: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  autoFocus?: boolean
}

/**
 * 칸 하나. 높이 52px, 글자 20px (FIX_3 [3]-1).
 *
 * 숫자 키패드를 띄우려고 type="tel" + inputMode="numeric"을 함께 씁니다.
 * type="number"는 증감 화살표가 붙고 앞자리 0을 지웁니다.
 */
const DateField = forwardRef<HTMLInputElement, FieldProps>(function DateField(
  { label, value, maxLength, placeholder, onChange, autoFocus },
  ref
) {
  return (
    <label className="relative block">
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={onChange}
        autoFocus={autoFocus}
        aria-label={label}
        className="h-[52px] w-full pl-[14px] pr-7 text-center"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-button)',
          color: 'var(--text)',
          fontSize: 20,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-label"
        style={{ color: 'var(--text-sub)' }}
      >
        {label}
      </span>
    </label>
  )
})
