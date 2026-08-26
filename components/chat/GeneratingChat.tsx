'use client'

/**
 * 리포트 생성 중 대기 화면 (PRD 14.11)
 *
 * 실측 생성 시간이 필기 188.7초, 면접 121.8초입니다. 말풍선 4개를 3.5초 간격으로
 * 흘리면 14초 만에 다 지나가고 남은 시간 동안 화면이 멈춰 보입니다.
 *
 * 그래서 두 가지를 바꿨습니다.
 *   1. 문구를 9개로 늘리고, 고정 주기 대신 생성 시작 기준 절대 시각으로 띄웁니다.
 *   2. 명식과 오행 분포는 코드가 이미 계산해 둔 값이므로 대기 중에 먼저 보여줍니다.
 *      결제한 사람이 첫 20초 안에 실물을 받게 되어 불안이 줄어듭니다.
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
  GENERATING_STEPS,
  type GeneratingVars,
} from '@/lib/content/chat-scripts'
import type { Saju } from '@/lib/saju/calculate'
import type { Element } from '@/lib/saju/constants'

/** 경과 시간을 다시 재는 주기. 문구 간격이 10초라 1초면 충분합니다 */
const TICK_MS = 1000

interface Props {
  reportType: '필기' | '면접'
  /** 문구 자리표시자 치환값 */
  vars?: GeneratingVars
  /** 8초 문구 뒤에 붙는 명식 표. 없으면 카드를 건너뜁니다 */
  saju?: Saju | null
  /** 18초 문구 뒤에 붙는 오행 분포 */
  profile?: { scores: Record<Element, number>; strong: Element; weak: Element } | null
}

export default function GeneratingChat({
  reportType,
  vars = {},
  saju = null,
  profile = null,
}: Props) {
  const steps = GENERATING_STEPS[reportType]

  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000))
    }, TICK_MS)
    return () => clearInterval(t)
  }, [])

  // 78초를 넘겨도 마지막 문구를 유지합니다. 경과 시간만 보므로 저절로 그렇게 됩니다.
  const shown = steps.filter((s) => s.at <= elapsed)

  return (
    <div
      className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-screen py-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full flex-col gap-[14px]">
        {shown.map((step, i) => (
          <div key={step.at} className="flex flex-col gap-[14px]">
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

/** 문구 사이 10초 동안에도 화면이 살아 있게 하는 최소 표시 */
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
