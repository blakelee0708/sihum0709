'use client'

/**
 * 알림 설정 (PRD 14.3, 14.13)
 *
 * 웹푸시 알림은 PRD 20장의 2차 확장 항목이라 아직 실제 발송을 붙이지 않았습니다.
 * 화면과 저장 자리만 만들어 두고, 발송 연동은 확장 시점에 붙입니다.
 */

import { useState } from 'react'

import SubHeader from '@/components/layout/SubHeader'

export default function SettingsPage() {
  const [dday, setDday] = useState(true)
  const [marketing, setMarketing] = useState(false)

  const row = {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
  }

  return (
    <main className="mx-auto max-w-md pb-10">
      <SubHeader title="알림 설정" />

      <div className="space-y-card-gap px-screen pt-4">
        <label className="flex min-h-[60px] items-center justify-between p-card" style={row}>
          <span>
            <span className="block text-body">시험 D-day 알림</span>
            <span className="block text-label" style={{ color: 'var(--text-sub)' }}>
              D-7, D-1, 당일 아침에 알려드려요
            </span>
          </span>
          <input
            type="checkbox"
            checked={dday}
            onChange={(e) => setDday(e.target.checked)}
            className="h-5 w-5"
          />
        </label>

        <label className="flex min-h-[60px] items-center justify-between p-card" style={row}>
          <span>
            <span className="block text-body">혜택 · 이벤트 알림</span>
            <span className="block text-label" style={{ color: 'var(--text-sub)' }}>
              선택 항목입니다
            </span>
          </span>
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="h-5 w-5"
          />
        </label>

        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          웹푸시 알림은 준비 중입니다. 설정하신 내용은 알림이 열리는 시점에 적용됩니다.
        </p>
      </div>
    </main>
  )
}
