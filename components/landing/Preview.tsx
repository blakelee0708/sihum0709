/**
 * 이런 걸 알려드려요 — 결과 미리보기 (PRD 14.4, FIX_5 [5])
 *
 * 카드 제목 8개를 나열하던 자리입니다. "행운의 숫자는?"만 읽어서는 무엇을
 * 받는지 감이 오지 않습니다. 제목은 정보가 아니라 목차입니다.
 *
 * 지금은 결과의 조각을 그대로 보여줍니다. 그래프가 990원대 사주와 다르다는
 * 것을 말없이 증명하고, 마지막 블러 문장 한 줄이 "글도 이만큼 나온다"를
 * 암시합니다. 읽히지는 않지만 분량과 문체는 전달됩니다.
 *
 * ── 숫자는 전부 고정 예시입니다 ──
 *
 * 랜딩은 비로그인 화면이라 계산할 입력이 없습니다. 실제 값처럼 보이되
 * 실제 값이 아니므로 이 파일 안에서만 쓰는 상수로 둡니다.
 *
 * ── "행운의 숫자"가 아니라 "행운의 찍기 번호" ──
 *
 * 무엇에 쓰는 숫자인지가 이름에 들어가야 합니다 (FIX_5 [5]).
 */

import BezelCard from './BezelCard'
import Rise from './Rise'
import WeekFlowBars from './WeekFlowBars'

/**
 * D-7부터 당일까지 8일. 마지막이 시험 당일입니다.
 * 표시 축은 40~95입니다 (FIX_4 [1]). 당일이 가장 높게 끝나야 그래프가
 * "그날을 위해 올라간다"로 읽힙니다.
 */
const WEEK_FLOW = [
  { label: 'D-7', score: 70 },
  { label: '', score: 61 },
  { label: '', score: 74 },
  { label: '', score: 67 },
  { label: '', score: 76 },
  { label: '', score: 64 },
  { label: '', score: 72 },
  { label: '당일', score: 90 },
]

/** 시험 당일 운 예시 */
const DAY_SCORE = 78

const TILE: React.CSSProperties = {
  background: 'var(--tile)',
  borderRadius: 14,
  padding: 12,
}

const LABEL: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: 'var(--ink-sub)',
}

/**
 * 읽으라고 두는 것이 아니라 분량과 문체를 보여주는 자리입니다.
 * 긁어서 복사하면 의도가 깨지므로 선택을 막고 스크린리더에도 숨깁니다.
 * 대신 아래 잠금 버튼이 무엇이 가려져 있는지 말합니다.
 */
const BLURRED =
  '화가 강한 구성이라 초반 몰입도가 높습니다. 시험 중반에 속도가 한 번 내려오는 시점이 있어'

export default function Preview() {
  return (
    <section style={{ margin: '76px 12px 0' }}>
      <Rise as="h2">
        <span
          style={{
            display: 'block',
            margin: '0 0 18px',
            padding: '0 8px',
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: 'var(--ink)',
          }}
        >
          이런 걸 알려드려요
        </span>
      </Rise>

      <Rise>
        <BezelCard radius={30} innerStyle={{ padding: '22px 20px' }}>
          {/* 위 — 유형 뱃지와 당일 운 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 18,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--badge-ink)',
                background: 'var(--badge-bg)',
                padding: '6px 11px',
                borderRadius: 10,
              }}
            >
              몰입형 · 화(火)
            </span>

            <div style={{ textAlign: 'right' }}>
              <p style={{ ...LABEL, marginBottom: 3 }}>시험 당일 운</p>
              <p
                style={{
                  margin: 0,
                  fontSize: 38,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  color: 'var(--accent)',
                }}
              >
                {DAY_SCORE}
              </p>
            </div>
          </div>

          {/* 기운 흐름 — 막대 8개, 당일만 진한 파랑 */}
          <p style={{ ...LABEL, marginBottom: 8 }}>시험 D-7 내 기운 흐름</p>
          <WeekFlowBars data={WEEK_FLOW} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              marginBottom: 18,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--ink-sub)' }}>D-7</span>
            <span
              style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}
            >
              당일
            </span>
          </div>

          {/* 타일 둘 — 색 원을 쓰지 않고 글자로만 씁니다 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              marginBottom: 16,
            }}
          >
            <div style={TILE}>
              <p style={{ ...LABEL, marginBottom: 4 }}>행운의 찍기 번호</p>
              <p
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'var(--ink)',
                }}
              >
                3
              </p>
            </div>

            <div style={TILE}>
              <p style={{ ...LABEL, marginBottom: 6 }}>피해야 할 색</p>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--ink)',
                }}
              >
                붉은 계열
              </p>
            </div>
          </div>

          <p
            aria-hidden
            style={{
              margin: '0 0 16px',
              fontSize: 14,
              lineHeight: 1.65,
              color: 'var(--ink)',
              filter: 'blur(3.5px)',
              userSelect: 'none',
            }}
          >
            {BLURRED}
          </p>

          <a
            href="/start"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: 'var(--tile)',
              borderRadius: 999,
              padding: 11,
              textDecoration: 'none',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2E5BD9"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <span
              style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}
            >
              카드 8개 전부 보기
            </span>
          </a>
        </BezelCard>
      </Rise>
    </section>
  )
}
