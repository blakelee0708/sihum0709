'use client'

/**
 * 새 시험 입력 (탭 2) — PRD 14.6, 14.7
 *
 * 대화가 끝나면 sessionStorage에 답변을 남긴 채 /result로 전환합니다.
 * 결과는 대화창 안에 말풍선으로 표시하지 않고 별도 화면으로 갑니다 (PRD 14.9).
 *
 * ── 바로 넘어가지 않습니다 (FIX_4 [2]) ──
 *
 * 계산은 즉시 끝나지만 첫 방문 5초, 재방문 2초를 기다립니다. 그동안
 * 문구가 1.5초마다 바뀌고, 끝나면 아래에서 시트가 올라옵니다. 점수는
 * 시트에서 보여주지 않습니다. 결과 화면에서 처음 보는 편이 극적입니다.
 *
 * 대기 시간은 화면을 붙잡아 두는 시간이 아니라 /result를 미리 받아오는
 * 시간이기도 합니다. prefetch를 걸어 두면 시트를 누른 뒤가 즉시입니다.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import BottomSheet from '@/components/motion/BottomSheet'
import ChatThread from '@/components/chat/ChatThread'
import ResultWaiting from '@/components/chat/ResultWaiting'
import { CHARACTER_NAME } from '@/lib/content/characters'
import { SESSION_KEY, type Answers } from '@/lib/content/chat-flow'
import { buildWaitMessages } from '@/lib/content/waiting'
import {
  RESULT_WAIT_FIRST_MS,
  RESULT_WAIT_SEEN_MS,
  SEEN_RESULT_KEY,
} from '@/lib/motion'

type Phase = 'chat' | 'waiting' | 'ready'

/**
 * 시트에 쓰는 캐릭터. 아직 점수를 계산하기 전이라 표정을 고를 수 없으므로
 * 지시받은 대로 char-04(미소)로 고정합니다.
 */
const SHEET_CHARACTER = '/character/char-04.png'

export default function StartPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('chat')
  const [messages, setMessages] = useState<string[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const handleFinish = useCallback(
    (answers: Answers) => {
      try {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ step: 'done', answers })
        )
      } catch {
        // 저장 실패 시에도 결과 화면이 세션에서 다시 읽으므로 진행합니다
      }

      // 두 번째부터는 같은 연출이 지루해집니다 (FIX_4 [2]-2)
      let seen: string | null = null
      try {
        seen = localStorage.getItem(SEEN_RESULT_KEY)
      } catch {
        // 사생활 보호 모드 등. 못 읽으면 첫 방문으로 봅니다
      }
      const wait = seen ? RESULT_WAIT_SEEN_MS : RESULT_WAIT_FIRST_MS

      setMessages(buildWaitMessages(wait))
      setPhase('waiting')
      router.prefetch('/result')

      timer.current = setTimeout(() => {
        try {
          localStorage.setItem(SEEN_RESULT_KEY, '1')
        } catch {
          // 못 써도 다음에 5초를 한 번 더 볼 뿐입니다
        }
        setPhase('ready')
      }, wait)
    },
    [router]
  )

  return (
    <>
      <ChatThread onFinish={handleFinish} finishLabel="결과 보기" />

      {/*
        시트가 올라온 뒤에도 대기 화면을 남깁니다. 여기서 걷어내면 시트
        뒤로 대화 화면이 다시 드러나 "아직 입력 중인가" 싶어집니다.
      */}
      {phase !== 'chat' && <ResultWaiting messages={messages} />}

      <BottomSheet
        open={phase === 'ready'}
        title="내 시험운이 나왔어요"
        confirmLabel="보러 갈까요?"
        onConfirm={() => router.push('/result')}
      >
        <Image
          src={SHEET_CHARACTER}
          alt={`${CHARACTER_NAME}가 결과를 들고 웃고 있습니다`}
          width={88}
          height={88}
          className="mt-4"
        />
      </BottomSheet>
    </>
  )
}
