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
 * 카드가 화면 폭으로 넓어지면서(FIX_5 [2]-2 개정) 타일 안 여백과 글자
 * 크기를 함께 키웠습니다. 좁은 카드 기준 값을 그대로 두면 넓은 카드
 * 안에서 내용이 왼쪽에 몰려 보입니다.
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
          padding: '12px 14px',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div style={{ flex: '0 0 auto' }}>
          <p style={{ margin: '0 0 3px', fontSize: 11, color: 'var(--ink-sub)' }}>
            당일 운
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 32,
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
              fontSize: 11,
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
            viewBox="0 0 110 30"
            role="img"
            style={{ display: 'block' }}
          >
            <title>시험 D-7 내 기운 흐름 예시</title>
            <path
              d="M4 15 C11 15 11 21 18 21 C25 21 25 12 33 12 C40 12 40 17.5 48 17.5 C55 17.5 55 13.5 62 13.5 C69 13.5 69 19 77 19 C84 19 84 15.8 91 15.8 C98 15.8 98 4.5 106 4.5"
              fill="none"
              stroke="#2E5BD9"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="106" cy="4.5" r="3" fill="#2E5BD9" />
          </svg>
        </div>
      </div>

      {/* 아래 타일 둘 — 찍기 번호와 행운 색 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div style={{ ...TILE, padding: '11px 14px' }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--ink-sub)' }}>
            행운의 찍기 번호
          </p>
          <p style={{ margin: 0, lineHeight: 1 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
              {LUCKY_NUMBER}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-sub)', marginLeft: 2 }}>
              번
            </span>
          </p>
        </div>

        <div style={{ ...TILE, padding: '11px 14px' }}>
          <p style={{ margin: '0 0 7px', fontSize: 11, color: 'var(--ink-sub)' }}>
            행운 색
          </p>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#FFFFFF',
              borderRadius: 999,
              padding: '3px 10px 3px 4px',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#26487F',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              남색
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
