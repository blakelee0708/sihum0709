/**
 * 모션 값 (PRD 14.6)
 *
 * 0.26초가 상한입니다. 더 느리면 9단계를 거치는 동안 기다리는 느낌이 누적됩니다.
 * 값을 임의로 바꾸지 마십시오.
 */

export const EASE = [0.22, 1, 0.36, 1] as const

/**
 * 합격이 말풍선 등장.
 *
 * 한 질문이 말풍선 여러 개로 나뉘므로 순서를 받습니다. 동시에 뜨면
 * 나눈 의미가 없습니다.
 *
 * 간격은 0.32초입니다. 더 짧으면 세 개가 한 덩어리로 보이고, 더 길면
 * 9단계를 거치는 동안 기다리는 느낌이 쌓입니다.
 */
export const BUBBLE_STAGGER = 0.32

export function bubbleMotion(index = 0) {
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.26, delay: index * BUBBLE_STAGGER, ease: EASE },
  }
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

/**
 * 스크롤 리빌 (PRD 21.12)
 *
 * 대화 화면의 0.26초보다 깁니다. 대화는 다음 질문을 기다리는 상황이라
 * 짧아야 하고, 스크롤 리빌은 사용자가 읽으며 내려가는 중이라 조금 더
 * 여유가 있어도 조급해지지 않습니다.
 */
export const REVEAL_DURATION = 0.4

/** 목록에서 카드 하나씩 밀리는 간격 (초) */
export const REVEAL_STAGGER = 0.06

/**
 * 화면 아래 경계에서 이만큼 들어온 뒤에 시작합니다.
 *
 * 경계에서 바로 시작하면 스크롤이 빠를 때 이미 다 보이는 카드가 뒤늦게
 * 떠오릅니다.
 */
export const REVEAL_MARGIN = '-60px'

/**
 * 눌림 반응 (PRD 21.12)
 *
 * 모바일에는 hover가 없습니다. 손가락이 화면을 덮고 있어서 눌렸다는 것을
 * 알려줄 시각 신호가 이것뿐입니다. 반응이 없으면 안 눌렸다고 생각하고
 * 한 번 더 누릅니다.
 *
 * 0.97은 눈에 보이되 레이아웃이 흔들리지 않는 선입니다.
 */
export const TAP_SCALE = 0.97

/**
 * 페이지 전환 (PRD 21.12)
 *
 * 카드 리빌은 24px이지만 화면 전체가 그만큼 움직이면 멀미가 납니다.
 * 절반만 씁니다.
 */
export const PAGE_ENTER_Y = 12
export const PAGE_ENTER_DURATION = 0.3
