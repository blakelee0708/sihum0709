'use client'

/**
 * 카카오톡으로 나에게 보내기 (PRD 8.16, 11.3, FIX_4 [4]-2)
 *
 * 저장한 이미지는 사진첩에서 다시 찾지 않지만, 카카오톡에 남은 링크는
 * 시험 전날과 당일에 다시 열립니다.
 *
 * ── 권한은 여기서 받습니다 ──
 *
 * 나에게 보내기(talk_message)는 로그인할 때 받지 않습니다. 동의 화면에
 * 항목이 많으면 로그인 자리에서 이탈하기 때문입니다. 리포트를 다 읽고
 * 이 버튼을 누른 사람은 이미 서비스를 신뢰하는 상태라 동의율이 다릅니다.
 *
 * 권한이 없으면 카카오 동의 화면으로 한 번 더 보냅니다. 돌아올 곳은 지금
 * 보고 있는 리포트입니다.
 *
 * 구글, 이메일 로그인 사용자는 링크 복사로 대체합니다.
 */

import { useState } from 'react'
import { Copy, Send } from 'lucide-react'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

interface Props {
  reportId: string
  /** 카카오 로그인 사용자만 나에게 보내기가 가능합니다 */
  isKakaoUser: boolean
}

export default function KakaoShareButton({ reportId, isKakaoUser }: Props) {
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/report/${reportId}`
      : ''

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setNotice('링크를 복사하지 못했어요. 주소창의 주소를 직접 복사해 주세요.')
    }
  }

  /**
   * 나에게 보내기 권한을 추가로 요청합니다 (FIX_4 [4]-2).
   *
   * TODO: 사용자 확인 필요
   * 카카오 개발자 앱의 talk_message 권한 신청이 끝나야 실제로 전송됩니다.
   * 지금은 동의를 받아도 보낼 API가 없으므로 링크 복사로 마무리합니다.
   */
  async function handleKakao() {
    if (!isSupabaseConfigured) {
      setNotice('카카오 나에게 보내기는 준비 중이에요. 링크를 복사해서 보내주세요.')
      await handleCopy()
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        scopes: 'talk_message',
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/report/${reportId}`)}`,
      },
    })

    if (error) {
      setNotice('카카오 나에게 보내기는 준비 중이에요. 링크를 복사해서 보내주세요.')
      await handleCopy()
    }
  }

  const style = {
    background: isKakaoUser ? '#FEE500' : 'var(--surface)',
    border: isKakaoUser ? undefined : '1px solid var(--border)',
    borderRadius: 'var(--radius-button)',
    color: isKakaoUser ? '#191600' : 'var(--text)',
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={isKakaoUser ? handleKakao : handleCopy}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 text-body font-semibold"
        style={style}
      >
        {isKakaoUser ? <Send size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
        {isKakaoUser
          ? '카카오톡으로 저장하기'
          : copied
            ? '링크를 복사했어요'
            : '리포트 링크 복사'}
      </button>

      {isKakaoUser && (
        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          카카오톡 나에게 보내기 권한을 이때 한 번만 확인합니다.
        </p>
      )}

      {notice && (
        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          {notice}
        </p>
      )}
    </div>
  )
}
