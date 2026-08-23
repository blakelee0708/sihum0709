/**
 * 캐릭터와 유형 뱃지 정의 (PRD 7.1 ~ 7.4, 21.5)
 *
 * 캐릭터는 1종("운이")이며 표정만 5단계로 바뀝니다. 결정 기준은 시험 당일 운 지수입니다.
 * 유형 뱃지는 강한 오행으로 결정되며 사용자 고유 정체성을 담당합니다.
 */

import type { Element } from '../saju/constants'

export const CHARACTER_NAME = '운이'

/** PRD 21.5 캐릭터 기본 색상 */
export const CHARACTER_COLOR = '#8ECDF5'

// ─── PRD 7.2 캐릭터 표정 5단계 ───

export interface CharacterStage {
  stage: 1 | 2 | 3 | 4 | 5
  /** 운 지수 하한 (이상) */
  min: number
  /** 운 지수 상한 (이하) */
  max: number
  file: string
  /** 표정 설명 */
  expression: string
  alt: string
}

export const CHARACTER_STAGES: CharacterStage[] = [
  {
    stage: 5,
    min: 80,
    max: 100,
    file: '/character/char-05.png',
    expression: '초승달 눈, 만세, 반짝임',
    alt: '두 팔을 들어 만세하며 활짝 웃는 운이',
  },
  {
    stage: 4,
    min: 65,
    max: 79,
    file: '/character/char-04.png',
    expression: '미소',
    alt: '손을 흔들며 미소 짓는 운이',
  },
  {
    stage: 3,
    min: 50,
    max: 64,
    file: '/character/char-03.png',
    expression: '기본, 차분',
    alt: '차분하게 정면을 보고 있는 운이',
  },
  {
    stage: 2,
    min: 35,
    max: 49,
    file: '/character/char-02.png',
    expression: '살짝 걱정, 처진 눈, 땀방울',
    alt: '살짝 걱정스러운 표정의 운이',
  },
  {
    stage: 1,
    min: 0,
    max: 34,
    file: '/character/char-01.png',
    expression: '결의에 찬 눈, 주먹 쥔 파이팅 자세',
    alt: '주먹을 쥐고 함께 힘내자는 자세의 운이',
  },
]

/** 운 지수로 캐릭터를 고릅니다 */
export function getCharacter(score: number): CharacterStage {
  return (
    CHARACTER_STAGES.find((c) => score >= c.min && score <= c.max) ??
    CHARACTER_STAGES[2]
  )
}

/** 대화창 아바타 (PRD 21.6 char-profile) */
export const CHARACTER_PROFILE = '/character/char-profile.png'

/** 홈 히어로 (PRD 21.12) */
export const CHARACTER_HERO = '/character/hero.png'

// ─── PRD 7.3 유형 뱃지 5종 ───

export interface TypeBadge {
  element: Element
  /** 오행 한자 */
  hanja: string
  /** 1차에는 이모지, 이후 SVG로 교체합니다 (PRD 7.3) */
  icon: string
  /** 아이콘 설명 */
  iconName: string
  /** 유형명 */
  name: string
  color: string
  /** 성격 한 줄 */
  trait: string
  /** CSS 변수명 */
  cssVar: string
}

export const TYPE_BADGES: Record<Element, TypeBadge> = {
  목: {
    element: '목',
    hanja: '木',
    icon: '🌱',
    iconName: '새싹',
    name: '흡수형',
    color: '#4CAF7D',
    trait: '새 내용 습득이 빠름',
    cssVar: '--wood',
  },
  화: {
    element: '화',
    hanja: '火',
    icon: '🔥',
    iconName: '불꽃',
    name: '몰입형',
    color: '#E5533D',
    trait: '붙으면 끝까지 밀어붙임',
    cssVar: '--fire',
  },
  토: {
    element: '토',
    hanja: '土',
    icon: '⛰️',
    iconName: '산',
    name: '지구력형',
    color: '#C9A227',
    trait: '꾸준함, 계획 준수',
    cssVar: '--earth',
  },
  금: {
    element: '금',
    hanja: '金',
    icon: '⚔️',
    iconName: '칼날',
    name: '정리형',
    color: '#8E9AAF',
    trait: '요약과 원칙에 강함',
    cssVar: '--metal',
  },
  수: {
    element: '수',
    hanja: '水',
    icon: '💧',
    iconName: '물방울',
    name: '응용형',
    color: '#3D5AE5',
    trait: '이해와 응용에 강함',
    cssVar: '--water',
  },
}

export function getTypeBadge(strong: Element): TypeBadge {
  return TYPE_BADGES[strong]
}

/**
 * PRD 9.1 공유 이미지 배경 그라데이션.
 * 오행 색상에서 파생합니다.
 */
export function getShareGradient(element: Element): string {
  const c = TYPE_BADGES[element].color
  return `linear-gradient(160deg, ${c}22 0%, ${c}08 60%, #FFFFFF 100%)`
}

/**
 * PRD 7.4 뱃지 디자인 — 배경은 오행 색상 10% 투명도, 테두리 1px.
 */
export function getBadgeStyle(element: Element) {
  const c = TYPE_BADGES[element].color
  return {
    backgroundColor: `${c}1A`, // 10%
    borderColor: c,
    color: c,
  }
}

/**
 * PRD 7.5 "전체 이용자 중 N%" — 데이터가 충분히 쌓인 후 활성화합니다.
 * 초기에는 숨깁니다.
 */
export const SHOW_TYPE_DISTRIBUTION = false

/** 활성화 시 주 1회 갱신해 넣을 값 (PRD 22.12) */
export const TYPE_DISTRIBUTION: Record<Element, number> | null = null
