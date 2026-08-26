import type { Metadata, Viewport } from 'next'
import { pretendard } from './fonts/pretendard'
import './globals.css'
import TabBar, { TabBarSpacer } from '@/components/layout/TabBar'
import { getSiteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
  // 빈 환경변수를 그대로 new URL에 넣으면 빌드가 죽습니다 (lib/site-url.ts)
  metadataBase: new URL(getSiteUrl()),
  title: '시험사주 · 오늘의 시험운',
  description:
    '생년월일과 시험 날짜로 그날의 흐름을 봅니다. 시험 전 7일 기운, 나에게 맞는 시험 방식, 시작 시간 궁합까지.',
  icons: {
    icon: '/icon-512.png',
    apple: '/apple-icon.png',
  },
  keywords: [
    '시험사주', '시험운', '사주', '만세력', '공무원 시험', '면접운',
    '수능 사주', '시험 날짜', '오늘의 운세',
  ],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '시험사주',
    title: '시험 보는 날, 내 기운은 어떨까?',
    description:
      '생년월일과 시험 날짜로 그날의 흐름을 봅니다. 시험 전 7일 기운, 나에게 맞는 시험 방식, 시작 시간 궁합까지.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '시험 보는 날, 내 기운은 어떨까?',
    description: '생년월일과 시험 날짜로 그날의 흐름을 봅니다.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#E8F0FF',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="font-sans antialiased">
        {children}
        <TabBarSpacer />
        <TabBar />
      </body>
    </html>
  )
}
