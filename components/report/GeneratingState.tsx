'use client'

/**
 * 리포트 화면에서 생성이 끝나기를 기다리는 상태 (PRD 14.11, 14.12)
 *
 * 결제 직후에는 결제 화면이 fetch를 붙들고 기다립니다. 이 컴포넌트는 그 뒤
 * 사용자가 새로고침했거나 /my에서 아직 안 끝난 리포트로 들어온 경우를 맡습니다.
 *
 * 서버 컴포넌트는 한 번 그려지고 끝나므로 여기서 주기적으로 다시 읽습니다.
 * 상한을 넘기면 정상 범위가 아니므로 실패 화면으로 바꿉니다.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import GeneratingChat from '@/components/chat/GeneratingChat'
import FailedState from './FailedState'
import { GENERATING_TIMEOUT_MS, type GeneratingVars } from '@/lib/content/chat-scripts'
import type { Saju } from '@/lib/saju/calculate'
import type { Element } from '@/lib/saju/constants'

/** 다시 읽는 주기. 생성이 2-3분이라 5초면 충분합니다 */
const POLL_MS = 5000

interface Props {
  reportId: string
  retryCount: number
  reportType: '필기' | '면접'
  vars: GeneratingVars
  saju: Saju
  profile: { scores: Record<Element, number>; strong: Element; weak: Element }
}

export default function GeneratingState({
  reportId,
  retryCount,
  reportType,
  vars,
  saju,
  profile,
}: Props) {
  const router = useRouter()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (timedOut) return

    const poll = setInterval(() => router.refresh(), POLL_MS)
    const stop = setTimeout(() => setTimedOut(true), GENERATING_TIMEOUT_MS)

    return () => {
      clearInterval(poll)
      clearTimeout(stop)
    }
  }, [router, timedOut])

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
