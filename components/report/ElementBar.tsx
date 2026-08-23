/** 오행 분포 막대 (PRD 8.3 섹션 1) */

import { TYPE_BADGES } from '@/lib/content/characters'
import { ELEMENTS, type Element } from '@/lib/saju/constants'

interface Props {
  scores: Record<Element, number>
  strong: Element
  weak: Element
}

export default function ElementBar({ scores, strong, weak }: Props) {
  const max = Math.max(...ELEMENTS.map((e) => scores[e]), 1)

  return (
    <ul className="space-y-2">
      {ELEMENTS.map((e) => {
        const badge = TYPE_BADGES[e]
        const tag = e === strong ? '강함' : e === weak ? '약함' : null

        return (
          <li key={e}>
            <div className="flex items-baseline justify-between text-label">
              <span style={{ color: 'var(--text)' }}>
                {e}({badge.hanja}){tag && <span className="ml-1" style={{ color: badge.color }}>· {tag}</span>}
              </span>
              <span style={{ color: 'var(--text-sub)' }}>{scores[e]}</span>
            </div>
            <div
              className="mt-1 h-2 w-full overflow-hidden"
              style={{ background: 'var(--bg)', borderRadius: 'var(--radius-round)' }}
              role="img"
              aria-label={`${e} 기운 ${scores[e]}점`}
            >
              <div
                className="h-full"
                style={{
                  width: `${(scores[e] / max) * 100}%`,
                  background: badge.color,
                  borderRadius: 'var(--radius-round)',
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
