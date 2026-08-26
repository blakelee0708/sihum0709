/**
 * 홈 히어로 (PRD 14.4)
 *
 * 버튼은 스크롤 없이 보이는 위치에 둡니다.
 * 문구를 "합격이랑 이야기하기"로 해서 다음 화면에 무엇이 나올지 예고합니다.
 *
 * 버튼 바로 위 "내 시험운은 어떨까?"는 설명이 아니라 질문입니다.
 * 위쪽 문구가 서비스가 무엇을 하는지 말한다면, 이 줄은 그래서 지금
 * 누르라는 신호입니다. 버튼과 한 덩어리로 읽히도록 간격을 좁게 둡니다.
 */

'use client'

import HeroCharacter from './HeroCharacter'
import { MotionLink, useTap } from '@/components/motion/Pressable'
import { track } from '@/lib/analytics'

export default function Hero() {
  const tap = useTap()

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

      <p className="mt-6 text-body font-semibold">내 시험운은 어떨까?</p>

      <MotionLink
        href="/start"
        onClick={() => track('landing_cta_click')}
        whileTap={tap}
        className="mt-2 flex min-h-[52px] w-full items-center justify-center text-body font-semibold text-white"
        style={{
          background: 'var(--button)',
          borderRadius: 'var(--radius-button)',
          boxShadow: 'var(--shadow-button)',
        }}
      >
        합격이랑 이야기하기
      </MotionLink>

      <p className="mt-2 text-label" style={{ color: 'var(--text-sub)' }}>
        1분이면 끝나요
      </p>
    </section>
  )
}
