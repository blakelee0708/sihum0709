/**
 * 결과 화면 미리보기 (PRD 14.4)
 *
 * ── 목록에서 조각으로 바꾼 이유 ──
 *
 * 전에는 카드 제목 8개를 번호와 함께 나열했습니다. "행운의 숫자는?"만
 * 읽어서는 무엇을 받는지 감이 오지 않습니다. 제목은 정보가 아니라 목차입니다.
 *
 * 지금은 결과의 조각을 그대로 보여줍니다. 차트가 990원대 사주와 다르다는
 * 것을 말없이 증명하고, 마지막 블러 문장 한 줄이 "글도 이만큼 나온다"를
 * 암시합니다. 읽히지는 않지만 분량과 문체는 전달됩니다.
 *
 * ── 숫자는 전부 고정 예시입니다 ──
 *
 * 랜딩은 비로그인 화면이라 계산할 입력이 없습니다. 실제 값처럼 보이되
 * 실제 값이 아니므로, 이 파일 안에서만 쓰는 상수로 둡니다.
 */

import { Lock } from 'lucide-react'
import Image from 'next/image'

import GrowBar from '@/components/motion/GrowBar'
import Reveal from '@/components/motion/Reveal'
import WeekFlowBars from './WeekFlowBars'
import { CHARACTER_NAME, TYPE_BADGES } from '@/lib/content/characters'

/** D-7부터 당일까지 8일. 마지막이 시험 당일입니다 */
const WEEK_FLOW = [
  { label: 'D-7', score: 55 },
  { label: '', score: 38 },
  { label: '', score: 62 },
  { label: '', score: 84 },
  { label: '', score: 71 },
  { label: '', score: 46 },
  { label: '', score: 66 },
  { label: '당일', score: 78 },
]

const METHOD_FIT = [
  { label: '면접', score: 81 },
  { label: '객관식 필기', score: 74 },
]

/** 약한 오행이 수(水)일 때 피하는 색 예시 */
const AVOID_COLORS = [
  { name: '검정', hex: '#2B2F38' },
  { name: '남색', hex: '#2F4A7A' },
]

const BLURRED =
  '화가 강한 구성이라 초반 몰입도가 높습니다. 다만 그 속도가 중반에 한 번 꺾이는데'

export default function Preview() {
  const badge = TYPE_BADGES.화

  return (
    <section className="px-screen pt-section">
      <h2 className="text-card-title">이런 걸 알려드려요</h2>

      <Reveal
        className="mt-3 p-card"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* 상단 — 캐릭터, 유형 뱃지, 당일 운 */}
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

        {/* 1. 7일 기운 흐름 */}
        <div className="mt-5">
          <p className="text-label" style={{ color: 'var(--text-sub)' }}>
            시험 전 7일 기운 흐름
          </p>
          <div className="mt-2">
            <WeekFlowBars data={WEEK_FLOW} />
          </div>
          <div
            className="mt-1 flex justify-between text-label"
            style={{ color: 'var(--text-sub)' }}
          >
            <span>D-7</span>
            <span>당일</span>
          </div>
        </div>

        {/* 2. 행운의 숫자 · 피해야 할 색 */}
        <div className="mt-5 grid grid-cols-2 gap-card-gap">
          <div
            className="px-3 py-3 text-center"
            style={{ background: 'var(--bg)', borderRadius: 'var(--radius-card)' }}
          >
            <p className="text-label" style={{ color: 'var(--text-sub)' }}>
              행운의 숫자
            </p>
            <p className="mt-1 text-score" style={{ color: 'var(--primary)' }}>
              3
            </p>
          </div>

          <div
            className="px-3 py-3 text-center"
            style={{ background: 'var(--bg)', borderRadius: 'var(--radius-card)' }}
          >
            <p className="text-label" style={{ color: 'var(--text-sub)' }}>
              피해야 할 색
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              {AVOID_COLORS.map((c) => (
                <span
                  key={c.hex}
                  className="h-7 w-7"
                  title={c.name}
                  aria-label={c.name}
                  role="img"
                  style={{
                    background: c.hex,
                    borderRadius: 'var(--radius-round)',
                    border: '2px solid var(--surface)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3. 시험 유형 궁합 */}
        <div className="mt-5">
          <p className="text-label" style={{ color: 'var(--text-sub)' }}>
            나에게 맞는 시험 유형
          </p>
          <ul className="mt-2 space-y-2">
            {METHOD_FIT.map((m, i) => (
              <li key={m.label}>
                <div className="flex items-baseline justify-between text-label">
                  <span style={{ color: 'var(--text-sub)' }}>{m.label}</span>
                  <span className="font-semibold">{m.score}</span>
                </div>
                <div className="mt-1">
                  <GrowBar
                    percent={m.score}
                    color="var(--primary)"
                    index={i}
                    label={`${m.label} 적합도 ${m.score}점`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/*
          4. 블러 문장.
          읽으라고 두는 것이 아니라 분량과 문체를 보여주는 자리입니다.
          긁어서 복사하면 의도가 깨지므로 선택을 막고, 스크린리더에도
          숨깁니다. 대신 아래 잠금 안내가 무엇이 가려져 있는지 말합니다.
        */}
        <p
          aria-hidden
          className="mt-5 text-body"
          style={{
            filter: 'blur(3.5px)',
            userSelect: 'none',
            color: 'var(--text)',
          }}
        >
          {BLURRED}
        </p>

        {/* 5. 잠금 안내 */}
        <div
          className="mt-4 flex items-center justify-center gap-2 text-label"
          style={{ color: 'var(--text-sub)' }}
        >
          <Lock size={14} aria-hidden />
          <span>카드 8개 전부 보기</span>
        </div>
      </Reveal>
    </section>
  )
}
