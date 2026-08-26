'use client'

/**
 * 당일 운 · 오늘의 운 · 잠재력 발휘 지수 (PRD 3.2, 8.7, 21.2)
 *
 * 점수를 색으로만 구분하지 않고 숫자를 항상 함께 표시합니다 (PRD 21.10).
 * 낮은 점수에도 붉은 경고색을 쓰지 않고 주황 계열까지만 사용합니다.
 *
 * 발휘 지수는 유료 전용입니다. 무료에서는 숫자를 "???%"로 가립니다.
 * 셋 중 하나만 가려져 있는 것이 궁금증을 만듭니다 (PRD 3.2).
 */

import { Lock } from 'lucide-react'

interface Props {
  examDayScore: number
  todayScore: number
  examType: string
  /** PRD 8.7 잠재력 발휘 지수. locked가 true면 숫자를 가립니다 */
  potentialScore?: number
  /** 무료 결과에서는 true */
  potentialLocked?: boolean
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--score-high)'
  if (score >= 50) return 'var(--score-mid)'
  return 'var(--score-low)'
}

/**
 * 발휘 지수는 70-120 범위라 0-100 기준 색을 그대로 쓸 수 없습니다.
 * 100을 기준으로 위아래를 나눕니다.
 */
export function potentialColor(score: number): string {
  if (score >= 105) return 'var(--score-high)'
  if (score >= 95) return 'var(--score-mid)'
  return 'var(--score-low)'
}

export default function ScorePair({
  examDayScore,
  todayScore,
  examType,
  potentialScore,
  potentialLocked = false,
}: Props) {
  const label = examType === '면접' ? '면접 당일 운' : '시험 당일 운'
  const showPotential = potentialScore !== undefined

  return (
    <div
      className={`mt-3 grid overflow-hidden ${showPotential ? 'grid-cols-3' : 'grid-cols-2'}`}
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

      <div
        className="p-3 text-center"
        style={showPotential ? { borderRight: '1px solid var(--border)' } : undefined}
      >
        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          오늘의 운
        </p>
        <p className="text-score" style={{ color: scoreColor(todayScore) }}>
          {todayScore}
        </p>
      </div>

      {showPotential && (
        <div className="p-3 text-center">
          <p
            className="flex items-center justify-center gap-1 text-label"
            style={{ color: 'var(--text-sub)' }}
          >
            {potentialLocked && <Lock size={12} aria-hidden />}
            발휘 지수
          </p>
          {potentialLocked ? (
            <p className="text-score" style={{ color: 'var(--text-sub)' }}>
              <span className="sr-only">유료 리포트에서 볼 수 있어요</span>
              <span aria-hidden>???%</span>
            </p>
          ) : (
            <p className="text-score" style={{ color: potentialColor(potentialScore) }}>
              {potentialScore}%
            </p>
          )}
        </div>
      )}
    </div>
  )
}
