'use client'

/**
 * 리포트 화면에서 생성이 끝나기를 기다리는 상태 (PRD 14.11, 14.12)
 *
 * 생성은 서버가 끝까지 합니다. 이 컴포넌트는 5초마다 상태만 다시 읽습니다.
 * 결제 직후, 새로고침, 나갔다 다시 들어온 경우 모두 같은 화면을 씁니다.
 *
 * 서버 컴포넌트는 한 번 그려지고 끝나므로 router.refresh()로 다시 읽습니다.
 * 완료되면 서버가 완성된 리포트를 그려 이 화면이 저절로 사라집니다.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import GeneratingChat from '@/components/chat/GeneratingChat'
import FailedState from './FailedState'
import { GENERATING_TIMEOUT_MS, type GeneratingVars } from '@/lib/content/chat-scripts'
import type { Saju } from '@/lib/saju/calculate'
import type { Element } from '@/lib/saju/constants'

/** 다시 읽는 주기 (PRD 14.12). 생성이 1분 30초-2분이라 5초면 충분합니다 */
const POLL_MS = 5000

interface Props {
  reportId: string
  retryCount: number
  reportType: '필기' | '면접'
  vars: GeneratingVars
  saju: Saju
  profile: { scores: Record<Element, number>; strong: Element; weak: Element }
  /**
   * 서버가 이미 좀비로 판정한 경우 (started_at으로부터 10분 초과).
   * 이때는 대기 화면을 건너뛰고 바로 재시도 화면을 띄웁니다.
   */
  zombie?: boolean
  /** 이 화면에 들어온 시점에 이미 지난 시간 (밀리초) */
  elapsedMs?: number
}

export default function GeneratingState({
  reportId,
  retryCount,
  reportType,
  vars,
  saju,
  profile,
  zombie = false,
  elapsedMs = 0,
}: Props) {
  const router = useRouter()
  const [timedOut, setTimedOut] = useState(zombie)

  useEffect(() => {
    if (timedOut) return

    const poll = setInterval(() => router.refresh(), POLL_MS)

    // 들어온 시점에 이미 지난 시간을 빼고 남은 만큼만 기다립니다.
    // 나갔다 들어온 사용자에게 상한을 처음부터 다시 주지 않습니다.
    const remain = Math.max(GENERATING_TIMEOUT_MS - elapsedMs, 5_000)
    const stop = setTimeout(() => setTimedOut(true), remain)

    return () => {
      clearInterval(poll)
      clearTimeout(stop)
    }
  }, [router, timedOut, elapsedMs])

  /**
   * 이탈 경고 (PRD 14.12).
   *
   * 모바일에서는 대부분 동작하지 않습니다. 그래서 대기 화면 자체에
   * "닫으셔도 됩니다" 안내를 함께 둡니다. 경고는 실수로 닫는 것만 막습니다.
   */
  useEffect(() => {
    if (timedOut) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [timedOut])

  if (timedOut) {
    return (
      <FailedState
        reportId={reportId}
        retryCount={retryCount}
        headline="리포트가 아직 안 나왔어요"
        description={[
          '결제는 정상 처리되었습니다.',
          '만드는 데 예상보다 오래 걸리고 있어요.',
          '아래 버튼으로 다시 시도하거나 문의를 남겨주세요.',
        ]}
      />
    )
  }

  return (
    <GeneratingChat reportType={reportType} vars={vars} saju={saju} profile={profile} />
  )
}
