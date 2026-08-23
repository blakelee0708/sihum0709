'use client'

/**
 * 시험 전 7일 기운 흐름 (PRD 3.2 카드 6, 6.4)
 *
 * 점수만 보여주면 무슨 뜻인지 알 수 없으므로 날짜별 라벨을 함께 붙입니다.
 * 점수를 색으로만 구분하지 않고 숫자도 함께 노출합니다 (PRD 21.9).
 */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { DayFlowLabeled } from '@/lib/content/assemble'
import { scoreColor } from './ScorePair'

interface Props {
  data: DayFlowLabeled[]
}

export default function WeekFlowChart({ data }: Props) {
  const chartData = data.map((d) => {
    const [, m, day] = d.date.split('-').map(Number)
    return {
      label: d.dday === 0 ? '당일' : `D-${d.dday}`,
      date: `${m}/${day}`,
      score: d.score,
      flowLabel: d.label,
    }
  })

  return (
    <div>
      <div className="h-[180px] w-full" role="img" aria-label="시험 전 7일 기운 흐름 그래프">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--text-sub)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'var(--text-sub)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
              formatter={(value: number, _n, item) => [
                `${value} · ${item.payload.flowLabel}`,
                item.payload.date,
              ]}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--primary)' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 그래프를 읽기 어려운 경우를 대비해 표로도 제공합니다 */}
      <ul className="mt-3 space-y-1">
        {data.map((d) => (
          <li key={d.dday} className="flex items-center gap-2 text-label">
            <span className="w-10 shrink-0" style={{ color: 'var(--text-sub)' }}>
              {d.dday === 0 ? '당일' : `D-${d.dday}`}
            </span>
            <span className="w-8 shrink-0 font-semibold" style={{ color: scoreColor(d.score) }}>
              {d.score}
            </span>
            <span style={{ color: 'var(--text)' }}>{d.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
