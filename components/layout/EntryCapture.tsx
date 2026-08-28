'use client'

/**
 * 유입 처리 (FIX_4 [5]-2, [5]-3)
 *
 * 어느 화면으로 들어오든 한 번은 지나가야 하므로 레이아웃에 둡니다.
 *
 *   https://www.sajudday.com?c=A7K2M9
 *
 * 이렇게 들어오면 쿠폰 코드를 세션에 담아 결제 화면까지 들고 갑니다.
 * 사용자가 코드를 복사해서 붙여넣을 필요가 없어야 합니다.
 *
 * 어디서 왔는지도 함께 남깁니다. 로그인 전에는 보낼 곳이 없으므로 세션에
 * 두고, 로그인한 뒤에 프로필에 한 번만 기록합니다. 이미 기록된 사용자는
 * 서버가 덮어쓰지 않습니다. 처음 어디서 왔는지가 알고 싶은 값이라
 * 나중 방문 경로로 바뀌면 안 됩니다.
 *
 * 화면에 아무것도 그리지 않습니다.
 */

import { useEffect } from 'react'

import { COUPON_PARAM, saveCoupon } from '@/lib/coupon'

/** 세션에 담아 두는 유입 경로 */
const SOURCE_KEY = 'entry-source'

/** 프로필에 이미 기록했는지 (기기당 한 번) */
const RECORDED_KEY = 'entry-source-recorded'

function detectSource(params: URLSearchParams): string {
  if (params.get(COUPON_PARAM)) return '457deep'

  const explicit = params.get('utm_source') ?? params.get('s')
  if (explicit) return explicit.slice(0, 40)

  return 'organic'
}

export default function EntryCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const code = params.get(COUPON_PARAM)
    if (code) saveCoupon(code)

    try {
      // 첫 유입만 남깁니다. 두 번째부터는 덮어쓰지 않습니다
      if (!sessionStorage.getItem(SOURCE_KEY)) {
        sessionStorage.setItem(SOURCE_KEY, detectSource(params))
      }
    } catch {
      // 저장을 못 하면 유입 기록만 포기합니다. 다른 기능에는 지장이 없습니다
    }

    void recordSource()
  }, [])

  return null
}

/**
 * 로그인한 사용자라면 프로필에 유입 경로를 남깁니다.
 *
 * 로그인 전에는 401이 돌아오고 세션 값은 그대로 남습니다. 로그인 후
 * 아무 화면이나 열리면 그때 다시 시도해 기록됩니다.
 */
async function recordSource(): Promise<void> {
  let source: string | null = null
  try {
    if (localStorage.getItem(RECORDED_KEY)) return
    source = sessionStorage.getItem(SOURCE_KEY)
  } catch {
    return
  }

  if (!source) return

  try {
    const res = await fetch('/api/profile/source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
    })
    if (!res.ok) return

    localStorage.setItem(RECORDED_KEY, '1')
  } catch {
    // 다음 화면에서 다시 시도합니다
  }
}
