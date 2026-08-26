/**
 * 홈 히어로 (PRD 14.4, FIX_3 [6]-1, [6]-2, [7]-3)
 *
 * 버튼은 스크롤 없이 보이는 위치에 둡니다.
 * 문구를 "합격이에게 내 시험운 물어보기"로 해서 다음 화면에 무엇이 나올지
 * 예고합니다. "이야기하기"만으로는 무엇을 이야기하는지가 빠집니다.
 *
 * 버튼 바로 위 "내 시험운은 어떨까?"는 설명이 아니라 질문입니다.
 * 위쪽 문구가 서비스가 무엇을 하는지 말한다면, 이 줄은 그래서 지금
 * 누르라는 신호입니다. 버튼과 한 덩어리로 읽히도록 간격을 좁게 둡니다.
 *
 * ── 진입 스태거 ──
 *
 * 캐릭터 → 제목 → 설명 → 질문 → 버튼 순으로 0.08초씩 밀어 올립니다.
 * 진입 애니메이션이 없으면 페이지에 들어왔을 때 모든 것이 이미 떠 있어
 * 아무 일도 일어나지 않은 화면처럼 보입니다. 값은 lib/motion.ts에
 * 모여 있습니다.
 *
 * 캐릭터만 다른 값을 씁니다. damping 18이라 도착할 때 살짝 튕깁니다.
 */

'use client'

import { motion, useReducedMotion } from 'framer-motion'

import HeroCharacter from './HeroCharacter'
import { MotionLink, useTap } from '@/components/motion/Pressable'
import ShineOverlay from '@/components/motion/ShineOverlay'
import { BREATHE, heroCharacterItem, heroContainer, heroItem } from '@/lib/motion'
import { track } from '@/lib/analytics'

export default function Hero() {
  const tap = useTap()
  const shouldReduceMotion = useReducedMotion()

  // 움직임을 줄여달라고 한 경우 진입 애니메이션 없이 최종 상태로 그립니다
  const stagger = shouldReduceMotion
    ? {}
    : { variants: heroContainer, initial: 'hidden' as const, animate: 'show' as const }
  const item = shouldReduceMotion ? {} : { variants: heroItem }
  const character = shouldReduceMotion ? {} : { variants: heroCharacterItem }

  return (
    <motion.section className="px-screen pt-6 text-center" {...stagger}>
      <motion.div {...character}>
        <HeroCharacter />
      </motion.div>

      <motion.h1 className="mt-2 text-headline" {...item}>
        시험 보는 날,
        <br />내 기운은 어떨까?
      </motion.h1>

      <motion.p className="mt-3 text-body" style={{ color: 'var(--text-sub)' }} {...item}>
        생년월일과 시험 날짜로
        <br />
        그날의 흐름을 봅니다
      </motion.p>

      <motion.p className="mt-6 text-body font-semibold" {...item}>
        내 시험운은 어떨까?
      </motion.p>

      <motion.div {...item} className="mt-2">
        <MotionLink
          href="/start"
          onClick={() => track('landing_cta_click')}
          whileTap={tap}
          // 숨쉬기는 버튼 자신이, 진입은 감싼 div가 맡습니다. 한 요소에
          // 둘을 걸면 같은 scale을 두고 다툽니다
          animate={shouldReduceMotion ? undefined : BREATHE.animate}
          transition={shouldReduceMotion ? undefined : BREATHE.transition}
          className="relative flex min-h-[52px] w-full items-center justify-center overflow-hidden text-body font-semibold text-white"
          style={{
            background: 'var(--button)',
            borderRadius: 'var(--radius-button)',
            boxShadow: 'var(--shadow-button)',
          }}
        >
          합격이에게 내 시험운 물어보기
          <ShineOverlay />
        </MotionLink>
      </motion.div>

      <motion.p
        className="mt-2 text-label"
        style={{ color: 'var(--text-sub)' }}
        {...item}
      >
        1분이면 끝나요 · 로그인 없이
      </motion.p>
    </motion.section>
  )
}
