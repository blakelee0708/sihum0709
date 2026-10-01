/**
 * 홈 히어로 (PRD 14.4, FIX_5 [2])
 *
 * 제목 → 합격이와 결과 카드 → 시작 버튼 순으로 0.08초씩 밀어 올립니다
 * (FIX_5 [7]-1). 등장은 Rise가, 합격이의 숨쉬기는 CSS가 맡습니다.
 *
 * ── 부제를 바꾼 이유 ──
 *
 * "생년월일과 시험 날짜로 그날의 흐름을 봅니다"는 입력을 설명합니다.
 * 사용자가 알고 싶은 것은 무엇을 받는지입니다. 찍기 번호와 면접 질문을
 * 앞에 둡니다 (FIX_5 [2]-1).
 *
 * ── 합격이와 카드를 나란히 ──
 *
 * 전에는 캐릭터가 폭 280px로 혼자 한 줄을 차지했습니다. 첫 화면에서
 * 버튼까지 내려가려면 스크롤이 필요했습니다. 94px로 줄여 결과 카드와
 * 나란히 두면 제목·결과·버튼이 한 화면에 들어옵니다.
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

      <Rise
        delay={0.08}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          marginBottom: 30,
        }}
      >
        {/*
          후광. 캐릭터 뒤에 흰 원을 깔아 배경에서 떼어 놓습니다.
          그라데이션이라 가장자리가 보이지 않습니다.
        */}
        <div
          style={{
            flex: '0 0 106px',
            height: 166,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background:
              'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.6) 42%, rgba(255,255,255,0) 70%)',
          }}
        >
          <Image
            src={CHARACTER_HERO}
            alt={`손을 흔드는 ${CHARACTER_NAME}`}
            width={188}
            height={188}
            priority
            className="hero-body"
            style={{ width: 94, height: 'auto', display: 'block' }}
          />
        </div>

        <BezelCard
          radius={24}
          style={{ flex: 1, minWidth: 0 }}
          innerStyle={{ overflow: 'hidden' }}
        >
          <HeroResultCard />
        </BezelCard>
      </Rise>

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
