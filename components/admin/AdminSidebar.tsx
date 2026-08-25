'use client'

/** 관리자 사이드바 (PRD 22.4 화면 목록) */

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MENU = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/reports', label: '리포트 관리' },
  { href: '/admin/payments', label: '결제 관리' },
  { href: '/admin/users', label: '회원 관리' },
  { href: '/admin/inquiries', label: '문의 관리' },
  { href: '/admin/grant', label: '무료 지급 · 쿠폰' },
  { href: '/admin/stats', label: '지표' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="관리자 메뉴"
      className="flex gap-1 overflow-x-auto border-b px-4 py-2 md:sticky md:top-0 md:h-[100dvh] md:w-52 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:py-4"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <p className="hidden px-3 pb-3 text-label md:block" style={{ color: 'var(--text-sub)' }}>
        시험사주 관리자
      </p>

      {MENU.map((m) => {
        const active = m.href === '/admin' ? pathname === '/admin' : pathname.startsWith(m.href)
        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={active ? 'page' : undefined}
            className="flex min-h-[40px] shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-body"
            style={{
              background: active ? 'var(--bg)' : 'transparent',
              color: active ? 'var(--primary)' : 'var(--text)',
              fontWeight: active ? 600 : 400,
            }}
          >
            {m.label}
          </Link>
        )
      })}

      <Link
        href="/"
        className="mt-auto hidden min-h-[40px] items-center px-3 text-label md:flex"
        style={{ color: 'var(--text-sub)' }}
      >
        서비스로 돌아가기
      </Link>
    </nav>
  )
}
