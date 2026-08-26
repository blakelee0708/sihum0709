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

      {body && <ReportBody body={body} />}

      {children && <div className="mt-3">{children}</div>}
    </section>
  )
}

/**
 * 본문 문단.
 *
 * 명식과 캘린더는 그림이 먼저 오고 해설이 뒤에 붙으므로
 * 순서를 바꿔 쓸 수 있게 따로 빼 두었습니다.
 */
export function ReportBody({ body }: { body: string }) {
  return (
    <div className="mt-3 space-y-3">
      {body.split('\n\n').map((p, i) => (
        <p key={i} className="text-body">
          {p}
        </p>
      ))}
    </div>
  )
}
