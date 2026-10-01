'use client'

/**
 * 등장 효과 스위치 (FIX_5 [7]-1)
 *
 * 랜딩 루트에 `js` 클래스를 붙이고, `.rise` 요소를 IntersectionObserver로
 * 지켜보다 화면에 들어오면 `in`을 붙입니다. 한 번 나타난 요소는 관찰을
 * 끊어 다시 재생하지 않습니다.
 *
 * ── useLayoutEffect로 클래스를 붙이는 이유 ──
 *
 * useEffect는 첫 페인트 뒤에 돕니다. 그 사이 한 프레임 동안 내용이 그대로
 * 보였다가 숨었다가 다시 올라와 깜빡입니다. useLayoutEffect는 페인트 전에
 * 돌아 그 깜빡임이 없습니다.
 *
 * 서버에서는 useLayoutEffect가 경고를 내므로 effect를 쓰되, 이 컴포넌트는
 * 클라이언트 전용이라 실행 시점에는 문제가 없습니다. React가 SSR 중
 * 경고하는 것을 피하려고 아래처럼 분기해 둡니다.
 *
 * ── window scroll 이벤트를 쓰지 않습니다 ──
 *
 * 스크롤 이벤트는 매 프레임 레이아웃을 읽어 모바일에서 끊깁니다.
 * IntersectionObserver는 브라우저가 알아서 묶어 알려줍니다.
 */

import { useEffect, useLayoutEffect, useRef } from 'react'

/** 요소가 이만큼 보이면 등장시킵니다 */
const THRESHOLD = 0.12

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function RiseEffects({ rootId }: { rootId: string }) {
  const done = useRef(false)

  useIsomorphicLayoutEffect(() => {
    if (done.current) return
    done.current = true

    const root = document.getElementById(rootId)
    if (!root) return

    root.classList.add('js')

    const items = Array.from(root.querySelectorAll<HTMLElement>('.rise'))

    // 지원하지 않는 브라우저에서는 전부 최종 상태로 둡니다
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('in')
          io.unobserve(entry.target)
        }
      },
      { threshold: THRESHOLD }
    )

    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [rootId])

  return null
}
