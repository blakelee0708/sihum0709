/**
 * 홈 (탭 1) — PRD 14.4, 14.5, FIX_5
 *
 * 첫 화면을 대화창이 아니라 랜딩으로 두는 이유는 PRD 14.4에 있습니다.
 * 검색 트래픽에서 크롤러가 읽을 텍스트가 필요하고, 990원대 사주와의
 * 차별점을 결과 전에 전달해야 하기 때문입니다.
 *
 * ── 서버 컴포넌트로 둡니다 ──
 *
 * 본문이 HTML에 그대로 실려야 크롤러가 읽습니다. 움직이는 부분만
 * 클라이언트 컴포넌트로 떼어 냈습니다(RiseEffects · StartCta · CountUp).
 *
 * ── 레이아웃 기준 ──
 *
 * 참고 시안 landing-reference.html과 같은 값을 씁니다. 섹션 간격은
 * 시안의 margin 값을 그대로 옮겼습니다(112px · 76px · 76px · 40px).
 * 좌우 여백은 섹션마다 12px, 글만 있는 블록은 20px입니다.
 */

import type { Metadata } from 'next'

import DiffCards from '@/components/landing/DiffCards'
import Hero from '@/components/landing/Hero'
import Marquee from '@/components/landing/Marquee'
import Preview from '@/components/landing/Preview'
import Rise from '@/components/landing/Rise'
import RiseEffects from '@/components/landing/RiseEffects'
import StartCta from '@/components/landing/StartCta'
import UserBlock from '@/components/landing/UserBlock'
import NoticeBanner from '@/components/layout/NoticeBanner'
import Disclaimer from '@/components/layout/Disclaimer'

export const metadata: Metadata = {
  title: '시험사주 · 시험 보는 날 내 기운은 어떨까?',
  description:
    '생년월일과 시험 날짜만 넣으면 그날의 기운을 봅니다. 시험 당일 행운의 찍기 번호, 사주 오행으로 본 면접 예상 질문까지 로그인 없이 무료로 확인하세요.',
  alternates: { canonical: '/' },
}

/** 랜딩 루트 id. RiseEffects가 이 id로 찾아 등장 효과를 켭니다 */
const ROOT_ID = 'landing'

/**
 * 검색 결과에 서비스 정보가 함께 노출되도록 구조화 데이터를 넣습니다 (PRD 14.4).
 * 오락 목적 서비스이므로 결과를 보장하는 표현은 넣지 않습니다 (PRD 18.1).
 */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '시험사주',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  inLanguage: 'ko-KR',
  description:
    '생년월일과 시험 정보를 입력받아 사주 기반의 시험 대비 운세와 준비 가이드를 제공하는 참고 서비스입니다.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
    description: '무료 결과는 로그인 없이 이용할 수 있습니다.',
  },
}

export default function HomePage() {
  return (
    <main
      id={ROOT_ID}
      className="landing mx-auto min-h-[100dvh] max-w-md"
      style={{ padding: '40px 0 30px' }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* 종이 질감. 고정 레이어라 스크롤해도 다시 칠하지 않습니다 */}
      <div className="landing-grain" aria-hidden />

      <RiseEffects rootId={ROOT_ID} />

      <NoticeBanner />

      {/* 로그인 상태면 개인화 블록이, 비로그인이면 아무것도 그리지 않습니다 */}
      <UserBlock />

      <Hero />
      <Marquee />
      <DiffCards />
      <Preview />

      <Rise style={{ marginTop: 40, padding: '0 20px' }}>
        <StartCta place="bottom" />
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

      {/* FIX_5 [6]에서 사업자 정보를 담은 푸터로 교체합니다 */}
      <Disclaimer />
    </main>
  )
}
