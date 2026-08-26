'use client'

/**
 * 숫자 카운트업 (FIX_3 [10]-4)
 *
 * 0에서 값까지 1.2초에 걸쳐 올라갑니다. 처음부터 78이 적혀 있으면
 * 그냥 인쇄된 숫자지만, 올라가면 방금 계산된 값으로 읽힙니다.
 *
 * ── 서버 렌더에서도 최종 값을 씁니다 ──
 *
 * 첫 렌더에 0을 쓰면 자바스크립트가 늦는 환경에서 0점으로 보입니다.
 * 값 자체를 그리고, 마운트된 뒤에 0으로 되돌렸다가 올립니다. 화면에
 * 잠깐 값이 스치지만 0으로 굳는 것보다 낫습니다.
 *
 * ── 화면이 안 보이는 동안에는 시작하지 않습니다 ──
 *
 * 배경 탭에서는 requestAnimationFrame이 멈춰 있어 카운트업이 0에서
 * 진행되지 않습니다. 다른 애니메이션이라면 나중에 재생되고 말지만,
 * 점수는 0으로 적혀 있으면 틀린 숫자를 보여주는 것이 됩니다.
 * 그래서 안 보이는 동안에는 최종 값을 적어두고, 화면이 돌아온 뒤에
 * 올립니다.
 */

import { useEffect, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

import { COUNT_UP_DURATION } from '@/lib/motion'

interface Props {
  value: number
  /** 시작이 늦어야 할 때 (초) */
  delay?: number
  /** '%' 같은 꼬리표 */
  suffix?: string
}

export default function CountUp({ value, delay = 0, suffix = '' }: Props) {
  const shouldReduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(value)
      return
    }

    let controls: { stop: () => void } | null = null

    function start() {
      setDisplay(0)
      controls = animate(0, value, {
        duration: COUNT_UP_DURATION,
        delay,
        ease: 'easeOut',
        onUpdate: (v) => setDisplay(Math.round(v)),
      })
    }

    if (!document.hidden) {
      start()
      return () => controls?.stop()
    }

    // 화면이 돌아오면 그때 올립니다. 그전까지는 최종 값이 적혀 있습니다
    setDisplay(value)
    const onVisible = () => {
      if (document.hidden) return
      document.removeEventListener('visibilitychange', onVisible)
      start()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      controls?.stop()
    }
  }, [value, delay, shouldReduceMotion])

  return (
    <>
      {display}
      {suffix}
    </>
  )
}
