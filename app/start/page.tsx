'use client'

/**
 * 새 시험 입력 (탭 2) — PRD 14.6, 14.7
 *
 * 대화가 끝나면 sessionStorage에 답변을 남긴 채 /result로 전환합니다.
 * 결과는 대화창 안에 말풍선으로 표시하지 않고 별도 화면으로 갑니다 (PRD 14.9).
 */

import { useRouter } from 'next/navigation'

import ChatThread from '@/components/chat/ChatThread'
import { SESSION_KEY, type Answers } from '@/lib/content/chat-flow'

export default function StartPage() {
  const router = useRouter()

  function handleFinish(answers: Answers) {
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ step: 'done', answers })
      )
    } catch {
      // 저장 실패 시에도 결과 화면이 세션에서 다시 읽으므로 진행합니다
    }
    router.push('/result')
  }

  return <ChatThread onFinish={handleFinish} finishLabel="결과 보기" />
}
