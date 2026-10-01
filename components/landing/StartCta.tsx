'use client'

/**
 * 시작 버튼 (FIX_5 [2]-3)
 *
 * 완전히 둥근 알약 안에서 글자는 가운데, 화살표 원은 오른쪽 끝에 따로
 * 붙습니다. 좌우 패딩을 56px로 잡아 글자가 원과 겹치지 않게 합니다.
 *
 * 눌림(scale 0.97)과 화살표 반응은 CSS에서 처리합니다(globals.css `.cta`).
 * framer-motion을 쓰지 않는 이유는, 전환 곡선이 시안에 고정돼 있고
 * JS 없이도 같은 반응이 나와야 하기 때문입니다.
 *
 * 계측 때문에 클라이언트 컴포넌트입니다. 히어로와 하단에 같은 버튼이
 * 두 번 나오므로 어느 쪽을 눌렀는지 함께 남깁니다.
 */

import Link from 'next/link'

import { track } from '@/lib/analytics'

interface Props {
  /** 위치 구분용. 계측에만 씁니다 */
  place: 'hero' | 'bottom'
  href?: string
}

export default function StartCta({ place, href = '/start' }: Props) {
  return (
    <Link
      className="cta"
      href={href}
      onClick={() => track('landing_cta_click', { place })}
    >
      <span style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 600 }}>
        합격이에게 내 시험운 물어보기
      </span>
      <span className="arw">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 17L17 7M9 7h8v8" />
        </svg>
      </span>
    </Link>
  )
}
