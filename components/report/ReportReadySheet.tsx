'use client'

/**
 * 리포트가 완성됐을 때 올라오는 시트 (FIX_4 [2]-5)
 *
 * 무료 결과와 같은 BottomSheet를 씁니다. 다른 것은 기다린 시간뿐입니다.
 * 무료는 의도적으로 만든 5초, 유료는 실제로 걸리는 150초입니다.
 *
 * ── 왜 플래그를 세션에 두는가 ──
 *
 * 대기 화면(GeneratingState)은 5초마다 router.refresh()를 돌리고,
 * 완료되면 서버 컴포넌트가 완성된 리포트를 그려 대기 화면이 통째로
 * 사라집니다. 즉 "완료됐다"를 아는 순간에 대기 화면은 이미 없습니다.
 *
 * 그래서 대기 화면이 sessionStorage에 "이 리포트를 기다리는 중"이라고
 * 적어 두고, 완성된 리포트가 그 표시를 보고 시트를 띄웁니다. 표시를
 * 지운 뒤에는 새로고침해도 다시 뜨지 않습니다. 나중에 마이페이지에서
 * 다시 열었을 때 "완성됐어요"가 또 뜨면 이상합니다.
 */

import { useEffect, useState } from 'react'
import Image from 'next/image'

import BottomSheet from '@/components/motion/BottomSheet'
import { CHARACTER_NAME } from '@/lib/content/characters'

/** 대기 화면이 남기는 표시 */
export function waitingKey(reportId: string): string {
  return `report-waiting-${reportId}`
}

export default function ReportReadySheet({ reportId }: { reportId: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(waitingKey(reportId))) setOpen(true)
    } catch {
      // 세션을 못 읽으면 시트 없이 리포트를 바로 보여줍니다
    }
  }, [reportId])

  function close() {
    try {
      sessionStorage.removeItem(waitingKey(reportId))
    } catch {
      // 못 지워도 이 화면에서는 다시 열지 않습니다
    }
    setOpen(false)
  }

  return (
    <BottomSheet
      open={open}
      title="리포트가 완성됐어요"
      confirmLabel="보러 갈까요?"
      onConfirm={close}
    >
      <Image
        src="/character/char-04.png"
        alt={`${CHARACTER_NAME}가 리포트를 들고 웃고 있습니다`}
        width={88}
        height={88}
        className="mt-4"
      />
    </BottomSheet>
  )
}
