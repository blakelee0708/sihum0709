/**
 * 홈 히어로 (PRD 14.4, FIX_5 [2])
 *
 * ── 부제를 바꾼 이유 ──
 *
 * "생년월일과 시험 날짜로 그날의 흐름을 봅니다"는 입력을 설명합니다.
 * 사용자가 알고 싶은 것은 무엇을 받는지입니다. 찍기 번호와 면접 질문을
 * 앞에 둡니다 (FIX_5 [2]-1).
 *
 * ── 합격이가 카드 뒤에서 올라옵니다 (FIX_5 [2]-2 개정) ──
 *
 * 처음에는 합격이를 카드 왼쪽에 나란히 뒀습니다. 그러면 카드가 쓸 수 있는
 * 폭이 그만큼 줄어 타일 안 정보가 빽빽해집니다. 지금은 카드를 화면 폭으로
 * 펴고, 합격이는 카드 뒤에서 머리와 손만 내밀게 합니다.
 *
 * 구조가 세 겹입니다.
 *
 *   무대      높이 118px. 합격이가 설 자리를 비워 둡니다
 *   잘림 영역  overflow: hidden. 아래 8px이 카드와 겹쳐서, 잘린 경계선이
 *             카드에 가려 보이지 않습니다
 *   카드      z-index 2. 합격이보다 위에 그려져야 "뒤에서" 올라옵니다
 *
 * 등장 순서와 값은 globals.css의 hero-card / hero-halo / hero-char에
 * 있습니다. `.go`는 RiseEffects가 붙입니다.
 *
 * 서버 컴포넌트입니다. 움직이는 부분(버튼 계측, 숫자 카운트업)만
 * 클라이언트 컴포넌트로 들어갑니다.
 */

import Image from 'next/image'

import BezelCard from './BezelCard'
import HeroResultCard from './HeroResultCard'
import Rise from './Rise'
import StartCta from './StartCta'
import { CHARACTER_HERO, CHARACTER_NAME } from '@/lib/content/characters'

/** RiseEffects가 이 id를 찾아 등장 순서를 켭니다 */
export const HERO_STAGE_ID = 'heroStage'

export default function Hero() {
  return (
    <>
      <Rise>
        <h1
          style={{
            margin: '0 0 16px',
            padding: '0 22px',
            textAlign: 'center',
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.035em',
            color: 'var(--ink)',
          }}
        >
          시험 보는 날,
          <br />내 기운은 어떨까?
        </h1>

        <p
          style={{
            margin: '0 0 8px',
            padding: '0 20px',
            textAlign: 'center',
            fontSize: 13,
            lineHeight: 1.65,
            color: 'var(--ink-sub)',
          }}
        >
          시험 당일, 행운의 찍기 번호를
          <br />
          본인 사주로 알려드려요
        </p>

        <p
          style={{
            margin: '0 0 26px',
            padding: '0 20px',
            textAlign: 'center',
            fontSize: 13,
            lineHeight: 1.65,
            color: 'var(--ink-sub)',
          }}
        >
          내 기운, 사주오행에 따라 받을 수 있는
          <br />
          면접 질문을 알려드려요
        </p>
      </Rise>

      {/*
        여기는 Rise로 감싸지 않습니다. 카드와 합격이가 각자 다른 시각에
        움직여야 해서 순서를 CSS가 직접 잡습니다.
      */}
      <div
        id={HERO_STAGE_ID}
        style={{ position: 'relative', padding: '0 16px', marginBottom: 30 }}
      >
        {/* 합격이 무대 */}
        <div style={{ position: 'relative', height: 118 }}>
          {/*
            잘림 영역. 아래 8px이 카드 영역으로 내려가 있고 카드가 그 위에
            그려지므로, 합격이가 잘린 선이 카드 테두리에 가려집니다.
          */}
          <div
            style={{
              position: 'absolute',
              right: 26,
              bottom: -8,
              width: 130,
              height: 150,
              overflow: 'hidden',
            }}
          >
            <div
              className="hero-halo"
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -30,
                height: 150,
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 70%)',
              }}
            />

            <Image
              className="hero-char"
              src={CHARACTER_HERO}
              alt={`카드 뒤에서 올라오는 ${CHARACTER_NAME}`}
              width={220}
              height={220}
              priority
              style={{
                position: 'absolute',
                left: 10,
                bottom: -34,
                width: 110,
                height: 'auto',
              }}
            />
          </div>
        </div>

        <BezelCard
          className="hero-card"
          radius={24}
          style={{ position: 'relative', zIndex: 2 }}
          innerStyle={{ overflow: 'hidden' }}
        >
          <HeroResultCard />
        </BezelCard>
      </div>

      <Rise delay={0.16} style={{ padding: '0 20px' }}>
        <StartCta place="hero" />
        <p
          style={{
            margin: '11px 0 0',
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--ink-sub)',
          }}
        >
          1분이면 끝나요 · 로그인 없이
        </p>
      </Rise>
    </>
  )
}
