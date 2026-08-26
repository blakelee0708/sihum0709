/**
 * 모션 값 (PRD 14.6)
 *
 * 0.26초가 상한입니다. 더 느리면 9단계를 거치는 동안 기다리는 느낌이 누적됩니다.
 * 값을 임의로 바꾸지 마십시오.
 */

export const EASE = [0.22, 1, 0.36, 1] as const

/** 합격이 말풍선 등장 */
export const bubbleMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.26, ease: EASE },
}

/** 사용자 답변 말풍선 */
export const answerMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.26, ease: EASE },
}

/** 선택지 순차 등장 */
export function optionMotion(index: number) {
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, delay: index * 0.045, ease: EASE },
  }
}

/** 말풍선 표시 후 선택지가 뜨기까지 */
export const OPTION_DELAY_MS = 260

/** 선택 후 다음 질문까지 */
export const NEXT_QUESTION_DELAY_MS = 320
