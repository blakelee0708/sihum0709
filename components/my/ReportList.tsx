'use client'

/**
 * 내 리포트 목록 (PRD 14.14)
 *
 * 무료로 본 결과도 함께 표시합니다. 결제하지 않은 사용자에게도 볼 내용이 있어야 하고,
 * 무료 결과 옆에 결제 유도 버튼이 붙습니다.
 *
 * 생성 중인 리포트는 "만들고 있어요"로 표시하고 폴링합니다 (PRD 14.12).
 * 결제 직후 브라우저를 닫은 사용자가 여기서 완성을 확인합니다.
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface ReportListItem {
  queryId: string
  /** 유료 리포트가 있으면 그 id */
  reportId: string | null
  examName: string
  examType: string
  examDate: string
  dday: number
  examDayScore: number | null
  isPaid: boolean
  status?: string | null
}

/** 생성 중인 항목이 있을 때 다시 읽는 주기 (PRD 14.12) */
const POLL_MS = 5000

function formatDate(date: string): string {
  return date.replace(/-/g, '.')
}

export default function ReportList({ items }: { items: ReportListItem[] }) {
  const router = useRouter()
  const hasPending = items.some((i) => i.status === 'pending')

  // 만들고 있는 것이 있을 때만 폴링합니다. 없으면 서버를 두드리지 않습니다.
  useEffect(() => {
    if (!hasPending) return
    const t = setInterval(() => router.refresh(), POLL_MS)
    return () => clearInterval(t)
  }, [hasPending, router])

  if (items.length === 0) {
    return (
      <p
        className="p-card text-body"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          color: 'var(--text-sub)',
        }}
      >
        아직 본 결과가 없어요. 새 시험 탭에서 시작해 보세요.
      </p>
    )
  }

  return (
    <ul className="space-y-card-gap">
      {items.map((item) => (
        <li
          key={item.queryId}
          className="p-card"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <p className="text-card-title">
            {item.examName}
            {!item.isPaid && item.status !== 'pending' && (
              <span className="ml-1 text-label" style={{ color: 'var(--text-sub)' }}>
                (무료)
              </span>
            )}
          </p>

          {item.status === 'pending' ? (
            <p className="mt-1 text-label" style={{ color: 'var(--primary)' }}>
              만들고 있어요...
            </p>
          ) : (
            <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
              {formatDate(item.examDate)} ·{' '}
              {item.dday >= 0 ? `D-${item.dday}` : `D+${Math.abs(item.dday)}`}
              {item.examDayScore !== null && ` · 운 지수 ${item.examDayScore}`}
            </p>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <Link
              href={`/result?q=${item.queryId}`}
              className="flex min-h-[40px] items-center px-4 text-label"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                color: 'var(--text)',
              }}
            >
              결과 보기
            </Link>

            {item.reportId && (item.isPaid || item.status === 'pending') && (
              <Link
                href={`/report/${item.reportId}`}
                className="flex min-h-[40px] items-center px-4 text-label font-semibold text-white"
                style={{
                  background: 'var(--button)',
                  borderRadius: 'var(--radius-button)',
                }}
              >
                {item.status === 'pending' ? '진행 상황 보기' : '리포트 보기'}
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
