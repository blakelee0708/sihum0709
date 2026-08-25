/**
 * 관리자 레이아웃 (PRD 22.1, 22.3)
 *
 * 접근 제어는 middleware.ts가 먼저 하고, 여기서 한 번 더 확인합니다.
 * 미들웨어만 신뢰하지 않습니다.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import AdminSidebar from '@/components/admin/AdminSidebar'
import { getAdmin } from '@/lib/admin/auth'

export const metadata: Metadata = {
  title: '관리자 · 시험사주',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getAdmin()
  if (!admin) redirect('/')

  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row" style={{ background: 'var(--bg)' }}>
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  )
}
