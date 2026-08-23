'use client'

/**
 * 하단 탭바 (PRD 14.1, 14.2)
 *
 * 탭은 3개이며, 이탈하면 안 되는 화면에서는 숨깁니다.
 * 우측 상단 프로필 아이콘은 두지 않습니다. 마이페이지가 탭에 있어 중복입니다.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, User } from 'lucide-react'

const TABS = [
  { href: '/', label: '홈', Icon: Home },
  { href: '/start', label: '새 시험', Icon: Plus },
  { href: '/my', label: '마이페이지', Icon: User },
] as const

/**
 * PRD 14.2 탭바 표시 규칙
 *
 * 보임  홈 / 마이페이지 / 무료 결과 / 유료 리포트
 * 숨김  입력 진행 중 / 로그인 / 결제 / 마이페이지 하위 화면
 */
export function shouldShowTabBar(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname === '/my') return true
  if (pathname === '/result') return true
  if (pathname.startsWith('/report/')) return true
  return false
}

export default function TabBar() {
  const pathname = usePathname()

  if (!shouldShowTabBar(pathname)) return null

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1"
                style={{ color: active ? 'var(--primary)' : 'var(--text-sub)' }}
              >
                <Icon size={22} aria-hidden />
                <span className="text-label">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** 탭바가 보이는 화면에서 콘텐츠가 가려지지 않도록 두는 여백 */
export function TabBarSpacer() {
  const pathname = usePathname()
  if (!shouldShowTabBar(pathname)) return null
  return <div aria-hidden className="h-[72px]" />
}
