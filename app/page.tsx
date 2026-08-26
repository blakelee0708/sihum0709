/**
 * 홈 (탭 1) — PRD 14.4, 14.5
 *
 * 첫 화면을 대화창이 아니라 랜딩으로 두는 이유는 PRD 14.4에 있습니다.
 * 검색 트래픽에서 크롤러가 읽을 텍스트가 필요하고, 990원대 사주와의
 * 차별점을 결과 전에 전달해야 하기 때문입니다.
 */

import type { Metadata } from 'next'

import CtaLink from '@/components/landing/CtaLink'
import DiffCards from '@/components/landing/DiffCards'
import Hero from '@/components/landing/Hero'
import Marquee from '@/components/landing/Marquee'
import Preview from '@/components/landing/Preview'
import UserBlock from '@/components/landing/UserBlock'
import NoticeBanner from '@/components/layout/NoticeBanner'
import Disclaimer from '@/components/layout/Disclaimer'

export const metadata: Metadata = {
  title: '시험사주 · 시험 보는 날 내 기운은 어떨까?',
  description:
    '생년월일과 시험 날짜만 넣으면 그날의 기운을 봅니다. 시험 전 7일 흐름, 나에게 맞는 시험 방식, 시작 시간 궁합까지 로그인 없이 무료로 확인하세요.',
  alternates: { canonical: '/' },
}

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
    <main className="mx-auto min-h-[100dvh] max-w-md pb-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <NoticeBanner />

      {/* 로그인 상태면 개인화 블록이, 비로그인이면 아무것도 그리지 않습니다 */}
      <UserBlock />

      <Hero />
      <Marquee />
      <DiffCards />
      <Preview />

      <section className="px-screen pt-section">
        {/* 히어로와 같은 문구로 통일합니다 (FIX_3 [4]-1) */}
        <CtaLink href="/start">합격이에게 내 시험운 물어보기</CtaLink>
        <p
          className="mt-2 text-center text-label"
          style={{ color: 'var(--text-sub)' }}
        >
          1분이면 끝나요 · 로그인 없이
        </p>
      </section>

      <Disclaimer />
    </main>
  )
}
