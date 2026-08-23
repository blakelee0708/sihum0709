'use client'

/**
 * 유형 공유 이미지 (PRD 9.2, 뱃지 모달 전용)
 *
 * 규격 1080 x 1080 (정사각형). 화면에는 540 x 540으로 그리고
 * pixelRatio 2로 캡처합니다.
 *
 * 시험 정보 없이 유형만 노출하므로 시험이 끝난 뒤에도 공유 가치가 남습니다.
 */

import { forwardRef } from 'react'

import {
  SHOW_TYPE_DISTRIBUTION,
  TYPE_DISTRIBUTION,
  getShareGradient,
  type TypeBadge,
} from '@/lib/content/characters'

const TypeShareCard = forwardRef<HTMLDivElement, { badge: TypeBadge }>(
  function TypeShareCard({ badge }, ref) {
    return (
      <div
        ref={ref}
        style={{
          width: 540,
          height: 540,
          background: getShareGradient(badge.element),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          boxSizing: 'border-box',
          padding: 40,
          color: 'var(--text)',
          fontFamily: "'PretendardCapture', var(--font-pretendard), sans-serif",
        }}
      >
        <span style={{ fontSize: 72 }}>{badge.icon}</span>

        <p style={{ fontSize: 40, fontWeight: 700, color: badge.color }}>
          {badge.name}
        </p>

        <p style={{ fontSize: 22, textAlign: 'center', lineHeight: 1.5 }}>
          {badge.element}({badge.hanja}) 기운이 강한
          <br />
          유형
        </p>

        {SHOW_TYPE_DISTRIBUTION && TYPE_DISTRIBUTION && (
          <p style={{ fontSize: 18, color: 'var(--text-sub)' }}>
            전체 이용자 중 {TYPE_DISTRIBUTION[badge.element]}%
          </p>
        )}

        <p style={{ fontSize: 16, color: 'var(--text-sub)', marginTop: 12 }}>
          siheomsaju.com
        </p>
      </div>
    )
  }
)

export default TypeShareCard
