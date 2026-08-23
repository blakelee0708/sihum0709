'use client'

/**
 * 유형 설명 모달 (PRD 7.5)
 *
 * "전체 이용자 중 N%"는 데이터가 충분히 쌓인 후 활성화합니다.
 * 초기에는 숨깁니다 (characters.ts의 SHOW_TYPE_DISTRIBUTION).
 */

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

import {
  SHOW_TYPE_DISTRIBUTION,
  TYPE_DISTRIBUTION,
  type TypeBadge,
} from '@/lib/content/characters'

interface Props {
  badge: TypeBadge
  description: string
  onClose: () => void
  onShare: () => void
}

export default function TypeModal({ badge, description, onClose, onShare }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const share = SHOW_TYPE_DISTRIBUTION && TYPE_DISTRIBUTION

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(26, 29, 38, 0.4)' }}
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`${badge.name} 유형 설명`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md p-card"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
        }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-11 w-11 items-center justify-center"
            style={{ color: 'var(--text-sub)' }}
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="text-center">
          <p className="text-4xl" aria-hidden>
            {badge.icon}
          </p>
          <p className="mt-2 text-headline" style={{ color: badge.color }}>
            {badge.name}
          </p>
          <p className="mt-1 text-body" style={{ color: 'var(--text-sub)' }}>
            {badge.element}({badge.hanja}) 기운이 강한 유형
          </p>
        </div>

        <p className="mt-4 text-body">{description}</p>

        {share && (
          <p className="mt-3 text-label" style={{ color: 'var(--text-sub)' }}>
            전체 이용자 중 {TYPE_DISTRIBUTION![badge.element]}%
          </p>
        )}

        <button
          type="button"
          onClick={onShare}
          className="mt-5 min-h-[48px] w-full text-body font-semibold text-white"
          style={{
            background: 'var(--button)',
            borderRadius: 'var(--radius-button)',
          }}
        >
          내 유형 공유하기
        </button>
      </div>
    </div>
  )
}
