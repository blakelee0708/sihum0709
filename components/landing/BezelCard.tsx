/**
 * 이중 테두리 카드 (FIX_5 [1]-6)
 *
 * 랜딩의 카드는 모두 두 겹입니다. 반투명한 바깥 틀 안에 흰 카드가 한 겹
 * 더 들어갑니다. 한 겹짜리 흰 카드는 배경에서 그냥 잘려 나온 것처럼
 * 보이는데, 테두리 안에 테두리가 한 번 더 있으면 물건처럼 보입니다.
 *
 * 안쪽 반경은 바깥 반경에서 패딩(5px)을 뺀 값입니다. 같은 값을 쓰면
 * 모서리에서 두 곡선이 어긋나 틈이 벌어져 보입니다.
 */

import type { CSSProperties, ReactNode } from 'react'

/** 바깥 틀과 안쪽 카드의 반경 차이. padding과 같은 값입니다 */
const BEZEL = 5

interface Props {
  children: ReactNode
  /** 바깥 반경 (px). 안쪽은 여기서 5를 뺀 값이 됩니다 */
  radius?: number
  className?: string
  style?: CSSProperties
  /** 안쪽 흰 카드에 주는 스타일 (패딩 등) */
  innerClassName?: string
  innerStyle?: CSSProperties
}

export default function BezelCard({
  children,
  radius = 26,
  className,
  style,
  innerClassName,
  innerStyle,
}: Props) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255, 255, 255, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow:
          '0 0 0 1px rgba(30, 60, 140, 0.05), 0 18px 40px -14px rgba(46, 91, 217, 0.28)',
        borderRadius: radius,
        padding: BEZEL,
        ...style,
      }}
    >
      <div
        className={innerClassName}
        style={{
          background: '#FFFFFF',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          borderRadius: radius - BEZEL,
          ...innerStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}
