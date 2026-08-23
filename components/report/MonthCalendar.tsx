/** 연간 시험운 캘린더 (PRD 6.6, 8.3 섹션 10) */

import type { MonthFlow } from '@/lib/saju/fortune'

export default function MonthCalendar({
  data,
  year,
}: {
  data: MonthFlow[]
  year: number
}) {
  return (
    <div>
      <p className="text-label" style={{ color: 'var(--text-sub)' }}>
        {year}년 월별 흐름
      </p>

      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {data.map((m) => (
          <li key={m.month} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-label" style={{ color: 'var(--text-sub)' }}>
              {m.month}월
            </span>
            <span
              className="flex gap-[2px]"
              role="img"
              aria-label={`${m.month}월 5단계 중 ${m.level}단계`}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="h-3 w-2"
                  style={{
                    background: i <= m.level ? 'var(--primary)' : 'var(--border)',
                    borderRadius: 2,
                  }}
                />
              ))}
            </span>
            <span className="text-label" style={{ color: 'var(--text-sub)' }}>
              {m.relation}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
