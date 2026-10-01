'use client'

/**
 * 랜딩 미리보기의 7일 기운 흐름 막대 (FIX_3 [9]-1, [9]-2)
 *
 * ── 알약이 공중에 떠 보이던 이유 ──
 *
 * border-radius를 999px(--radius-round)로 줬습니다. 폭 45px짜리 막대에
 * 그 값을 주면 위아래가 완전히 둥글어져 막대가 아니라 알약이 됩니다.
 * 낮은 막대는 아예 원처럼 보이고, 바닥의 둥근 면 때문에 바닥선에서
 * 떠 있는 것처럼 읽힙니다.
 *
 * 위는 4px, 아래는 2px만 깎습니다. 막대라는 것은 유지하면서 각진
 * 인상만 덜어냅니다.
 *
 * ── 최소 높이 ──
 *
 * 점수를 그대로 높이 %로 쓰면 낮은 날은 몇 px밖에 안 됩니다. 흐름이
 * 있는지 없는지 안 보입니다. 표시 축(40~95)을 25~100%로 옮겨 낮은 날도
 * 막대로 보이게 하고, 대신 높낮이 차이는 그대로 남깁니다.
 *
 * 축이 0~100에서 40~95로 바뀌었으므로(FIX_4 [1]) 여기 분모도 같이
 * 옮겼습니다. 안 옮기면 모든 막대가 55% 위에 몰려 흐름이 평평해 보입니다.
 *
 * ── 당일 막대 ──
 *
 * 나머지가 다 오른 뒤 한 박자 쉬고 스프링으로 올라옵니다. 마지막이
 * 시험 당일이라 시선이 그쪽에서 멈춰야 합니다.
 *
 * ── 색과 모서리 (FIX_5 [5]) ──
 *
 * 당일만 강조 파랑(#2E5BD9), 나머지는 #D3DEF5입니다. 모서리는 위쪽만
 * 둥글게 깎습니다. 아래까지 둥글면 바닥선에서 떠 보입니다.
 */

import { motion, useReducedMotion } from 'framer-motion'

import { EASE } from '@/lib/motion'
import { DISPLAY_MAX, DISPLAY_MIN } from '@/lib/saju/display-range'

export interface DayBar {
  label: string
  score: number
}

/** 표시 축(40~95) 점수를 25~100% 높이로 (FIX_3 [9]-1, FIX_4 [1]) */
export function barHeight(score: number): number {
  const clamped = Math.max(DISPLAY_MIN, Math.min(DISPLAY_MAX, score))
  return 25 + ((clamped - DISPLAY_MIN) / (DISPLAY_MAX - DISPLAY_MIN)) * 75
}

/** 마지막 막대가 올라오기 시작하는 시각 (초) */
const TODAY_DELAY = 0.7

export default function WeekFlowBars({ data }: { data: DayBar[] }) {
  const shouldReduceMotion = useReducedMotion()
  const lastIndex = data.length - 1

  return (
    <div
      className="flex h-[48px] items-end gap-[5px]"
      role="img"
      aria-label={`시험 D-7 내 기운 흐름 예시. 당일 ${data[lastIndex]?.score ?? 0}점`}
    >
      {data.map((d, i) => {
        const isToday = i === lastIndex
        const height = `${barHeight(d.score)}%`

        // 당일만 강조 파랑입니다. 나머지는 한 단계 연하게 둡니다 (FIX_5 [5])
        const style = {
          background: isToday ? '#2E5BD9' : '#D3DEF5',
          borderRadius: '4px 4px 1px 1px',
        }

        if (shouldReduceMotion) {
          return <div key={i} className="flex-1" style={{ ...style, height }} />
        }

        return (
          <motion.div
            key={i}
            className="flex-1"
            style={style}
            initial={{ height: 0 }}
            whileInView={{ height }}
            viewport={{ once: true, margin: '-40px' }}
            transition={
              isToday
                ? { type: 'spring', stiffness: 200, damping: 12, delay: TODAY_DELAY }
                : { duration: 0.5, delay: i * 0.08, ease: EASE }
            }
          />
        )
      })}
    </div>
  )
}
