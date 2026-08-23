/** 리포트 섹션 (PRD 14.11) */

interface Props {
  index: number
  title: string
  body?: string
  highlight?: boolean
  children?: React.ReactNode
}

export default function ReportSection({
  index,
  title,
  body,
  highlight,
  children,
}: Props) {
  return (
    <section
      className="p-card"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        border: highlight ? '1px solid var(--primary)' : undefined,
      }}
    >
      <h2 className="text-card-title">
        {!highlight && (
          <span className="mr-1" style={{ color: 'var(--primary)' }}>
            {index}.
          </span>
        )}
        {title}
      </h2>

      {body && (
        <div className="mt-3 space-y-3">
          {body.split('\n\n').map((p, i) => (
            <p key={i} className="text-body">
              {p}
            </p>
          ))}
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}
    </section>
  )
}
