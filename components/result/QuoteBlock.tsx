/**
 * 응원 문구 (PRD 3.2)
 *
 * 공유 버튼 위에 둡니다. quotes.json 17개 중 하나를 보여줍니다.
 *
 * seed를 넘기면 같은 입력에 같은 문구가 나옵니다. 무료 결과는 같은 입력이면
 * 항상 같아야 하므로(PRD 3.1) 결과 화면에서는 일주 인덱스를 넘깁니다.
 */

import { QUOTES, pickQuote } from '@/lib/content/fragments'

interface Props {
  /** 같은 입력에 같은 문구를 내려면 넘깁니다 */
  seed?: number
}

export default function QuoteBlock({ seed }: Props) {
  const quote = pickQuote(seed)

  return (
    <section className="mt-section px-screen">
      <div
        className="p-card text-center"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          {QUOTES.header}
        </p>
        <p className="mt-2 whitespace-pre-line text-body font-semibold">{quote}</p>
      </div>
    </section>
  )
}
