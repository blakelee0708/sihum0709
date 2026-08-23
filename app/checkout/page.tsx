/** 결제 (PRD 12장). 탭바는 숨깁니다 (PRD 14.2) */

import type { Metadata } from 'next'
import { Suspense } from 'react'

import CheckoutView from './CheckoutView'

export const metadata: Metadata = { title: '결제 · 시험사주' }

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  return (
    <Suspense>
      <CheckoutView queryId={q ?? null} />
    </Suspense>
  )
}
