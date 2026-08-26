/**
 * 유료 리포트 표지 (PRD 8.3, 8.4)
 *
 * 당일 운 · 오늘의 운 · 잠재력 발휘 지수 셋과 유형 뱃지를 나란히 둡니다.
 * 무료에서는 발휘 지수만 "???%"로 가려져 있었고, 여기서 숫자가 열립니다.
 *
 * 면접은 기업 궁합 점수를 함께 보여줍니다.
 */

import type { TypeBadge } from '@/lib/content/characters'
import { potentialColor, scoreColor } from '@/components/result/ScorePair'

interface Props {
  examType: '필기' | '면접'
  examDayScore: number
  todayScore: number
  potentialScore: number
  badge: TypeBadge
  /** 면접에서 설립일을 확인한 경우에만 있습니다 */
  compatibility: { score: number; relation: string } | null
}

export default function ReportCover({
  examType,
  examDayScore,
  todayScore,
  potentialScore,
  badge,
  compatibility,
}: Props) {
  const dayLabel = examType === '면접' ? '면접 당일 운' : '시험 당일 운'

  return (
    <div
      className="mt-4 p-card"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        <Score label={dayLabel} value={examDayScore} color={scoreColor(examDayScore)} />
        <Score label="오늘의 운" value={todayScore} color={scoreColor(todayScore)} />
        <Score
          label="발휘 지수"
          value={`${potentialScore}%`}
          color={potentialColor(potentialScore)}
        />
      </div>

      <div
        className="mt-3 flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          내 유형
        </p>
        <p className="text-body font-semibold" style={{ color: badge.color }}>
          {badge.name} · {badge.element}({badge.hanja})
        </p>
      </div>

      {compatibility && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-label" style={{ color: 'var(--text-sub)' }}>
            기업 궁합
          </p>
          <p className="text-body font-semibold" style={{ color: scoreColor(compatibility.score) }}>
            {compatibility.score} · {compatibility.relation}
          </p>
        </div>
      )}
    </div>
  )
}

function Score({
  label,
  value,
  color,
}: {
  label: string
  value: number | string
  color: string
}) {
  return (
    <div>
      <p className="text-label" style={{ color: 'var(--text-sub)' }}>
        {label}
      </p>
      <p className="text-score" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
