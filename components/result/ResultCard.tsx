/**
 * 결과 카드 (PRD 3.2, 21.4, 21.12)
 *
 * 카드 모서리 24px, 안쪽 패딩 20px, 카드 사이 12px.
 * 한글 본문 행간은 1.7 이상을 유지합니다 (PRD 21.3).
 *
 * 스크롤 리빌을 호출부가 아니라 여기에 넣습니다. ResultView가 카드
 * 종류에 따라 여러 갈래로 분기해서 렌더하기 때문에, 호출부에 넣으면
 * 같은 코드를 여러 번 쓰게 되고 한 갈래를 빠뜨리기 쉽습니다.
 */

import Reveal from '@/components/motion/Reveal'

interface Props {
  title: string
  children?: React.ReactNode
  paragraphs?: string[]
}

export default function ResultCard({ title, children, paragraphs }: Props) {
  return (
    <Reveal
      as="article"
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
    </Reveal>
  )
}
