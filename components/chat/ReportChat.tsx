'use client'

/**
 * 리포트 후 합격이와의 대화 (FIX_4 [3])
 *
 * 리포트를 다 읽은 사람이 들어옵니다. 3,900원에 포함된 기능이라 별도
 * 결제가 없고, 대신 누적 원가로 상한을 겁니다.
 *
 * ── 게이지 ──
 *
 * 사용자에게 원가를 숫자로 보여주지 않습니다. "합격이의 기운"이 줄어드는
 * 것으로만 표시합니다. 남은 금액이 보이면 대화가 아니라 계량기가 됩니다.
 * 상단에 고정해 항상 보이게 합니다 (FIX_4 [3]-2).
 *
 * ── 버튼을 계속 보여줍니다 ──
 *
 * 답변 뒤에도 남은 추천 질문을 다시 띄웁니다. 자유 입력만 두면 무엇을
 * 물어야 할지 모르고 답변 품질도 같이 흔들립니다 (FIX_4 [3]-5).
 *
 * ── 소진 ──
 *
 * 기운이 다하면 인사하고 리포트로 돌려보냅니다. 돌아가서 다시 읽으면
 * 대화가 리포트를 보완했다는 인상이 남습니다 (FIX_4 [3]-9).
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

import BotBubble from './BotBubble'
import UserBubble from './UserBubble'
import TypingBubble from './TypingBubble'
import TextInputWidget from './TextInputWidget'
import { CHARACTER_NAME } from '@/lib/content/characters'
import {
  FREE_INPUT_ID,
  FREE_INPUT_MAX,
  remainingQuestions,
  type ChatQuestion,
} from '@/lib/content/chat-questions'
import { useOptionMotion } from '@/components/motion/motion-safe'
import { useTap } from '@/components/motion/Pressable'

export interface ChatViewMessage {
  role: 'user' | 'assistant'
  content: string
  questionId?: string
}

interface Props {
  reportId: string
  greeting: string[]
  initialMessages: ChatViewMessage[]
  initialGauge: number
  initialExhausted: boolean
  questions: ChatQuestion[]
  initialAskedIds: string[]
}

interface TurnResponse {
  reply?: string
  messages?: ChatViewMessage[]
  gauge?: number
  exhausted?: boolean
  askedIds?: string[]
  error?: string
}

const EXHAUSTED_LINES = [
  '오늘은 여기까지 봐드릴 수 있을 것 같아요.',
  '시험 잘 보시고, 결과 나오면 또 이야기해요.',
]

export default function ReportChat({
  reportId,
  greeting,
  initialMessages,
  initialGauge,
  initialExhausted,
  questions,
  initialAskedIds,
}: Props) {
  const [messages, setMessages] = useState<ChatViewMessage[]>(initialMessages)
  const [gauge, setGauge] = useState(initialGauge)
  const [exhausted, setExhausted] = useState(initialExhausted)
  const [askedIds, setAskedIds] = useState<string[]>(initialAskedIds)
  const [sending, setSending] = useState(false)
  const [freeInput, setFreeInput] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const optionMotion = useOptionMotion()
  const tap = useTap('surface')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, sending, freeInput])

  async function send(text: string, questionId?: string) {
    if (sending || exhausted) return

    setError(null)
    setFreeInput(false)
    setSending(true)
    // 보낸 말을 먼저 그립니다. 응답을 기다리는 동안 화면이 비어 있으면
    // 눌린 것인지 알 수 없습니다
    setMessages((prev) => [...prev, { role: 'user', content: text, questionId }])

    try {
      const res = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, message: text, questionId }),
      })

      const json = (await res.json().catch(() => ({}))) as TurnResponse

      if (!res.ok || json.error) {
        setError('답변을 가져오지 못했어요. 잠시 후 다시 눌러 주세요.')
        // 실패한 질문은 되돌립니다. 답 없는 말풍선이 남으면 물어본 것으로 보입니다
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      if (json.messages) setMessages(json.messages)
      if (typeof json.gauge === 'number') setGauge(json.gauge)
      if (json.askedIds) setAskedIds(json.askedIds)
      if (json.exhausted) setExhausted(true)
    } catch {
      setError('답변을 가져오지 못했어요. 잠시 후 다시 눌러 주세요.')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

  const left = remainingQuestions(questions, askedIds)
  const showButtons = !sending && !exhausted && !freeInput

  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ background: 'var(--bg)' }}>
      {/* 남은 기운. 상단에 고정해 항상 보이게 합니다 (FIX_4 [3]-2) */}
      <div
        className="sticky top-0 z-10 px-screen py-3"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="mx-auto flex max-w-md items-center gap-3">
          <span className="shrink-0 text-label" style={{ color: 'var(--text-sub)' }}>
            {CHARACTER_NAME}의 기운
          </span>
          <div
            className="h-2 flex-1 overflow-hidden"
            style={{ background: 'var(--border)', borderRadius: 999 }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(gauge * 100)}
            aria-label={`${CHARACTER_NAME}의 남은 기운`}
          >
            <motion.div
              className="h-full"
              style={{ background: 'var(--primary)', borderRadius: 999 }}
              animate={{ width: `${Math.round(gauge * 100)}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 px-screen py-4" role="log">
        <div className="mx-auto flex max-w-md flex-col gap-[14px]">
          <BotBubble lines={greeting} instant />

          {messages.map((m, i) =>
            m.role === 'user' ? (
              <UserBubble key={i} text={m.content} instant />
            ) : (
              <BotBubble key={i} lines={splitBubbles(m.content)} instant />
            )
          )}

          {sending && <TypingBubble />}

          {error && (
            <p className="text-label" style={{ color: 'var(--text-sub)' }}>
              {error}
            </p>
          )}

          {exhausted && (
            <>
              <BotBubble lines={EXHAUSTED_LINES} />
              <motion.div {...optionMotion(0)}>
                <Link
                  href={`/report/${reportId}`}
                  className="flex min-h-[48px] w-full items-center justify-center text-body font-semibold text-white"
                  style={{
                    background: 'var(--button)',
                    borderRadius: 'var(--radius-button)',
                  }}
                >
                  리포트 다시 보기
                </Link>
              </motion.div>
            </>
          )}

          {showButtons && (
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                {messages.length === 0 ? '무엇이 궁금하세요?' : '더 궁금한 게 있으신가요?'}
              </p>

              {left.map((q, i) => (
                <motion.button
                  key={q.id}
                  {...optionMotion(i)}
                  whileTap={tap}
                  type="button"
                  onClick={() =>
                    q.id === FREE_INPUT_ID ? setFreeInput(true) : send(q.label, q.id)
                  }
                  className="min-h-[44px] w-full px-[14px] py-[11px] text-left text-chat"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-button)',
                    color: 'var(--text)',
                  }}
                >
                  {q.label}
                </motion.button>
              ))}
            </div>
          )}

          {freeInput && !sending && !exhausted && (
            <div className="pt-1">
              <TextInputWidget
                placeholder="궁금한 것을 적어 주세요"
                maxLength={FREE_INPUT_MAX}
                skipLabel="추천 질문으로 돌아가기"
                onSkip={() => setFreeInput(false)}
                onSubmit={(v) => send(v)}
              />
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

/**
 * 답변을 말풍선 여러 개로 나눕니다.
 *
 * 3~5문장을 한 덩어리로 두면 대화가 아니라 문서로 읽힙니다. 모델이 문단을
 * 나눠 주면 그대로 쓰고, 한 덩어리로 오면 그대로 둡니다. 문장 단위로 쪼개면
 * 말풍선이 다섯 개가 되어 더 산만합니다.
 */
function splitBubbles(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
}
