'use client'

/**
 * 유형 뱃지 (PRD 7.3, 7.4)
 *
 * 배경은 오행 색상 10퍼센트 투명도, 테두리 1px, 모서리 20px.
 * 누르면 유형 설명 모달이 열립니다 (PRD 7.5).
 */

import type { TypeBadge as Badge } from '@/lib/content/characters'

interface Props {
  badge: Badge
  onClick?: () => void
  size?: 'md' | 'sm'
}

export default function TypeBadgeView({ badge, onClick, size = 'md' }: Props) {
  const pad = size === 'md' ? 'px-4 py-3' : 'px-3 py-2'

  const content = (
    <>
      <span className={size === 'md' ? 'text-2xl' : 'text-lg'} aria-hidden>
        {badge.icon}
      </span>
      <span className="mt-1 font-semibold">{badge.name}</span>
      <span className="text-label">
        {badge.element}({badge.hanja})
      </span>
    </>
  )

  const style = {
    backgroundColor: `${badge.color}1A`,
    border: `1px solid ${badge.color}`,
    borderRadius: 'var(--radius-chip)',
    color: badge.color,
  }

  if (!onClick) {
    return (
      <div className={`flex flex-col items-center text-label ${pad}`} style={style}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${badge.name} 유형 설명 보기`}
      className={`flex min-h-[44px] flex-col items-center text-label ${pad}`}
      style={style}
    >
      {content}
    </button>
  )
}
