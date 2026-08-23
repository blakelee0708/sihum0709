'use client'

/**
 * 리포트 생성 중 말풍선 (PRD 14.11)
 *
 * 10-20초가 걸리므로 빈 화면이나 스피너만 두면 이탈합니다.
 * 메시지를 3-4초 간격으로 순차 표시합니다.
 * 실제로 AI가 동작하는 중이므로 내용이 사실과 어긋나지 않습니다.
 */

import { useEffect, useState } from 'react'

import BotBubble from './BotBubble'
import {
  GENERATING_INTERVAL_MS,
  GENERATING_SCRIPTS,
} from '@/lib/content/chat-scripts'

interface Props {
  reportType: '필기' | '면접'
  /** {examDate} 치환용. 예: '9월 12일' */
  examDate?: string
  /** {company} 치환용 */
  company?: string
}

export default function GeneratingChat({ reportType, examDate, company }: Props) {
  const scripts = GENERATING_SCRIPTS[reportType].map((s) =>
    s.replace('{examDate}', examDate ?? '시험일').replace('{company}', company ?? '기업')
  )

  const [shown, setShown] = useState(1)

  useEffect(() => {
    if (shown >= scripts.length) return
    const t = setTimeout(() => setShown((n) => n + 1), GENERATING_INTERVAL_MS)
    return () => clearTimeout(t)
  }, [shown, scripts.length])

  return (
    <div
      className="flex min-h-[100dvh] flex-col justify-center px-screen"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-[14px]">
        {scripts.slice(0, shown).map((line, i) => (
          <BotBubble key={i} lines={[line]} />
        ))}
      </div>
    </div>
  )
}
