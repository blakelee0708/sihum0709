/**
 * 오행 분포 막대 (PRD 8.3 섹션 1)
 *
 * 막대가 0에서 자랍니다 (FIX_3 [9]-3). 값이 이미 채워진 채로 나타나면
 * 그냥 그림이고, 자라면 계산된 값으로 읽힙니다.
 */

import GrowBar from '@/components/motion/GrowBar'
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
      {ELEMENTS.map((e, i) => {
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
            <div className="mt-1">
              <GrowBar
                percent={(scores[e] / max) * 100}
                color={badge.color}
                index={i}
                label={`${e} 기운 ${scores[e]}점`}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
