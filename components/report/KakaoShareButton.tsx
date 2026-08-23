'use client'

/**
 * 카카오톡으로 나에게 보내기 (PRD 8.16)
 *
 * 저장한 이미지는 사진첩에서 다시 찾지 않지만, 카카오톡에 남은 링크는
 * 시험 전날과 당일에 다시 열립니다.
 *
 * 구글, 이메일 로그인 사용자는 링크 복사로 대체합니다.
 */

import { useState } from 'react'
import { Copy, Send } from 'lucide-react'

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
   * TODO: 사용자 확인 필요
   * 카카오 개발자 앱 등록과 talk_message 스코프 동의가 끝나야 동작합니다.
   * 그 전까지는 링크 복사로 대체합니다.
   */
  async function handleKakao() {
    setNotice('카카오 나에게 보내기는 준비 중이에요. 링크를 복사해서 보내주세요.')
    await handleCopy()
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
          ? '카카오톡으로 나에게 보내기'
          : copied
            ? '링크를 복사했어요'
            : '리포트 링크 복사'}
      </button>

      {notice && (
        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          {notice}
        </p>
      )}
    </div>
  )
}
