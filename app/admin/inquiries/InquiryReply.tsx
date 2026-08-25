'use client'

/**
 * 문의 답변 작성 (PRD 22.10)
 *
 * 답변을 작성하면 status가 answered로 바뀝니다.
 * 이메일 발송은 아직 붙어 있지 않아 관리자가 직접 회신해야 합니다.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  inquiryId: string
  email: string
  existingReply: string | null
}

export default function InquiryReply({ inquiryId, email, existingReply }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState(existingReply ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function send(status?: 'closed') {
    setBusy(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/inquiry/${inquiryId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status === 'closed' ? { status } : { reply }),
      })

      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setMessage(data.error ?? '저장하지 못했습니다')
        return
      }

      setOpen(false)
      router.refresh()
    } catch {
      setMessage('저장하지 못했습니다')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-[36px] px-3 text-label text-white"
          style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
        >
          {existingReply ? '답변 수정' : '답변 작성'}
        </button>
        <button
          type="button"
          onClick={() => send('closed')}
          disabled={busy}
          className="min-h-[36px] px-3 text-label disabled:opacity-40"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            color: 'var(--text)',
          }}
        >
          완료 처리
        </button>
        <a
          href={`mailto:${email}`}
          className="flex min-h-[36px] items-center px-3 text-label"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            color: 'var(--text)',
          }}
        >
          메일 열기
        </a>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        rows={5}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="답변 내용"
        className="w-full p-3 text-body"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-button)',
          color: 'var(--text)',
        }}
      />

      <p className="text-label" style={{ color: 'var(--text-sub)' }}>
        저장하면 답변 기록만 남습니다. 메일 발송은 아직 붙어 있지 않으니 메일 열기로
        직접 회신해 주십시오.
      </p>

      {message && (
        <p className="text-label" style={{ color: 'var(--score-low)' }}>
          {message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-[36px] flex-1 text-label"
          style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-button)' }}
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => send()}
          disabled={busy || !reply.trim()}
          className="min-h-[36px] flex-1 text-label text-white disabled:opacity-40"
          style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
        >
          {busy ? '저장 중' : '저장'}
        </button>
      </div>
    </div>
  )
}
