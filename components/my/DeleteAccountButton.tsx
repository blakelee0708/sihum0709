'use client'

/**
 * 회원 탈퇴 (PRD 11.6)
 *
 * 개인정보보호법상 파기 요구권에 해당하므로 필수 기능입니다.
 *
 * 처리 순서는 DB 함수 delete_own_account()에 있습니다.
 *   1. payments.user_id를 null로 (결제 이력 보존, 전자상거래법 5년)
 *   2. auth.users 삭제
 *   3. profiles, queries, reports는 cascade로 삭제
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function DeleteAccountButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!isSupabaseConfigured) return
    setBusy(true)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase.rpc('delete_own_account')

    if (err) {
      setBusy(false)
      setError('탈퇴 처리에 실패했어요. 문의하기로 알려주시면 처리해 드릴게요.')
      return
    }

    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="min-h-[48px] w-full text-body"
        style={{ color: 'var(--text-sub)' }}
      >
        회원 탈퇴
      </button>
    )
  }

  return (
    <div
      className="p-card"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border)',
      }}
    >
      <p className="text-body">
        탈퇴하면 저장된 결과와 구매한 리포트가 모두 삭제되며 복구할 수 없습니다.
      </p>

      {error && (
        <p className="mt-2 text-label" style={{ color: 'var(--score-low)' }}>
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="min-h-[44px] flex-1 text-body"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            color: 'var(--text)',
          }}
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="min-h-[44px] flex-1 text-body font-semibold text-white disabled:opacity-40"
          style={{ background: 'var(--score-low)', borderRadius: 'var(--radius-button)' }}
        >
          {busy ? '처리 중' : '탈퇴 확정'}
        </button>
      </div>
    </div>
  )
}
