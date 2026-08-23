/**
 * 결과 화면 미리보기 (PRD 14.4)
 *
 * 완주 동기를 만들기 위해 무엇을 받게 되는지 먼저 보여줍니다.
 * 실제 값이 아니라 구성만 보여주는 자리이므로 숫자는 예시입니다.
 */

import Image from 'next/image'

import { CHARACTER_NAME, TYPE_BADGES } from '@/lib/content/characters'

const CARD_TITLES = [
  '시험 날짜 운세는?',
  '시험장에서 주의할 점',
  '행운의 숫자는?',
  '시험일에 뭘 입고 갈까?',
  '시험 전날 밤에는',
  '시험 전 7일 기운 흐름',
  '나에게 맞는 시험 유형',
  '시작 시간 궁합',
]

export default function Preview() {
  const badge = TYPE_BADGES.화

  return (
    <section className="px-screen pt-section">
      <h2 className="text-card-title">이런 걸 알려드려요</h2>

      <div
        className="mt-3 p-card"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/character/char-04.png"
            alt={`미소 짓는 ${CHARACTER_NAME}`}
            width={72}
            height={72}
            className="h-[72px] w-[72px] object-contain"
          />

          <div
            className="flex flex-col items-center px-3 py-2 text-label"
            style={{
              backgroundColor: `${badge.color}1A`,
              border: `1px solid ${badge.color}`,
              borderRadius: 'var(--radius-chip)',
              color: badge.color,
            }}
          >
            <span aria-hidden>{badge.icon}</span>
            <span className="font-semibold">{badge.name}</span>
            <span>
              {badge.element}({badge.hanja})
            </span>
          </div>

          <div className="ml-auto text-right">
            <p className="text-label" style={{ color: 'var(--text-sub)' }}>
              시험 당일 운
            </p>
            <p className="text-score" style={{ color: 'var(--score-mid)' }}>
              78
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {CARD_TITLES.map((t, i) => (
            <li
              key={t}
              className="flex items-center gap-2 text-body"
              style={{ color: 'var(--text-sub)' }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center text-label"
                style={{
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-round)',
                  color: 'var(--primary)',
                }}
              >
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
