import type { Metadata, Viewport } from 'next'
import { pretendard } from './fonts/pretendard'
import './globals.css'

export const metadata: Metadata = {
  title: '시험사주 · 오늘의 시험운',
  description:
    '생년월일과 시험 날짜로 그날의 흐름을 봅니다. 시험 전 7일 기운, 나에게 맞는 시험 방식, 시작 시간 궁합까지.',
  icons: {
    icon: '/icon-512.png',
    apple: '/apple-icon.png',
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
