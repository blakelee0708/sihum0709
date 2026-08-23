'use client'

/**
 * 방식별 결제 유도 CTA (PRD 14.9)
 *
 * 필기와 면접은 잠긴 항목 4개와 결제 버튼을,
 * 실기는 준비 중 안내와 알림 받기를 노출합니다 (PRD 8.2).
 */

import Link from 'next/link'
import { Lock } from 'lucide-react'

import type { ExamType } from '@/lib/saju/constants'

const LOCKED: Record<'필기' | '면접', { heading: string[]; items: string[] }> = {
  필기: {
    heading: ['시험 전 7일, 어떻게 보내야', '할까요?'],
    items: [
      '7일 데일리 플랜',
      '당일 시간대별 운용',
      '과목별 시간 배분',
      '놓치기 쉬운 3가지',
    ],
  },
  면접: {
    heading: ['실제 면접 보는 기업을', '알려주시면'],
    items: [
      '기업과 나의 궁합',
      '이 직무와 나',
      '들어올 가능성이 높은 질문',
      '조심해야 할 3가지',
    ],
  },
}

export const PRICE = 3900

interface Props {
  examType: ExamType
  /** 결제 흐름 진입 경로 */
  href: string
  onNotify?: () => void
}

export default function LockedCTA({ examType, href, onNotify }: Props) {
  if (examType === '실기') {
    return (
      <section className="px-screen pt-section">
        <div
          className="p-card text-center"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <p className="text-body">실기 시험 상세 리포트는 준비 중입니다.</p>
          <button
            type="button"
            onClick={onNotify}
            className="mt-4 min-h-[48px] w-full text-body font-semibold text-white"
            style={{
              background: 'var(--button)',
              borderRadius: 'var(--radius-button)',
            }}
          >
            알림 받기
          </button>
        </div>
      </section>
    )
  }

  const spec = LOCKED[examType]

  return (
    <section className="px-screen pt-section">
      <div
        className="p-card"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <p className="text-card-title">
          {spec.heading[0]}
          <br />
          {spec.heading[1]}
        </p>

        <ul className="mt-4 space-y-2">
          {spec.items.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-body"
              style={{ color: 'var(--text-sub)' }}
            >
              <Lock size={16} aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        <Link
          href={href}
          className="mt-5 flex min-h-[52px] w-full items-center justify-center text-body font-semibold text-white"
          style={{
            background: 'var(--button)',
            borderRadius: 'var(--radius-button)',
            boxShadow: 'var(--shadow-button)',
          }}
        >
          {PRICE.toLocaleString()}원으로 보기
        </Link>
      </div>
    </section>
  )
}
