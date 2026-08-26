'use client'

/**
 * 나에게 맞는 시험 유형 (PRD 3.2 카드 7, 6.3)
 *
 * 계산 결과만 막대 그래프로 보여주는 카드입니다. 문장 조각이 없습니다.
 * 지금 준비하는 방식은 강조해서 표시합니다.
 */

import GrowBar from '@/components/motion/GrowBar'
import type { MethodFit } from '@/lib/saju/fortune'
import { EXAM_TYPE_TO_METHOD_KEY, METHOD_KEYS, type ExamType } from '@/lib/saju/constants'

interface Props {
  fit: MethodFit
  examType: ExamType
}

const LABELS: Record<string, string> = {
  객관식필기: '객관식 필기',
  서술논술: '서술 · 논술',
  면접: '면접',
  실기: '실기',
}

export default function MethodFitChart({ fit, examType }: Props) {
  const currentKey = EXAM_TYPE_TO_METHOD_KEY[examType]

  return (
    <ul className="space-y-3">
      {METHOD_KEYS.map((key, i) => {
        const value = fit[key]
        const active = key === currentKey
        return (
          <li key={key}>
            <div className="flex items-baseline justify-between text-label">
              <span
                style={{
                  color: active ? 'var(--primary)' : 'var(--text-sub)',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {LABELS[key]}
                {active && ' · 지금 준비 중'}
              </span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                {value}
              </span>
            </div>
            <div className="mt-1">
              <GrowBar
                percent={value}
                color={active ? 'var(--primary)' : 'var(--border)'}
                index={i}
                label={`${LABELS[key]} 적합도 ${value}점`}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
