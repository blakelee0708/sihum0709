/**
 * 세상에 존재하는 모든 시험 (FIX_5 [3])
 *
 * 시작 버튼을 누르지 않고 스크롤한 사람에게 "여기가 뭐 하는 곳인지"
 * 보여주는 자리입니다. 시험 이름만 흘리면 취급 범위만 전해지므로,
 * "시험 이름 | 결과 조각"으로 바꿔 무엇을 받는지까지 같이 보여줍니다.
 *
 * ── 끊김 없이 흐르게 하는 세 가지 ──
 *
 *   목록을 두 번 반복해야 이어집니다. 한 벌만 두고 -100%까지 밀면
 *   뒤쪽이 비어 끊깁니다. 두 벌을 두고 -50%까지만 밀면 두 번째 벌이
 *   첫 번째 벌 자리에 정확히 겹쳐 되돌아온 것을 알 수 없습니다.
 *
 *   간격을 gap이 아니라 각 항목의 margin-right로 줍니다. gap이면 마지막
 *   항목 뒤에만 간격이 없어 이음매가 그만큼 좁아지고, -50%로 되돌아오는
 *   순간 튑니다.
 *
 *   maskImage로 양끝을 흐리게 합니다. 없으면 화면 경계에서 글자가 잘려
 *   나가는 것이 보입니다.
 *
 * ── 면접은 전부 "예상 질문"입니다 ──
 *
 * 컨디션·집중 주의·D-3 같은 항목은 넣지 않습니다. 서비스가 실제로 주는
 * 것만 적어야 합니다 (FIX_5 [3]-3).
 *
 * ── 멈춤 ──
 *
 * 손가락을 대거나 마우스를 올리면 멈춥니다(globals.css .marquee-mask).
 * 움직임 줄이기 설정에서는 전역 규칙이 애니메이션 자체를 끕니다.
 * 멈춘 마퀴는 목록의 절반이 화면 밖에 남으므로, 그때는 줄바꿈 목록으로
 * 갈아끼웁니다.
 */

import Image from 'next/image'

import BezelCard from './BezelCard'
import Rise from './Rise'
import { CHARACTER_NAME } from '@/lib/content/characters'

interface Item {
  /** 시험 이름 */
  exam: string
  /** 그 시험에서 받는 결과 한 조각 */
  result: string
}

const ROW_1: Item[] = [
  { exam: '경찰공무원', result: '행운의 찍기 번호 3번' },
  { exam: '삼성 면접', result: '예상 질문 유연성' },
  { exam: '수능', result: '당일 운 82' },
  { exam: '9급 공채', result: '행운의 찍기 번호 4번' },
  { exam: '은행 면접', result: '예상 질문 협업' },
]

const ROW_2: Item[] = [
  { exam: '토익', result: '행운 색 남색' },
  { exam: '공기업 면접', result: '예상 질문 책임감' },
  { exam: '편입', result: '행운의 찍기 번호 1번' },
  { exam: '승진 시험', result: '당일 운 74' },
  { exam: 'IT 기업 면접', result: '예상 질문 문제 해결' },
]

const MASK =
  'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)'

export default function Marquee() {
  return (
    <Rise as="section" style={{ margin: '112px 12px 0' }}>
      <BezelCard
        radius={30}
        style={{ position: 'relative' }}
        innerStyle={{ padding: '28px 0 24px' }}
      >
        {/*
          카드에 걸터앉은 합격이. 발끝이 카드 안쪽으로 내려와야 "앉아 있다"로
          읽힙니다. 카드 위 여백을 112px로 크게 잡아 둔 것이 이 자리입니다.

          top은 시안의 -78px이 아니라 -62px입니다. 시안대로 두면 발끝이
          카드 위 1px에 걸쳐 공중에 뜬 것처럼 보입니다. 지금 쓰는 hihi.png는
          투명 여백이 거의 없어(알파 경계가 캔버스의 1.5~98.6%) 이미지 높이가
          곧 캐릭터 높이이기 때문입니다. 지시서가 요구한 "발끝이 20퍼센트쯤
          내려온" 상태가 되도록 16px 내렸습니다.
        */}
        <Image
          src="/character/hihi.png"
          alt={`카드에 걸터앉아 손을 흔드는 ${CHARACTER_NAME}`}
          width={168}
          height={168}
          style={{
            position: 'absolute',
            right: 20,
            top: -62,
            width: 84,
            height: 'auto',
            display: 'block',
            zIndex: 2,
          }}
        />

        <h2
          style={{
            margin: '0 0 6px',
            padding: '0 20px',
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
          }}
        >
          세상에 존재하는{' '}
          <span
            style={{
              background: 'linear-gradient(transparent 58%, #FFE08A 58%)',
            }}
          >
            모든 시험
          </span>
        </h2>

        {/* "예시"를 반드시 적습니다. 지어낸 실제 사용자 결과로 오해받지 않게 */}
        <p
          style={{
            margin: '0 0 20px',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--ink-sub)',
          }}
        >
          이런 결과를 알려드려요 · 예시
        </p>

        {/*
          흐르는 줄은 목록을 두 벌 반복하므로 읽어주면 같은 말이 두 번
          나옵니다. 낭독용으로 한 벌만 따로 둡니다.
        */}
        <ul className="sr-only">
          {[...ROW_1, ...ROW_2].map((item) => (
            <li key={item.exam}>
              {item.exam} · {item.result}
            </li>
          ))}
        </ul>

        <Row items={ROW_1} direction="left" seconds={40} className="mb-2" />
        <Row items={ROW_2} direction="right" seconds={44} className="mb-[22px]" />

        <p
          style={{
            margin: 0,
            padding: '0 20px',
            textAlign: 'center',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--ink-sub)',
          }}
        >
          내 인생의 터닝 포인트가 되는 날
          <br />
          그날의 운과 잠재력 발휘 지수를
          <br />
          AI 합격이가 봐드려요
        </p>
      </BezelCard>
    </Rise>
  )
}

interface RowProps {
  items: Item[]
  direction: 'left' | 'right'
  seconds: number
  className?: string
}

function Row({ items, direction, seconds, className }: RowProps) {
  return (
    <div
      className={`marquee-mask ${className ?? ''}`}
      style={{
        overflow: 'hidden',
        maskImage: MASK,
        WebkitMaskImage: MASK,
      }}
      // 목록이 두 번 반복되므로 읽어주면 같은 말이 두 번 나옵니다
      aria-hidden
    >
      <div
        className="marquee-row flex w-max"
        style={{ animation: `marquee-${direction} ${seconds}s linear infinite` }}
      >
        {items.map((item, i) => (
          <Pill key={`a-${i}`} item={item} />
        ))}
        {/* 두 번째 벌. 이음매를 메우는 용도라 멈춘 상태에서는 숨깁니다 */}
        {items.map((item, i) => (
          <Pill key={`b-${i}`} item={item} duplicate />
        ))}
      </div>
    </div>
  )
}

function Pill({ item, duplicate = false }: { item: Item; duplicate?: boolean }) {
  return (
    <span className={duplicate ? 'pill dup' : 'pill'} style={{ marginRight: 8 }}>
      <b>{item.exam}</b>
      <i aria-hidden />
      <span>{item.result}</span>
    </span>
  )
}
