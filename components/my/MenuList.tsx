import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

/** 마이페이지 메뉴 묶음 (PRD 14.13, 14.14) */

export interface MenuItem {
  label: string
  href: string
}

export default function MenuList({ items }: { items: MenuItem[] }) {
  return (
    <ul
      className="overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {items.map((item, i) => (
        <li
          key={item.href}
          style={{ borderTop: i === 0 ? undefined : '1px solid var(--border)' }}
        >
          <Link
            href={item.href}
            className="flex min-h-[52px] items-center justify-between px-card text-body"
          >
            {item.label}
            <ChevronRight size={18} aria-hidden style={{ color: 'var(--text-sub)' }} />
          </Link>
        </li>
      ))}
    </ul>
  )
}
