/**
 * 다른 사주와 뭐가 다른가요? (PRD 14.4, FIX_5 [4])
 *
 * 990원대 범용 사주와의 차이를 결과를 보기 전에 전달합니다.
 *
 * ── 네 장에서 세 장으로 ──
 *
 * "시험 전 7일을 봅니다"(어느 날 집중하고 어느 날 쉴지)는 서비스에서
 * 뺐습니다 (FIX_5 [4]-3). 기운 흐름 그래프는 남지만, 날짜별 공부 계획을
 * 짜주는 기능은 하지 않습니다. 카드로 약속해 두면 결과에서 어긋납니다.
 *
 * ── 카드마다 오른쪽에 실물 ──
 *
 * 설명만 있는 카드 세 장은 읽히지 않습니다. 날짜 블록, 칩, 대화 예시처럼
 * 결과의 생김새를 작게 붙여 "이런 게 나온다"를 눈으로 보여줍니다.
 *
 * 아이콘은 가는 선 SVG입니다. 이모지는 쓰지 않습니다 (FIX_5 [1]-7).
 */

import type { ReactNode } from 'react'

import BezelCard from './BezelCard'
import Rise from './Rise'

const TITLE: React.CSSProperties = {
  margin: '0 0 7px',
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: '-0.015em',
  color: 'var(--ink)',
}

const BODY: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.65,
  color: 'var(--ink-sub)',
}

const CHIP: React.CSSProperties = {
  fontSize: 12,
  padding: '6px 11px',
  borderRadius: 10,
  background: 'var(--tile)',
  color: 'var(--ink)',
}

/** 가는 선 아이콘. stroke 1.5, 강조 파랑 (FIX_5 [4]-2) */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2E5BD9"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', marginBottom: 12 }}
    >
      {children}
    </svg>
  )
}

export default function DiffCards() {
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
            lineHeight: 1.25,
            letterSpacing: '-0.035em',
            color: 'var(--ink)',
          }}
        >
          다른 사주와
          <br />
          뭐가 다른가요?
        </span>
      </Rise>

      <div style={{ display: 'grid', gap: 10 }}>
        {/* 1. 시험 날짜 */}
        <Rise>
          <BezelCard
            radius={26}
            innerStyle={{
              padding: '20px 18px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <Icon>
                <rect x="3.5" y="5" width="17" height="15" rx="3" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
              </Icon>
              <h3 style={TITLE}>시험 날짜를 계산합니다</h3>
              <p style={BODY}>
                나의 사주 오행과 십신 흐름을
                <br />
                시험 날짜에 맞춰 봅니다
              </p>
            </div>

            <div
              style={{
                flex: '0 0 74px',
                background: 'var(--tile)',
                borderRadius: 16,
                padding: '10px 0',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-sub)' }}>
                2026.04
              </p>
              <p
                style={{
                  margin: '2px 0',
                  fontSize: 30,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  color: 'var(--accent)',
                }}
              >
                11
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-sub)' }}>
                토요일
              </p>
            </div>
          </BezelCard>
        </Rise>

        {/* 2. 시험 특성 */}
        <Rise delay={0.06}>
          <BezelCard radius={26} innerStyle={{ padding: '20px 18px' }}>
            <Icon>
              <path d="M12 4v16M5 8h4M5 12h4M15 9.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M14.5 17c.6-1.8 1.8-3 3-3s2.4 1.2 3 3" />
            </Icon>
            <h3 style={TITLE}>필기와 면접 등, 해당 시험 특성에 맞게</h3>
            <p style={{ ...BODY, marginBottom: 14 }}>
              공무원, 어학, 자격증, 기업 면접까지
              <br />
              시험 특성과 내 사주 오행의 흐름을 파악해
              <br />
              합격 맞춤 전략을 알려드려요
            </p>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={CHIP}>
                필기{' '}
                <b style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  행운의 찍기 번호
                </b>
              </span>
              <span style={CHIP}>
                면접{' '}
                <b style={{ color: 'var(--accent)', fontWeight: 600 }}>예상 질문</b>
              </span>
            </div>
          </BezelCard>
        </Rise>

        {/* 3. 대화 */}
        <Rise delay={0.12}>
          <BezelCard radius={26} innerStyle={{ padding: '20px 18px' }}>
            <Icon>
              <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
            </Icon>
            <h3 style={TITLE}>AI와 대화를 할 수 있어요</h3>
            <p style={{ ...BODY, marginBottom: 14 }}>
              사주 명리에 기초해 합격이가 여러분의 불안함을
              <br />
              해소해드리고, 전략을 함께 고민해드려요
            </p>

            {/* 대화가 어떤 식인지 한 번에 보여주는 예시입니다 */}
            <div style={{ background: 'var(--tile)', borderRadius: 16, padding: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: 7,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    background: 'var(--accent)',
                    color: '#FFFFFF',
                    padding: '7px 11px',
                    borderRadius: '14px 14px 4px 14px',
                  }}
                >
                  내일 시험인데 너무 떨려요
                </span>
              </div>
              <div style={{ display: 'flex' }}>
                <span
                  style={{
                    fontSize: 12,
                    background: '#FFFFFF',
                    color: 'var(--ink)',
                    padding: '7px 11px',
                    borderRadius: '14px 14px 14px 4px',
                    lineHeight: 1.5,
                  }}
                >
                  화 기운이 강한 날이라 긴장이 커져요.
                  <br />
                  오전엔 가볍게 복습만 해볼까요?
                </span>
              </div>
            </div>
          </BezelCard>
        </Rise>
      </div>
    </section>
  )
}
