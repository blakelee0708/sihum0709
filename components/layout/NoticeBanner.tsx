'use client'

/**
 * 공지 배너 (PRD 14.5, 22.15)
 *
 * 활성화된 공지가 있으면 홈 최상단에 표시합니다.
 * 장애 발생 시 배너 하나로 문의 대부분을 줄일 수 있습니다.
 *
 * notices 테이블은 클라이언트에서 직접 접근하지 않으므로 (PRD 13.2)
 * 서버 라우트를 거쳐 가져옵니다.
 */

import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'

export default function NoticeBanner() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    fetch('/api/notice')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { message?: string } | null) => {
        if (alive && data?.message) setMessage(data.message)
      })
      .catch(() => {
        // 공지 조회 실패는 조용히 넘어갑니다. 서비스 이용에 지장이 없습니다
      })

    return () => {
      alive = false
    }
  }, [])

  if (!message) return null

  return (
    <div
      role="status"
      className="flex items-start gap-2 px-screen py-3 text-label"
      style={{ background: 'var(--surface)', color: 'var(--text)' }}
    >
      <Megaphone size={16} aria-hidden style={{ color: 'var(--primary)' }} />
      <span>{message}</span>
    </div>
  )
}
