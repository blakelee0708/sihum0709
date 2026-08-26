/**
 * 홈 히어로 (PRD 14.4)
 *
 * 버튼은 스크롤 없이 보이는 위치에 둡니다.
 * 문구를 "합격이랑 이야기하기"로 해서 다음 화면에 무엇이 나올지 예고합니다.
 */

'use client'

import Link from 'next/link'

import HeroCharacter from './HeroCharacter'
import { track } from '@/lib/analytics'

export default function Hero() {
  return (
    <section className="px-screen pt-6 text-center">
      <HeroCharacter />

      <h1 className="mt-2 text-headline">
        시험 보는 날,
        <br />내 기운은 어떨까?
      </h1>

      <p className="mt-3 text-body" style={{ color: 'var(--text-sub)' }}>
        생년월일과 시험 날짜로
        <br />
        그날의 흐름을 봅니다
      </p>

      <Link
        href="/start"
        onClick={() => track('landing_cta_click')}
        className="mt-6 flex min-h-[52px] w-full items-center justify-center text-body font-semibold text-white"
        style={{
          background: 'var(--button)',
          borderRadius: 'var(--radius-button)',
          boxShadow: 'var(--shadow-button)',
        }}
      >
        합격이랑 이야기하기
      </Link>

      <p className="mt-2 text-label" style={{ color: 'var(--text-sub)' }}>
        1분이면 끝나요
      </p>
    </section>
  )
}
