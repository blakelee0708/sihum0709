/**
 * 스크롤 등장 래퍼 (FIX_5 [7]-1)
 *
 * 아래에서 흐릿하게 올라오며 선명해집니다. 값은 globals.css의 `.rise`에
 * 있습니다(26px · blur 6px · 0.9초).
 *
 * ── 왜 framer-motion이 아니라 CSS인가 ──
 *
 * framer-motion의 whileInView는 initial 상태를 서버 렌더에도 인라인
 * 스타일로 찍습니다. 자바스크립트가 늦거나 꺼진 환경에서 랜딩이 통째로
 * 투명한 채 남습니다. 랜딩은 검색 유입이 들어오는 화면이라 그 위험을
 * 지지 않습니다 (FIX_5 [7]-1 "서버 렌더 시 빈 화면 금지").
 *
 * 숨김 규칙은 `.landing.js .rise`에만 걸려 있고, `js` 클래스는
 * RiseEffects가 마운트된 뒤에 붙입니다. 스크립트가 돌지 않으면 아무것도
 * 숨지 않습니다.
 *
 * 서버 컴포넌트입니다. 클래스만 붙일 뿐 상태가 없습니다.
 */

import type { CSSProperties, ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** 순차 등장용 지연 (초) */
  delay?: number
  className?: string
  style?: CSSProperties
  as?: 'div' | 'section' | 'h2'
}

export default function Rise({
  children,
  delay,
  className,
  style,
  as: Component = 'div',
}: Props) {
  return (
    <Component
      className={className ? `rise ${className}` : 'rise'}
      style={delay ? { transitionDelay: `${delay}s`, ...style } : style}
    >
      {children}
    </Component>
  )
}
