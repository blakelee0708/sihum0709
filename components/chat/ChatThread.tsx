'use client'

/**
 * 대화 컨테이너 (PRD 14.6, 14.8)
 *
 * - 새 말풍선이 추가될 때마다 하단으로 자동 스크롤합니다
 * - visualViewport로 키보드 높이 변화를 감지해 보정합니다
 * - 답변마다 sessionStorage에 저장하고, 진입 시 복원합니다
 * - 복원할 때는 모션 없이 즉시 표시합니다
 * - 이전 답변 말풍선을 탭하면 그 단계로 돌아갑니다
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'

import {
  SESSION_KEY,
  formatAnswer,
  getSteps,
  resetFrom,
  type Answers,
  type Step,
  type StepId,
} from '@/lib/content/chat-flow'
import {
  NEXT_QUESTION_DELAY_MS,
  OPTION_DELAY_MS,
  optionMotion,
} from '@/lib/motion'
import { track } from '@/lib/analytics'
import type { ExamType, CompanyScale, WorkType } from '@/lib/saju/constants'

import BotBubble from './BotBubble'
import UserBubble from './UserBubble'
import OptionButtons from './OptionButtons'
import TextInputWidget from './TextInputWidget'
import DatePickerWidget from './DatePickerWidget'
import TimePickerWidget from './TimePickerWidget'

interface Props {
  /** 대화가 끝나고 [결과 보기]를 눌렀을 때 */
  onFinish: (answers: Answers) => void
  finishLabel?: string
}

export default function ChatThread({ onFinish, finishLabel = '결과 보기' }: Props) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [answers, setAnswers] = useState<Answers>({})
  const [restored, setRestored] = useState(false)
  /** 복원 직후에는 모션 없이 즉시 그립니다 */
  const [instant, setInstant] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)
  const [showWidget, setShowWidget] = useState(false)
  /** 시험명 단계에서 직접 입력을 고른 상태 */
  const [freeInput, setFreeInput] = useState(false)

  const steps = getSteps(answers)
  const current = steps[steps.length - 1]
  const previous = steps.slice(0, -1)

  // 진입 시 복원 (PRD 14.8)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { answers?: Answers }
        if (parsed.answers) {
          setAnswers(parsed.answers)
          setInstant(true)
        }
      }
    } catch {
      // 저장된 값이 깨졌으면 처음부터 시작합니다
    }
    setRestored(true)
    setShowQuestion(true)
    setShowWidget(true)
  }, [])

  // 답변마다 저장 (개인정보이므로 localStorage 대신 세션 범위)
  useEffect(() => {
    if (!restored) return
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ step: steps.length, answers })
      )
    } catch {
      // 저장 실패는 무시합니다. 대화는 계속 진행됩니다
    }
  }, [answers, restored, steps.length])

  // 새 질문 등장 타이밍 (PRD 14.6)
  const stepCount = steps.length
  useEffect(() => {
    if (!restored || instant) return

    setShowQuestion(false)
    setShowWidget(false)

    const t1 = setTimeout(() => setShowQuestion(true), NEXT_QUESTION_DELAY_MS)
    const t2 = setTimeout(
      () => setShowWidget(true),
      NEXT_QUESTION_DELAY_MS + OPTION_DELAY_MS
    )
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [stepCount, restored, instant])

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [stepCount, showQuestion, showWidget, scrollToBottom])

  // 키보드가 올라오면 입력창이 가려지므로 보정합니다 (PRD 14.6)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handler = () => scrollToBottom()
    vv.addEventListener('resize', handler)
    return () => vv.removeEventListener('resize', handler)
  }, [scrollToBottom])

  function answer(id: StepId, value: unknown) {
    setInstant(false)
    setFreeInput(false)
    // 어느 단계까지 왔는지만 남깁니다. 답변 내용은 기록하지 않습니다
    track('chat_step_answered', { step: id })
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  /** 이전 답변을 탭하면 그 단계로 돌아가고 이후 답변은 초기화합니다 */
  function editFrom(id: StepId) {
    setInstant(true)
    setFreeInput(false)
    setAnswers((prev) => resetFrom(prev, id))
  }

  return (
    <div className="flex h-[100dvh] flex-col" style={{ background: 'var(--bg)' }}>
      <header className="flex items-center px-2 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로"
          className="flex h-11 w-11 items-center justify-center"
          style={{ color: 'var(--text)' }}
        >
          <ChevronLeft size={24} aria-hidden />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-screen pb-6"
        role="log"
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-md flex-col gap-[14px]">
          {previous.map((step) => {
            const text = formatAnswer(step, answers)
            return (
              <div key={step.id} className="flex flex-col gap-[14px]">
                <BotBubble lines={step.question} instant />
                {text && (
                  <UserBubble
                    text={text}
                    instant
                    onEdit={() => editFrom(step.id)}
                  />
                )}
              </div>
            )
          })}

          {current && showQuestion && (
            <BotBubble lines={current.question} instant={instant} />
          )}

          {current && showWidget && (
            <div className="pt-1">
              <StepWidget
                step={current}
                freeInput={freeInput}
                onFreeInput={() => setFreeInput(true)}
                onAnswer={answer}
                onFinish={() => onFinish(answers)}
                finishLabel={finishLabel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface WidgetProps {
  step: Step
  freeInput: boolean
  onFreeInput: () => void
  onAnswer: (id: StepId, value: unknown) => void
  onFinish: () => void
  finishLabel: string
}

function StepWidget({
  step,
  freeInput,
  onFreeInput,
  onAnswer,
  onFinish,
  finishLabel,
}: WidgetProps) {
  switch (step.widget) {
    case 'options':
      return (
        <OptionButtons
          options={step.options ?? []}
          onSelect={(v) => onAnswer(step.id, castValue(step.id, v))}
        />
      )

    case 'optionsWithFreeInput':
      if (freeInput) {
        return (
          <TextInputWidget
            placeholder={step.placeholder}
            onSubmit={(v) => onAnswer(step.id, v)}
          />
        )
      }
      return (
        <OptionButtons
          options={step.options ?? []}
          onSelect={(v) => onAnswer(step.id, v)}
          freeInputLabel="직접 입력할게요"
          onFreeInput={onFreeInput}
          freeInputIcon="keyboard"
        />
      )

    case 'text':
      return (
        <TextInputWidget
          placeholder={step.placeholder}
          skipLabel={step.skipLabel}
          onSubmit={(v) => onAnswer(step.id, v)}
          onSkip={step.skipLabel ? () => onAnswer(step.id, null) : undefined}
        />
      )

    case 'date':
      return (
        <DatePickerWidget
          mode={step.id === 'birthDate' ? 'birth' : 'exam'}
          onSubmit={(v) => onAnswer(step.id, v)}
        />
      )

    case 'time':
      return (
        <TimePickerWidget
          skipLabel={step.skipLabel ?? '모르겠어요'}
          onSubmit={(v) => onAnswer(step.id, v)}
          onSkip={() => onAnswer(step.id, null)}
        />
      )

    case 'finish':
      return (
        <motion.button
          {...optionMotion(0)}
          type="button"
          onClick={() => {
            track('chat_completed')
            onFinish()
          }}
          className="min-h-[44px] w-full py-3 text-chat text-white"
          style={{
            background: 'var(--button)',
            borderRadius: 'var(--radius-button)',
            boxShadow: 'var(--shadow-button)',
          }}
        >
          {finishLabel}
        </motion.button>
      )
  }
}

/** 버튼 값은 문자열이지만 답변 타입은 각기 다릅니다 */
function castValue(id: StepId, value: string): unknown {
  if (id === 'examType') return value as ExamType
  if (id === 'companyScale') return value as CompanyScale
  if (id === 'workType') return value as WorkType
  return value
}
