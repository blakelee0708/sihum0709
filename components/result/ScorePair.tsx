'use client'

/**
 * 당일 운 + 오늘의 운 (PRD 3.2, 21.2)
 *
 * 점수를 색으로만 구분하지 않고 숫자를 항상 함께 표시합니다 (PRD 21.9).
 * 낮은 점수에도 붉은 경고색을 쓰지 않고 주황 계열까지만 사용합니다.
 */

interface Props {
  examDayScore: number
  todayScore: number
  examType: string
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--score-high)'
  if (score >= 50) return 'var(--score-mid)'
  return 'var(--score-low)'
}

export default function ScorePair({ examDayScore, todayScore, examType }: Props) {
  const label = examType === '면접' ? '면접 당일 운' : '시험 당일 운'

  return (
    <div
      className="mt-3 grid grid-cols-2 overflow-hidden"
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-button)',
      }}
    >
      <div className="p-3 text-center" style={{ borderRight: '1px solid var(--border)' }}>
        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          {label}
        </p>
        <p className="text-score" style={{ color: scoreColor(examDayScore) }}>
          {examDayScore}
        </p>
      </div>
      <div className="p-3 text-center">
        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          오늘의 운
        </p>
        <p className="text-score" style={{ color: scoreColor(todayScore) }}>
          {todayScore}
        </p>
      </div>
    </div>
  )
}
