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
import { motion, useReducedMotion } from 'framer-motion'

import {
  SESSION_KEY,
  formatAnswer,
  getSteps,
  normalizeExamName,
  resetFrom,
  type Answers,
  type Step,
  type StepId,
} from '@/lib/content/chat-flow'
import {
  EASE,
  NEXT_QUESTION_DELAY_MS,
  OPTION_DELAY_MS,
  PAGE_EXIT_DURATION,
  PAGE_EXIT_Y,
  TYPING_MS,
} from '@/lib/motion'
import { track } from '@/lib/analytics'
import type { ExamType, CompanyScale, WorkType } from '@/lib/saju/constants'
import type { ExamPeriod } from '@/lib/content/assemble'

import BotBubble from './BotBubble'
import UserBubble from './UserBubble'
import OptionButtons from './OptionButtons'
import TextInputWidget from './TextInputWidget'
import DateFieldWidget from './DateFieldWidget'
import StartTimeWidget from './StartTimeWidget'
import BirthTimeWidget from './BirthTimeWidget'
import FinishButton from './FinishButton'
import TypingBubble from './TypingBubble'

interface Props {
  /** 대화가 끝나고 [결과 보기]를 눌렀을 때 */
  onFinish: (answers: Answers) => void
  finishLabel?: string
}

export default function ChatThread({ onFinish, finishLabel = '결과 보기' }: Props) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const [answers, setAnswers] = useState<Answers>({})
  const [restored, setRestored] = useState(false)
  /** 복원 직후에는 모션 없이 즉시 그립니다 */
  const [instant, setInstant] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)
  const [showWidget, setShowWidget] = useState(false)
  /** 시험명 단계에서 직접 입력을 고른 상태 */
  const [freeInput, setFreeInput] = useState(false)
  /** 첫 인사 전에만 뜨는 타이핑 표시 (FIX_3 [8]-4) */
  const [typing, setTyping] = useState(false)
  /** 결과로 넘어가기 직전, 화면이 먼저 지워지는 중 (FIX_3 [10]-3) */
  const [leaving, setLeaving] = useState(false)

  const steps = getSteps(answers)
  const current = steps[steps.length - 1]
  const previous = steps.slice(0, -1)

  // 진입 시 복원 (PRD 14.8)
  useEffect(() => {
    let fresh = true
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { answers?: Answers }
        if (parsed.answers) {
          setAnswers(parsed.answers)
          setInstant(true)
          fresh = false
        }
      }
    } catch {
      // 저장된 값이 깨졌으면 처음부터 시작합니다
    }
    setRestored(true)

    // 이어보기로 들어온 사람에게는 타이핑을 보여주지 않습니다.
    // 이미 나눈 대화가 위에 쌓여 있는데 다시 말을 거는 꼴이 됩니다.
    if (!fresh) {
      setShowQuestion(true)
      setShowWidget(true)
      return
    }

    // 첫 인사가 뜨기까지의 320ms를 타이핑 표시로 채웁니다. 말풍선을
    // 띄우는 것은 아래 "새 질문 등장 타이밍" 효과가 맡습니다.
    setTyping(true)
    const t = setTimeout(() => setTyping(false), TYPING_MS)
    return () => clearTimeout(t)
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

  /**
   * 새 말풍선이 뜰 때마다 바닥으로 내립니다 (FIX_3 [8]-5).
   *
   * scrollTop = scrollHeight로 순간이동시키면 방금 뜬 말풍선이 어디서
   * 왔는지 안 보입니다. 부드럽게 따라가면 대화가 이어지는 것으로 읽힙니다.
   *
   * 키보드가 올라올 때는 즉시 내립니다. 그때는 입력창을 가리지 않는 것이
   * 먼저고, 부드럽게 움직이는 동안 손가락이 이미 다른 곳을 누릅니다.
   */
  const scrollToBottom = useCallback(
    (smooth = true) => {
      const target = bottomRef.current
      if (target) {
        target.scrollIntoView({
          behavior: smooth && !shouldReduceMotion ? 'smooth' : 'auto',
          block: 'end',
        })
        return
      }
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    },
    [shouldReduceMotion]
  )

  useEffect(() => {
    scrollToBottom()
  }, [stepCount, showQuestion, showWidget, typing, scrollToBottom])

  // 키보드가 올라오면 입력창이 가려지므로 보정합니다 (PRD 14.6)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handler = () => scrollToBottom(false)
    vv.addEventListener('resize', handler)
    return () => vv.removeEventListener('resize', handler)
  }, [scrollToBottom])

  /** 생년월일 단계에서 음력으로 입력하면 원본을 함께 남깁니다 */
  function answerBirthDate(solar: string, lunarDate?: string) {
    setInstant(false)
    track('chat_step_answered', { step: 'birthDate' })
    setAnswers((prev) => ({ ...prev, birthDate: solar, birthLunarDate: lunarDate }))
  }

  function answer(id: StepId, value: unknown) {
    setInstant(false)
    setFreeInput(false)
    // 어느 단계까지 왔는지만 남깁니다. 답변 내용은 기록하지 않습니다
    track('chat_step_answered', { step: id })

    // 직접 입력한 시험명은 정규화해서 저장하고 원본을 따로 남깁니다 (PRD 10.3).
    // 관리자 화면에서 집계해 프리셋에 추가하려면 표기가 맞아야 합니다.
    if (id === 'examName' && typeof value === 'string' && freeInput) {
      const raw = value
      setAnswers((prev) => ({
        ...prev,
        examName: normalizeExamName(raw),
        examNameRaw: raw,
      }))
      return
    }

    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  /** 이전 답변을 탭하면 그 단계로 돌아가고 이후 답변은 초기화합니다 */
  function editFrom(id: StepId) {
    setInstant(true)
    setFreeInput(false)
    setAnswers((prev) => resetFrom(prev, id))
  }

  /**
   * 결과로 넘어갑니다 (FIX_3 [10]-3).
   *
   * App Router에서 나가는 화면을 AnimatePresence로 붙잡으려면 라우트를
   * 직접 들고 있어야 하고, 그러면 서버 컴포넌트 스트리밍과 프리페치가
   * 어긋납니다 (app/template.tsx 주석). 대신 떠나는 화면이 스스로 먼저
   * 지워지고 나서 이동하면 mode="wait"와 같은 결과가 됩니다.
   */
  function leaveToResult() {
    if (shouldReduceMotion) {
      onFinish(answers)
      return
    }
    setLeaving(true)
    setTimeout(() => onFinish(answers), PAGE_EXIT_DURATION * 1000)
  }

  return (
    <motion.div
      className="flex h-[100dvh] flex-col"
      style={{ background: 'var(--bg)' }}
      animate={leaving ? { opacity: 0, y: PAGE_EXIT_Y } : { opacity: 1, y: 0 }}
      transition={{ duration: PAGE_EXIT_DURATION, ease: EASE }}
    >
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

          {typing && <TypingBubble />}

          {current && showQuestion && (
            <BotBubble lines={current.question} instant={instant} />
          )}

          {current && showWidget && (
            <div className="pt-1">
              <StepWidget
                step={current}
                answers={answers}
                freeInput={freeInput}
                onFreeInput={() => setFreeInput(true)}
                onAnswer={answer}
                onBirthDate={answerBirthDate}
                onEditFrom={editFrom}
                onFinish={leaveToResult}
                finishLabel={finishLabel}
              />
            </div>
          )}

          {/* scrollIntoView가 붙잡을 자리. 높이 0이라 여백을 만들지 않습니다 */}
          <div ref={bottomRef} />
        </div>
      </div>
    </motion.div>
  )
}

interface WidgetProps {
  step: Step
  answers: Answers
  freeInput: boolean
  onFreeInput: () => void
  onAnswer: (id: StepId, value: unknown) => void
  onBirthDate: (solar: string, lunarDate?: string) => void
  onEditFrom: (id: StepId) => void
  onFinish: () => void
  finishLabel: string
}

function StepWidget({
  step,
  answers,
  freeInput,
  onFreeInput,
  onAnswer,
  onBirthDate,
  onEditFrom,
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

    case 'date': {
      const isBirth = step.id === 'birthDate'
      return (
        <DateFieldWidget
          mode={isBirth ? 'birth' : 'exam'}
          // 음력을 골랐으면 입력값을 음력으로 보고 양력으로 바꿉니다
          lunar={
            isBirth && answers.birthCalendar === 'lunar'
              ? { isLeapMonth: answers.birthLeapMonth ?? false }
              : undefined
          }
          onSubmit={(solar, lunarDate) =>
            isBirth ? onBirthDate(solar, lunarDate) : onAnswer(step.id, solar)
          }
        />
      )
    }

    case 'startTime':
      return (
        <StartTimeWidget
          skipLabel={step.skipLabel ?? '모르겠어요'}
          onSubmit={(v) => onAnswer(step.id, v)}
          onSkip={() => onAnswer(step.id, null)}
        />
      )

    case 'birthTime':
      return <BirthTimeWidget onSubmit={(v) => onAnswer(step.id, v)} />

    // 변환한 양력 날짜 확인. "다시 입력할게요"는 생년월일 단계로 되돌립니다
    case 'confirm':
      return (
        <OptionButtons
          options={step.options ?? []}
          onSelect={(v) =>
            v === 'yes' ? onAnswer(step.id, true) : onEditFrom('birthDate')
          }
        />
      )

    case 'finish':
      return (
        <FinishButton
          label={finishLabel}
          onFinish={() => {
            track('chat_completed')
            onFinish()
          }}
        />
      )
  }
}

/** 버튼 값은 문자열이지만 답변 타입은 각기 다릅니다 */
function castValue(id: StepId, value: string): unknown {
  // 예/아니요 버튼은 boolean으로 저장합니다. 'no'를 그대로 넣으면
  // 참으로 취급돼 흐름이 어긋납니다
  if (id === 'birthLeapMonth' || id === 'birthTimeKnown') return value === 'yes'
  if (id === 'examType') return value as ExamType
  if (id === 'companyScale') return value as CompanyScale
  if (id === 'workType') return value as WorkType
  if (id === 'examPeriod') return value as ExamPeriod
  return value
}
