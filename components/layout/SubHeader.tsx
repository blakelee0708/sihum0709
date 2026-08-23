'use client'

/** 마이페이지 하위 화면 헤더 (PRD 14.2 — 탭바를 숨기고 뒤로가기로 돌아옵니다) */

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function SubHeader({ title }: { title: string }) {
  const router = useRouter()

  return (
    <header className="flex items-center gap-1 px-2 py-2">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="뒤로"
        className="flex h-11 w-11 items-center justify-center"
        style={{ color: 'var(--text)' }}
      >
        <ChevronLeft size={24} aria-hidden />
      </button>
      <h1 className="text-card-title">{title}</h1>
    </header>
  )
}
