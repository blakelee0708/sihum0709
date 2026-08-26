'use client'

/**
 * prefers-reduced-motion을 반영한 모션 값 (FIX_3 [11])
 *
 * lib/motion.ts의 값들은 순수 상수와 함수입니다. 서버 컴포넌트도 그
 * 파일에서 값을 읽으므로(예: ResultCard의 지연 시간) framer-motion을
 * 런타임으로 import할 수 없습니다. 훅이 필요한 쪽은 이 클라이언트
 * 모듈로 뺍니다.
 *
 * 줄여달라고 한 사람에게는 애니메이션 없이 최종 상태로 바로 그립니다.
 * opacity 0이나 scale 0.3에서 멈춰 내용이 안 보이는 사고를 막으려고
 * initial 자체를 false로 둡니다.
 */

import { useReducedMotion } from 'framer-motion'

import {
  answerMotion,
  avatarPop,
  bubbleMotion,
  optionMotion,
} from '@/lib/motion'

/** 모션을 끌 때 쓰는 최종 상태 */
const STATIC = {
  initial: false as const,
  animate: { opacity: 1, x: 0, y: 0, scale: 1 },
}

/** 대화 선택지·입력 위젯 등장 */
export function useOptionMotion() {
  const shouldReduceMotion = useReducedMotion()
  return (index: number, selected = false) =>
    shouldReduceMotion ? STATIC : optionMotion(index, selected)
}

/** 합격이 말풍선 등장 */
export function useBubbleMotion() {
  const shouldReduceMotion = useReducedMotion()
  return (index = 0) => (shouldReduceMotion ? STATIC : bubbleMotion(index))
}

/** 사용자 답변 말풍선 등장 */
export function useAnswerMotion() {
  const shouldReduceMotion = useReducedMotion()
  return shouldReduceMotion ? STATIC : answerMotion
}

/** 프로필 아이콘 움찔. 끄면 undefined를 돌려줍니다 */
export function useAvatarPop() {
  const shouldReduceMotion = useReducedMotion()
  return shouldReduceMotion ? undefined : avatarPop
}
