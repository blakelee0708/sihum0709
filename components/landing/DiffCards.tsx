/**
 * 차별점 카드 (PRD 14.4)
 *
 * 990원대 범용 사주와의 차이를 결과를 보기 전에 전달합니다.
 *
 * 네 번째 "AI와 대화하며 봅니다"에서 "챗GPT처럼"이라고 쓰지 않습니다.
 * 실제 입력은 버튼을 고르는 방식이라, 자유 대화를 기대하고 들어오면
 * 첫 화면에서 실망합니다. 기대를 실제보다 높이는 카피는 이탈을 만듭니다.
 */

import { RevealItem, RevealList } from '@/components/motion/RevealList'

const DIFFS = [
  {
    title: '시험 날짜를 계산합니다',
    body: '나의 사주 오행과 십신 흐름을\n시험 날짜에 맞춰 봅니다',
  },
  {
    title: '필기와 면접이 다릅니다',
    body:
      '공무원, 어학, 자격증, 기업 면접까지\n시험 특성과 내 사주 오행의 흐름을\n파악해 합격 맞춤 전략을 알려드려요',
  },
  {
    title: '시험 전 7일을 봅니다',
    body: '본인 사주 오행에 따라\n어느 날 집중이 되고 어느 날 쉬어야 하는지',
  },
  {
    title: 'AI와 대화하며 봅니다',
    body: '사주 명리에 기초해\n합격이가 묻고 답해드려요',
  },
]

export default function DiffCards() {
  return (
    <section className="px-screen pt-section">
      <h2 className="text-card-title">다른 사주와 뭐가 다른가요?</h2>

      {/* 부모에 whileInView, 자식에 variants. 스태거가 자동으로 걸립니다 */}
      <RevealList as="ul" className="mt-3 space-y-card-gap">
        {DIFFS.map((d) => (
          <RevealItem
            as="li"
            key={d.title}
            className="p-card"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <p className="text-card-title">{d.title}</p>
            <p
              className="mt-1 whitespace-pre-line text-body"
              style={{ color: 'var(--text-sub)' }}
            >
              {d.body}
            </p>
          </RevealItem>
        ))}
      </RevealList>
    </section>
  )
}
