/**
 * 홈 (탭 1) — PRD 14.4, 14.5
 *
 * 첫 화면을 대화창이 아니라 랜딩으로 두는 이유는 PRD 14.4에 있습니다.
 * 검색 트래픽에서 크롤러가 읽을 텍스트가 필요하고, 990원대 사주와의
 * 차별점을 결과 전에 전달해야 하기 때문입니다.
 */

import Link from 'next/link'

import DiffCards from '@/components/landing/DiffCards'
import Hero from '@/components/landing/Hero'
import Preview from '@/components/landing/Preview'
import UserBlock from '@/components/landing/UserBlock'
import NoticeBanner from '@/components/layout/NoticeBanner'
import Disclaimer from '@/components/layout/Disclaimer'

export default function HomePage() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-md pb-4">
      <NoticeBanner />

      {/* 로그인 상태면 개인화 블록이, 비로그인이면 아무것도 그리지 않습니다 */}
      <UserBlock />

      <Hero />
      <DiffCards />
      <Preview />

      <section className="px-screen pt-section">
        <Link
          href="/start"
          className="flex min-h-[52px] w-full items-center justify-center text-body font-semibold text-white"
          style={{
            background: 'var(--button)',
            borderRadius: 'var(--radius-button)',
            boxShadow: 'var(--shadow-button)',
          }}
        >
          운이랑 이야기하기
        </Link>
        <p
          className="mt-2 text-center text-label"
          style={{ color: 'var(--text-sub)' }}
        >
          로그인 없이 바로 볼 수 있어요
        </p>
      </section>

      <Disclaimer />
    </main>
  )
}
