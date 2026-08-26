/**
 * 랜딩 캐릭터 애니메이션 (PRD 21.6)
 *
 * GIF 대신 CSS로 움직입니다. 이미지를 몸통과 팔 두 장으로 나눠 팔만 흔들고
 * 몸통은 숨쉬듯 오르내리게 합니다. 투명 배경이 유지되고 용량이 늘지 않으며
 * 어느 크기에서도 선명합니다.
 *
 * 팔 이미지(hero-arm.png)가 아직 없으면 기존 hero.png로 몸통만 표시합니다.
 * 파일을 넣으면 CHARACTER_HERO_BODY / CHARACTER_HERO_ARM만 채우면 됩니다.
 *
 * 움직임을 줄여달라는 설정은 globals.css의 prefers-reduced-motion이 처리합니다.
 */

import Image from 'next/image'

import {
  CHARACTER_HERO,
  CHARACTER_HERO_ARM,
  CHARACTER_HERO_BODY,
  CHARACTER_NAME,
} from '@/lib/content/characters'

interface Props {
  /** 몸통 이미지 폭 (px) */
  size?: number
  className?: string
}

export default function HeroCharacter({ size = 320, className }: Props) {
  const alt = `손을 흔들며 인사하는 ${CHARACTER_NAME}`

  // 팔 이미지가 준비되기 전에는 한 장으로 그립니다
  if (!CHARACTER_HERO_ARM || !CHARACTER_HERO_BODY) {
    return (
      <Image
        src={CHARACTER_HERO}
        alt={alt}
        width={size}
        height={size}
        priority
        className={`hero-body mx-auto h-auto w-[280px] max-w-full sm:w-[320px] ${className ?? ''}`}
      />
    )
  }

  return (
    <div
      className={`relative mx-auto w-[280px] max-w-full sm:w-[320px] ${className ?? ''}`}
      role="img"
      aria-label={alt}
    >
      <Image
        src={CHARACTER_HERO_BODY}
        alt=""
        width={size}
        height={size}
        priority
        aria-hidden
        className="hero-body h-auto w-full"
      />

      {/*
        팔은 어깨 관절이 캔버스 하단 중앙에 오도록 만든 이미지입니다.
        transform-origin이 bottom center이므로 그 자리를 축으로 돕니다.
        위치 값은 이미지가 나오면 실물에 맞춰 조정합니다.
      */}
      <Image
        src={CHARACTER_HERO_ARM}
        alt=""
        width={Math.round(size * 0.3)}
        height={Math.round(size * 0.3)}
        priority
        aria-hidden
        className="hero-arm right-[12%] top-[28%] h-auto w-[30%]"
      />
    </div>
  )
}
