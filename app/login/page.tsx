'use client'

/**
 * 로그인 (PRD 11.1, 11.2, 11.3)
 *
 * 로그인은 강제하지 않습니다. 결제, 결과 저장, 마이페이지 진입에서만 요청합니다.
 * 탭바는 숨깁니다 (PRD 14.2).
 *
 * 이메일 로그인은 실제로 동작합니다.
 * 카카오와 구글은 OAuth 앱 등록이 끝나야 동작합니다.
 */

import { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Mail } from 'lucide-react'

import { CHARACTER_NAME } from '@/lib/content/characters'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/my'

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isSupabaseConfigured) {
      setError('로그인 설정이 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.')
      return
    }

    setBusy(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    setBusy(false)

    if (err) {
      setError('메일을 보내지 못했어요. 주소를 확인해 주세요.')
      return
    }
    setSent(true)
  }

  /**
   * TODO: 사용자 확인 필요
   * 카카오 / 구글 OAuth 앱 등록과 Supabase Auth Provider 설정이 끝나야 동작합니다.
   * 카카오는 나에게 보내기를 위해 talk_message 스코프를 함께 요청합니다 (PRD 11.3).
   */
  async function handleOAuth(provider: 'kakao' | 'google') {
    if (!isSupabaseConfigured) {
      setError('소셜 로그인은 준비 중이에요. 이메일로 로그인해 주세요.')
      return
    }

    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        scopes: provider === 'kakao' ? 'talk_message' : undefined,
      },
    })

    if (err) {
      setError('소셜 로그인은 준비 중이에요. 이메일로 로그인해 주세요.')
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col">
      <header className="flex items-center px-2 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로"
          className="flex h-11 w-11 items-center justify-center"
          style={{ color: 'var(--text)' }}
        >
          <ChevronLeft size={24} aria-hidden />
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-center px-screen pb-10">
        <Image
          src="/character/char-03.png"
          alt={`차분하게 정면을 보고 있는 ${CHARACTER_NAME}`}
          width={160}
          height={160}
          className="mx-auto h-[140px] w-[140px] object-contain"
        />

        <h1 className="mt-2 text-center text-headline">
          로그인하고
          <br />
          결과를 저장하세요
        </h1>
        <p
          className="mt-2 text-center text-body"
          style={{ color: 'var(--text-sub)' }}
        >
          다음에 입력 없이 볼 수 있어요
        </p>

        <div className="mt-8 space-y-2">
          <button
            type="button"
            onClick={() => handleOAuth('kakao')}
            className="flex min-h-[52px] w-full items-center justify-center text-body font-semibold"
            style={{ background: '#FEE500', borderRadius: 'var(--radius-button)', color: '#191600' }}
          >
            카카오로 시작하기
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="flex min-h-[52px] w-full items-center justify-center text-body font-semibold"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              color: 'var(--text)',
            }}
          >
            구글로 시작하기
          </button>
        </div>

        <div className="mt-6">
          {sent ? (
            <div
              className="p-card text-center"
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              <Mail size={20} aria-hidden className="mx-auto" style={{ color: 'var(--primary)' }} />
              <p className="mt-2 text-body">{email}으로 로그인 링크를 보냈어요.</p>
              <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
                메일함을 확인해 주세요.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmail} className="space-y-2">
              <label htmlFor="email" className="block text-label" style={{ color: 'var(--text-sub)' }}>
                이메일로 로그인
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-h-[48px] w-full px-4 text-body"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
                  color: 'var(--text)',
                }}
              />
              <button
                type="submit"
                disabled={busy}
                className="min-h-[48px] w-full text-body font-semibold text-white disabled:opacity-40"
                style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
              >
                {busy ? '보내는 중' : '로그인 링크 받기'}
              </button>
            </form>
          )}

          {error && (
            <p className="mt-3 text-label" style={{ color: 'var(--score-low)' }}>
              {error}
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-label" style={{ color: 'var(--text-sub)' }}>
          로그인하면{' '}
          <Link href="/terms" className="underline">
            이용약관
          </Link>
          과{' '}
          <Link href="/privacy" className="underline">
            개인정보 처리방침
          </Link>
          에 동의하는 것으로 봅니다.
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
