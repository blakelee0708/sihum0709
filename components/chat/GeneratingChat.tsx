'use client'

/**
 * 리포트 생성 중 대기 화면 (PRD 14.11, 14.12)
 *
 * 목표 소요가 필기 90초, 면접 130초입니다. 말풍선 4개를 3.5초 간격으로
 * 흘리면 14초 만에 다 지나가고 남은 시간 동안 화면이 멈춰 보입니다.
 *
 * 그래서 세 가지를 둡니다.
 *   1. 문구 9개를 방식별 간격으로 띄웁니다 (필기 10초, 면접 14초).
 *   2. 명식과 오행 분포는 코드가 이미 계산해 둔 값이므로 2번·3번 문구 뒤에
 *      먼저 보여줍니다. 결제한 사람이 첫 20-40초 안에 실물을 받습니다.
 *   3. "닫아도 됩니다" 안내를 답니다. 이 문구가 없으면 나가면 결제 금액을
 *      잃는다고 생각해 억지로 기다립니다 (PRD 14.12).
 *
 * 타임아웃은 이 컴포넌트가 아니라 호출부가 가집니다. 실제로 기다리는 주체가
 * fetch(결제 화면)이거나 폴링(리포트 화면)이라 그쪽에서 끊어야 하기 때문입니다.
 */

import { useEffect, useState } from 'react'

import BotBubble from './BotBubble'
import ElementBar from '@/components/report/ElementBar'
import SajuTable from '@/components/report/SajuTable'
import {
  fillGenerating,
  GENERATING_INTERVAL_SEC,
  GENERATING_NOTICE,
  GENERATING_STEPS,
  type GeneratingVars,
} from '@/lib/content/chat-scripts'
import type { Saju } from '@/lib/saju/calculate'
import type { Element } from '@/lib/saju/constants'

/** 경과 시간을 다시 재는 주기. 문구 간격이 10초 이상이라 1초면 충분합니다 */
const TICK_MS = 1000

interface Props {
  reportType: '필기' | '면접'
  /** 문구 자리표시자 치환값 */
  vars?: GeneratingVars
  /** 2번 문구 뒤에 붙는 명식 표. 없으면 카드를 건너뜁니다 */
  saju?: Saju | null
  /** 3번 문구 뒤에 붙는 오행 분포 */
  profile?: { scores: Record<Element, number>; strong: Element; weak: Element } | null
}

export default function GeneratingChat({
  reportType,
  vars = {},
  saju = null,
  profile = null,
}: Props) {
  const steps = GENERATING_STEPS[reportType]
  const interval = GENERATING_INTERVAL_SEC[reportType]

  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000))
    }, TICK_MS)
    return () => clearInterval(t)
  }, [])

  // 마지막 문구를 지나도 그대로 유지합니다. 경과 시간만 보므로 저절로 그렇게 됩니다.
  const shownCount = Math.min(Math.floor(elapsed / interval) + 1, steps.length)
  const shown = steps.slice(0, shownCount)

  const notice = GENERATING_NOTICE[reportType]

  return (
    <div
      className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-screen py-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full flex-col gap-[14px]">
        {shown.map((step, i) => (
          <div key={i} className="flex flex-col gap-[14px]">
            <BotBubble lines={[fillGenerating(step.text, vars)]} />

            {step.card === 'saju' && saju && (
              <WaitCard>
                <SajuTable saju={saju} />
              </WaitCard>
            )}

            {step.card === 'elements' && profile && (
              <WaitCard>
                <ElementBar
                  scores={profile.scores}
                  strong={profile.strong}
                  weak={profile.weak}
                />
              </WaitCard>
            )}

            {/* 마지막 말풍선에만 진행 표시를 붙입니다 */}
            {i === shown.length - 1 && <TypingDots />}
          </div>
        ))}
      </div>

      {/* 나가도 된다는 안내 (PRD 14.12) */}
      <p
        className="mt-6 text-center text-label"
        style={{ color: 'var(--text-sub)' }}
      >
        {notice[0]}
        <br />
        {notice[1]}
      </p>
    </div>
  )
}

/** 대기 화면에서는 말풍선 아래 카드 형태로 붙입니다 */
function WaitCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-card"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {children}
    </div>
  )
}

/** 문구 사이 10초 이상 동안에도 화면이 살아 있게 하는 최소 표시 */
function TypingDots() {
  return (
    <div className="flex gap-1 pl-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-[6px] w-[6px] animate-pulse rounded-full"
          style={{
            background: 'var(--text-sub)',
            animationDelay: `${i * 200}ms`,
          }}
        />
      ))}
    </div>
  )
}
