'use client'

/**
 * 유료 전 추가 입력 (면접 전용) — PRD 14.10
 *
 * CTA 클릭 후 로그인 전에 배치합니다. 입력 구간이므로 대화형을 유지합니다.
 *
 * 기업 설립일은 묻지 않습니다. 지원자가 법인 설립일을 알 가능성이 낮고,
 * 물어보면 요구가 많은 서비스라는 인상을 줍니다.
 */

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'

import BotBubble from '@/components/chat/BotBubble'
import UserBubble from '@/components/chat/UserBubble'
import TextInputWidget from '@/components/chat/TextInputWidget'
import OptionButtons from '@/components/chat/OptionButtons'
import { PAID_SCRIPTS } from '@/lib/content/chat-scripts'
import { PAID_SESSION_KEY, SESSION_KEY, type Answers } from '@/lib/content/chat-flow'
import { NEXT_QUESTION_DELAY_MS, OPTION_DELAY_MS, optionMotion } from '@/lib/motion'

type Step = 'companyName' | 'jobConfirm' | 'jobInput' | 'done'

function PaidChat() {
  const router = useRouter()
  const params = useSearchParams()
  const queryId = params.get('q')
  const scrollRef = useRef<HTMLDivElement>(null)

  const [answers, setAnswers] = useState<Answers>({})
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('companyName')
  const [showWidget, setShowWidget] = useState(false)

  // 무료 단계 답변을 읽어 직무명 입력 여부를 판단합니다
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { answers?: Answers }
        if (parsed.answers) {
          setAnswers(parsed.answers)
          setJobTitle(parsed.answers.jobTitle ?? null)
        }
      }
    } catch {
      // 세션이 없으면 기업명부터 새로 받습니다
    }
    setShowWidget(true)
  }, [])

  useEffect(() => {
    setShowWidget(false)
    const t = setTimeout(
      () => setShowWidget(true),
      NEXT_QUESTION_DELAY_MS + OPTION_DELAY_MS
    )
    return () => clearTimeout(t)
  }, [step])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [step, showWidget])

  function finish(company: string, job: string | null) {
    try {
      sessionStorage.setItem(
        PAID_SESSION_KEY,
        JSON.stringify({ companyName: company, jobTitle: job })
      )
      // 무료 단계 답변에도 직무명을 반영해 둡니다
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ answers: { ...answers, jobTitle: job } })
      )
    } catch {
      // 저장 실패해도 결제 화면에서 다시 물어볼 수 있습니다
    }

    const q = queryId ? `?q=${queryId}` : ''
    router.push(`/checkout${q}`)
  }

  function handleCompany(value: string) {
    setCompanyName(value)
    // 무료 단계에서 직무명을 입력했으면 확인만, 건너뛰었으면 입력을 요청합니다
    setStep(jobTitle ? 'jobConfirm' : 'jobInput')
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-screen pb-6" role="log">
        <div className="mx-auto flex max-w-md flex-col gap-[14px]">
          <BotBubble lines={[...PAID_SCRIPTS.companyName]} />

          {companyName && <UserBubble text={companyName} instant />}

          {step === 'jobConfirm' && (
            <BotBubble
              lines={PAID_SCRIPTS.jobConfirm.map((s) =>
                s.replace('{jobTitle}', jobTitle ?? '')
              )}
            />
          )}

          {step === 'jobInput' && <BotBubble lines={[...PAID_SCRIPTS.jobInput]} />}

          {showWidget && (
            <div className="pt-1">
              {step === 'companyName' && (
                <TextInputWidget
                  placeholder="예) 삼성전자"
                  onSubmit={handleCompany}
                />
              )}

              {step === 'jobConfirm' && (
                <OptionButtons
                  options={[
                    { value: 'yes', label: '네, 맞아요' },
                    { value: 'no', label: '수정할게요' },
                  ]}
                  onSelect={(v) => {
                    if (v === 'yes') finish(companyName!, jobTitle)
                    else setStep('jobInput')
                  }}
                />
              )}

              {step === 'jobInput' && (
                <TextInputWidget
                  placeholder="예) 반도체 공정기술"
                  onSubmit={(v) => finish(companyName!, v)}
                />
              )}
            </div>
          )}

          {step === 'done' && (
            <motion.p {...optionMotion(0)} className="text-body">
              결제 화면으로 이동합니다.
            </motion.p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaidInputPage() {
  return (
    <Suspense>
      <PaidChat />
    </Suspense>
  )
}
