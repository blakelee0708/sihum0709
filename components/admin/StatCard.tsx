/** 지표 카드 (PRD 22.5) */

interface Props {
  label: string
  value: string | number
  sub?: string
  /** 처리 필요 항목이 0이 아니면 강조합니다 (PRD 22.5) */
  emphasize?: boolean
}

export default function StatCard({ label, value, sub, emphasize }: Props) {
  return (
    <div
      className="p-card"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        border: emphasize ? '1px solid var(--score-low)' : '1px solid var(--border)',
      }}
    >
      <p className="text-label" style={{ color: 'var(--text-sub)' }}>
        {label}
      </p>
      <p
        className="mt-1 text-score"
        style={{ color: emphasize ? 'var(--score-low)' : 'var(--text)' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
