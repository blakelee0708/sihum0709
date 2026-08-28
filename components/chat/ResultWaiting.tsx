'use client'

/**
 * 결과가 나오기까지 (FIX_4 [2]-2)
 *
 * 대화가 끝나고 결과 화면으로 넘어가기 전에 덮는 화면입니다.
 *
 * 계산은 즉시 끝납니다. 그런데 즉시 넘어가면 "미리 만들어 둔 것"으로
 * 읽힙니다. 첫 방문은 5초, 재방문은 2초 기다리고 그동안 문구가 1.5초마다
 * 바뀝니다. 기다림이 아니라 볼 것이 되게 만드는 시간입니다.
 *
 * 문구 전환은 AnimatePresence의 mode="wait"입니다. 나가는 문구가 완전히
 * 사라진 뒤 다음 문구가 들어옵니다. 겹치면 두 줄이 한꺼번에 보입니다.
 *
 * 뒤에 남은 대화 화면은 가립니다. 대화가 그대로 보이면 아직 입력 단계인지
 * 헷갈립니다.
 */

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import DotsLoader from '@/components/motion/DotsLoader'
import { CHARACTER_PROFILE } from '@/lib/content/characters'
import { WAIT_MESSAGE_INTERVAL_MS } from '@/lib/motion'

interface Props {
  messages: string[]
}

export default function ResultWaiting({ messages }: Props) {
  const shouldReduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (messages.length <= 1) return

    const t = setInterval(() => {
      // 마지막 문구에서 멈춥니다. 대기가 끝나면 시트가 덮습니다
      setIndex((i) => Math.min(i + 1, messages.length - 1))
    }, WAIT_MESSAGE_INTERVAL_MS)

    return () => clearInterval(t)
  }, [messages.length])

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 px-screen"
      style={{ background: 'var(--bg)' }}
      role="status"
      aria-live="polite"
    >
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Image
          src={CHARACTER_PROFILE}
          alt=""
          width={72}
          height={72}
          aria-hidden
          priority
        />
      </motion.div>

      <div className="flex min-h-[56px] items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            className="whitespace-pre-line text-center text-body font-semibold"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>

      <DotsLoader color="var(--primary)" />
    </div>
  )
}
