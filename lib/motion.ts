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
 * 스크롤 리빌 (PRD 21.12, FIX_3 [6]-4)
 *
 * 대화 화면의 0.26초보다 깁니다. 대화는 다음 질문을 기다리는 상황이라
 * 짧아야 하고, 스크롤 리빌은 사용자가 읽으며 내려가는 중이라 조금 더
 * 여유가 있어도 조급해지지 않습니다.
 *
 * duration은 스프링을 쓰지 않는 자리(막대 차트 등)에 남겨 둡니다.
 */
export const REVEAL_DURATION = 0.4

/** 목록에서 카드 하나씩 밀리는 간격 (초) */
export const REVEAL_STAGGER = 0.06

/**
 * 리빌 이동 거리 (FIX_3 [6]-4).
 *
 * 24px에서 32px로 올렸습니다. 24px은 스크롤 중에 눈에 잘 안 들어옵니다.
 * 32px이면 "떠올랐다"가 읽히면서도 레이아웃이 흔들려 보이지는 않습니다.
 */
export const REVEAL_Y = 32

/**
 * 리빌 스프링 (FIX_3 [6]-4).
 *
 * duration 기반 tween에서 물리 기반 스프링으로 바꿨습니다. tween은
 * 끝에서 딱 멈춰 기계적으로 보입니다. 스프링은 도착 직전에 속도가
 * 줄어들어 물건이 놓이는 느낌이 납니다.
 *
 * damping 24는 튕김이 거의 없는 값입니다. 카드가 통통 튀면 읽는 데
 * 방해가 됩니다. 튕겨야 하는 것은 캐릭터뿐입니다.
 */
export const REVEAL_SPRING = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
} as const

/**
 * 히어로 진입 스태거 (FIX_3 [6]-1).
 *
 * 페이지에 들어왔을 때 모든 것이 이미 떠 있으면 아무 일도 일어나지
 * 않은 화면처럼 보입니다. 캐릭터 → 제목 → 설명 → 질문 → 버튼 순으로
 * 0.08초씩 밀어 시선이 위에서 아래로 흐르게 합니다.
 *
 * 다섯 요소 × 0.08 + 시작 지연 0.1 + 스프링 착지까지 0.7초 안에
 * 끝납니다. 버튼이 늦게 나오면 조급한 사용자가 답답해합니다.
 */
export const HERO_STAGGER = 0.08
export const HERO_DELAY = 0.1

export const heroContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: HERO_STAGGER, delayChildren: HERO_DELAY },
  },
}

/**
 * blur가 핵심입니다. 흐릿하다가 선명해지면 같은 이동 거리라도 훨씬
 * 부드럽게 읽힙니다. 대신 비용이 큽니다. 화면에 처음 들어올 때 한 번,
 * 요소 다섯 개에만 씁니다. 스크롤 리빌에는 쓰지 않습니다 (FIX_3 [6]-3).
 */
export const heroItem = {
  hidden: { opacity: 0, y: REVEAL_Y, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: REVEAL_SPRING,
  },
}

/**
 * 캐릭터만 다른 값을 씁니다 (FIX_3 [6]-2).
 *
 * damping 18이면 도착할 때 살짝 튕깁니다. 카드에는 방해지만 캐릭터에는
 * 어울립니다. scale 0.88에서 커지면서 튕기면 "등장"으로 읽힙니다.
 */
export const heroCharacterItem = {
  hidden: { opacity: 0, y: 40, scale: 0.88 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 18 },
  },
}

/**
 * 스크롤 리빌 목록 (FIX_3 [6]-3).
 *
 * 부모에 whileInView, 자식에 variants를 주면 스태거가 자동으로 걸립니다.
 * 자식마다 delay를 계산해 넣는 것보다 순서가 바뀌어도 안 깨집니다.
 *
 * blur는 쓰지 않습니다. 요소가 여러 개 동시에 블러를 벗으면 프레임이
 * 떨어집니다. y와 opacity만 씁니다.
 */
export const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: REVEAL_STAGGER } },
}

export const listItem = {
  hidden: { opacity: 0, y: REVEAL_Y },
  show: { opacity: 1, y: 0, transition: REVEAL_SPRING },
}

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
