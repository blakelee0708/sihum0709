import localFont from 'next/font/local'

/* PRD 21.3 — 공유 이미지 캡처 시 외부 폰트가 깨지므로 self-host 한다 */
export const pretendard = localFont({
  src: [
    { path: './Pretendard-Regular.woff2', weight: '400', style: 'normal' },
    { path: './Pretendard-Medium.woff2', weight: '500', style: 'normal' },
    { path: './Pretendard-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: './Pretendard-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-pretendard',
  display: 'swap',
})
