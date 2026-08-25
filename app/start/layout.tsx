import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '시험 정보 입력 · 시험사주',
  description:
    '운이가 묻는 대로 답하면 1분 안에 끝납니다. 대분류, 시험명, 날짜, 생년월일만 있으면 결과가 나옵니다.',
  alternates: { canonical: '/start' },
}

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return children
}
