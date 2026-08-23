'use client'

/**
 * 내 정보 수정 (PRD 11.5)
 *
 * 수정 가능 항목은 이름, 생년월일, 태어난 시간입니다.
 * 태어난 시간을 모른다고 입력한 사용자가 나중에 알게 되는 경우가 있어
 * 모름 상태에서 입력으로 전환할 수 있어야 합니다 (4.3.3의 재입력 유도와 연결).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export interface ProfileValues {
  name: string | null
  birthDate: string | null
  birthTime: string | null
  hasBirthTime: boolean
}

export default function ProfileForm({ initial }: { initial: ProfileValues }) {
  const router = useRouter()

  const [name, setName] = useState(initial.name ?? '')
  const [birthDate, setBirthDate] = useState(initial.birthDate ?? '')
  const [hasBirthTime, setHasBirthTime] = useState(initial.hasBirthTime)
  const [birthTime, setBirthTime] = useState(initial.birthTime?.slice(0, 5) ?? '')

  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) return

    setBusy(true)
    setError(null)
    setSaved(false)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setBusy(false)
      setError('로그인이 필요해요.')
      return
    }

    const { error: err } = await supabase
      .from('profiles')
      .update({
        name: name.trim() || null,
        birth_date: birthDate || null,
        birth_time: hasBirthTime && birthTime ? birthTime : null,
        has_birth_time: hasBirthTime,
      })
      .eq('id', user.id)

    setBusy(false)

    if (err) {
      setError('저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
      return
    }

    setSaved(true)
    router.refresh()
  }

  const field = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-button)',
    color: 'var(--text)',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-screen pt-4">
      <div>
        <label htmlFor="name" className="text-label" style={{ color: 'var(--text-sub)' }}>
          이름
        </label>
        <input
          id="name"
          type="text"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 (선택)"
          className="mt-1 min-h-[48px] w-full px-4 text-body"
          style={field}
        />
      </div>

      <div>
        <label htmlFor="birthDate" className="text-label" style={{ color: 'var(--text-sub)' }}>
          생년월일
        </label>
        <input
          id="birthDate"
          type="date"
          value={birthDate}
          min="1940-01-01"
          onChange={(e) => setBirthDate(e.target.value)}
          className="mt-1 min-h-[48px] w-full px-4 text-body"
          style={field}
        />
      </div>

      <div>
        <span className="text-label" style={{ color: 'var(--text-sub)' }}>
          태어난 시간
        </span>

        <label className="mt-2 flex min-h-[44px] items-center gap-2 text-body">
          <input
            type="checkbox"
            checked={!hasBirthTime}
            onChange={(e) => setHasBirthTime(!e.target.checked)}
          />
          모르겠어요
        </label>

        {hasBirthTime && (
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="mt-1 min-h-[48px] w-full px-4 text-body"
            style={field}
          />
        )}
      </div>

      <p
        className="p-card text-label"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          color: 'var(--text-sub)',
        }}
      >
        생년월일시를 수정하면 앞으로 보는 결과에 반영됩니다. 이미 구매하신 리포트는
        구매 시점 기준으로 유지됩니다.
      </p>

      {error && (
        <p className="text-label" style={{ color: 'var(--score-low)' }}>
          {error}
        </p>
      )}
      {saved && (
        <p className="text-label" style={{ color: 'var(--score-high)' }}>
          저장했어요.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="min-h-[52px] w-full text-body font-semibold text-white disabled:opacity-40"
        style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
      >
        {busy ? '저장 중' : '저장하기'}
      </button>
    </form>
  )
}
