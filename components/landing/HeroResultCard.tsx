/**
 * 히어로 결과 카드 (FIX_5 [2]-2)
 *
 * 설명 대신 결과를 먼저 보여주는 자리입니다. 타일 세 개로 "당일 운 ·
 * 기운 흐름 · 찍기 번호 · 행운 색"을 한눈에 보여줍니다.
 *
 * ── 값은 전부 고정 예시입니다 ──
 *
 * 랜딩은 비로그인 화면이라 계산할 입력이 없습니다. 실제 값처럼 보이되
 * 실제 값이 아니므로 이 파일 안에서만 쓰는 상수로 둡니다.
 *
 * ── "7일 바이오리듬"이라고 쓰지 않습니다 ──
 *
 * 이름을 "시험 D-7 내 기운 흐름"으로 통일했습니다 (FIX_5 [2]-2).
 * 라벨이 두 줄로 접히면 곡선이 밀려 내려가므로 nowrap으로 못 박습니다.
 */

import CountUp from '@/components/motion/CountUp'

/** 당일 운 예시 */
const DAY_SCORE = 78

/** 찍기 번호 예시 */
const LUCKY_NUMBER = 3

const TILE: React.CSSProperties = {
  background: 'var(--tile)',
  borderRadius: 14,
}

export default function HeroResultCard() {
  return (
    <div style={{ padding: 7 }}>
      {/* 위 타일 — 당일 운과 기운 흐름 */}
      <div
        style={{
          ...TILE,
          padding: '11px 12px',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ flex: '0 0 auto' }}>
          <p style={{ margin: '0 0 3px', fontSize: 11, color: 'var(--ink-sub)' }}>
            당일 운
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: 'var(--accent)',
            }}
          >
            <CountUp value={DAY_SCORE} delay={0.4} />
          </p>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: '0 0 3px',
              fontSize: 10.5,
              color: 'var(--ink-sub)',
              textAlign: 'right',
              whiteSpace: 'nowrap',
            }}
          >
            시험 D-7 내 기운 흐름
          </p>

          {/*
            곡선은 그림입니다. 당일 지점에만 점을 찍고 그 자리가 가장
            높습니다. 막대 여덟 개를 작게 그리면 뭉개져 보여 선으로 뒀습니다.
          */}
          <svg
            width="100%"
            viewBox="0 0 110 34"
            role="img"
            style={{ display: 'block' }}
          >
            <title>시험 D-7 내 기운 흐름 예시</title>
            <path
              d="M4 17 C11 17 11 23 18 23 C25 23 25 14 33 14 C40 14 40 19.5 48 19.5 C55 19.5 55 15.5 62 15.5 C69 15.5 69 21 77 21 C84 21 84 17.8 91 17.8 C98 17.8 98 5.5 106 5.5"
              fill="none"
              stroke="#2E5BD9"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="106" cy="5.5" r="3.4" fill="#2E5BD9" />
          </svg>
        </div>
      </div>

      {/* 아래 타일 둘 — 찍기 번호와 행운 색 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div style={{ ...TILE, padding: '10px 12px' }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--ink-sub)' }}>
            찍기 번호
          </p>
          <p style={{ margin: 0, lineHeight: 1 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
              {LUCKY_NUMBER}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-sub)', marginLeft: 2 }}>
              번
            </span>
          </p>
        </div>

        <div style={{ ...TILE, padding: '10px 12px' }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--ink-sub)' }}>
            행운 색
          </p>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#FFFFFF',
              borderRadius: 999,
              padding: '3px 9px 3px 4px',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 13,
                height: 13,
                borderRadius: '50%',
                background: '#26487F',
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
              남색
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
