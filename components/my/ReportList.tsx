/**
 * 내 리포트 목록 (PRD 14.13)
 *
 * 무료로 본 결과도 함께 표시합니다. 결제하지 않은 사용자에게도 볼 내용이 있어야 하고,
 * 무료 결과 옆에 결제 유도 버튼이 붙습니다.
 */

import Link from 'next/link'

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

function formatDate(date: string): string {
  return date.replace(/-/g, '.')
}

export default function ReportList({ items }: { items: ReportListItem[] }) {
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
            {!item.isPaid && (
              <span className="ml-1 text-label" style={{ color: 'var(--text-sub)' }}>
                (무료)
              </span>
            )}
          </p>

          <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
            {formatDate(item.examDate)} ·{' '}
            {item.dday >= 0 ? `D-${item.dday}` : `D+${Math.abs(item.dday)}`}
            {item.examDayScore !== null && ` · 운 지수 ${item.examDayScore}`}
          </p>

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

            {item.isPaid && item.reportId && (
              <Link
                href={`/report/${item.reportId}`}
                className="flex min-h-[40px] items-center px-4 text-label font-semibold text-white"
                style={{
                  background: 'var(--button)',
                  borderRadius: 'var(--radius-button)',
                }}
              >
                리포트 보기
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
