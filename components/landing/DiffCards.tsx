/**
 * 차별점 카드 (PRD 14.4)
 *
 * 990원대 범용 사주와의 차이를 결과를 보기 전에 전달합니다.
 */

const DIFFS = [
  {
    title: '시험 날짜를 계산합니다',
    body: '그날 하루의 기운을 따로 봅니다',
  },
  {
    title: '필기와 면접이 다릅니다',
    body: '준비 방식에 맞춰 다르게 알려드려요',
  },
  {
    title: '시험 전 7일을 봅니다',
    body: '어느 날 집중이 붙고 어느 날 쉬어야 하는지',
  },
]

export default function DiffCards() {
  return (
    <section className="px-screen pt-section">
      <h2 className="text-card-title">다른 사주와 뭐가 다른가요?</h2>

      <ul className="mt-3 space-y-card-gap">
        {DIFFS.map((d) => (
          <li
            key={d.title}
            className="p-card"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <p className="text-card-title">{d.title}</p>
            <p className="mt-1 text-body" style={{ color: 'var(--text-sub)' }}>
              {d.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
