/**
 * 결과 카드 (PRD 3.2, 21.4)
 *
 * 카드 모서리 24px, 안쪽 패딩 20px, 카드 사이 12px.
 * 한글 본문 행간은 1.7 이상을 유지합니다 (PRD 21.3).
 */

interface Props {
  title: string
  children?: React.ReactNode
  paragraphs?: string[]
}

export default function ResultCard({ title, children, paragraphs }: Props) {
  return (
    <article
      className="p-card"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <h2 className="text-card-title">{title}</h2>

      {paragraphs && paragraphs.length > 0 && (
        <div className="mt-3 space-y-3">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-body">
              {p}
            </p>
          ))}
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}
    </article>
  )
}
