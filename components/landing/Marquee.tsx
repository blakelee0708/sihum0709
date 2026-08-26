'use client'

/**
 * 세상 모든 시험 — 흐르는 목록 (FIX_3 [5])
 *
 * 히어로 바로 아래, 차별점 카드 위에 둡니다. 시작 버튼을 누르지 않고
 * 스크롤한 사람에게 "여기가 뭐 하는 곳인지" 먼저 보여주는 자리입니다.
 * 카드로 설명하기 전에 취급 범위를 눈으로 훑게 합니다.
 *
 * ── 끊김 없이 흐르게 하는 세 가지 ──
 *
 *   목록을 두 번 반복해야 이어집니다. 한 벌만 두고 -100%까지 밀면
 *   뒤쪽이 비어 있어 끊깁니다. 두 벌을 두고 -50%까지만 밀면 두 번째
 *   벌이 첫 번째 벌 자리에 정확히 겹쳐 되돌아온 것을 알 수 없습니다.
 *
 *   maskImage로 양끝을 흐리게 합니다. 없으면 화면 경계에서 글자가
 *   잘려 나가는 것이 보입니다.
 *
 *   width: max-content가 있어야 flex 자식이 줄어들지 않습니다. 없으면
 *   컨테이너 폭에 맞춰 압축돼 목록이 겹칩니다.
 *
 * ── 두 줄의 방향과 속도를 다르게 ──
 *
 * 같은 방향 같은 속도면 두 줄이 한 덩어리로 붙어 보입니다.
 * 1행 28초 왼쪽, 2행 34초 오른쪽입니다.
 *
 * ── prefers-reduced-motion ──
 *
 * 애니메이션을 끄고 줄바꿈으로 전부 표시합니다. 멈춘 마퀴는 목록의
 * 절반이 화면 밖에 남아 무슨 말인지 알 수 없게 됩니다.
 */

import { useReducedMotion } from 'framer-motion'

import { RevealItem, RevealList } from '@/components/motion/RevealList'

const ROW_1 = ['공무원 시험', '자격증', '대기업 면접', '수능', '오디션']
const ROW_2 = ['편입', '어학', '승진 시험', '모의고사', '실기']

export default function Marquee() {
  const shouldReduceMotion = useReducedMotion()

  return (
    // 제목 → 흐르는 줄 → 문구 순으로 떠오릅니다 (FIX_3 [6]-3)
    <RevealList as="section" className="pt-section">
      <RevealItem as="div">
        <h2 className="px-screen text-card-title">세상 모든 시험</h2>
      </RevealItem>

      <RevealItem className="mt-3 space-y-2">
        {shouldReduceMotion ? (
          <StaticRows />
        ) : (
          <>
            {/* 흐르는 줄은 목록을 두 벌 반복하므로 읽어주면 같은 말이
                두 번 나옵니다. 낭독용으로 한 벌만 따로 둡니다 */}
            <ul className="sr-only">
              {[...ROW_1, ...ROW_2].map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <Row items={ROW_1} direction="left" seconds={28} />
            <Row items={ROW_2} direction="right" seconds={34} />
          </>
        )}
      </RevealItem>

      <RevealItem
        className="mt-4 whitespace-pre-line px-screen text-body"
        style={{ color: 'var(--text-sub)' }}
      >
        {'내 인생의 터닝 포인트가 되는 날\n그날의 운과 잠재력 발휘 지수를\nAI 합격이가 봐드려요'}
      </RevealItem>
    </RevealList>
  )
}

interface RowProps {
  items: string[]
  direction: 'left' | 'right'
  seconds: number
}

function Row({ items, direction, seconds }: RowProps) {
  return (
    <div
      className="overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
      }}
      // 목록이 두 번 반복되므로 읽어주면 같은 말이 두 번 나옵니다
      aria-hidden
    >
      {/*
        간격을 gap이 아니라 각 항목의 margin-right로 줍니다.
        gap이면 마지막 항목 뒤에 간격이 없어서 두 벌의 이음매만 24px
        좁아집니다. -50%로 되돌아오는 순간 그만큼 튑니다.
      */}
      <div
        className="flex w-max"
        style={{
          animation: `marquee-${direction} ${seconds}s linear infinite`,
        }}
      >
        {[...items, ...items].map((t, i) => (
          <Chip key={i} label={t} flowing />
        ))}
      </div>
    </div>
  )
}

/** 흐르지 않을 때는 두 줄을 합쳐 줄바꿈으로 전부 보여줍니다 */
function StaticRows() {
  return (
    <ul className="flex flex-wrap gap-2 px-screen">
      {[...ROW_1, ...ROW_2].map((t) => (
        <li key={t}>
          <Chip label={t} />
        </li>
      ))}
    </ul>
  )
}

/** flowing이면 간격을 margin-right로 줍니다 (위 주석 참조) */
function Chip({ label, flowing = false }: { label: string; flowing?: boolean }) {
  return (
    <span
      className="block whitespace-nowrap px-[14px] py-2 text-body"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-chip)',
        boxShadow: 'var(--shadow-card)',
        marginRight: flowing ? 24 : undefined,
      }}
    >
      {label}
    </span>
  )
}
