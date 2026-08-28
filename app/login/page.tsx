'use client'

/**
 * 로그인 (PRD 11.1, 11.2, 11.3, FIX_4 [4])
 *
 * 로그인은 강제하지 않습니다. 결제, 결과 저장, 마이페이지 진입에서만 요청합니다.
 * 탭바는 숨깁니다 (PRD 14.2).
 *
 * ── 카카오를 기본으로 (FIX_4 [4]-1) ──
 *
 * 취준생 대부분이 카카오 계정을 갖고 있습니다. 카카오를 크게 위에 두고,
 * 구글을 그다음에, 이메일은 아래 작은 텍스트 링크로 남깁니다. 이메일은
 * 로그인할 때마다 메일을 받아야 해서 예외 상황용입니다.
 *
 * ── 동의 항목은 최소로 (FIX_4 [4]-2) ──
 *
 * 로그인 시점에는 기본 권한만 요청합니다. 나에게 보내기(talk_message)는
 * 리포트를 다 읽고 "카카오톡으로 나에게 보내기"를 누를 때 따로 받습니다.
 * 동의 화면에 항목이 많으면 그 자리에서 이탈합니다.
 *
 * ── 무료권 안내 (FIX_4 [4]-3) ──
 *
 * 457deep 링크로 들어온 사람은 여기서 "0원"을 봐야 합니다. 로그인 화면에서
 * 결제가 연상되면 멈춥니다.
 */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronLeft, Mail } from 'lucide-react'

import { CHARACTER_NAME } from '@/lib/content/characters'
import { checkCoupon, readCoupon } from '@/lib/coupon'
import { SIGNUP_BENEFITS } from '@/lib/pricing'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/my'

  const [email, setEmail] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [freeCoupon, setFreeCoupon] = useState(false)

  // 무료권 링크로 들어왔는지 확인합니다. 유효하지 않은 코드면 아무것도
  // 띄우지 않습니다. 0원이라고 해놓고 결제 화면에서 3,900원이 나오면
  // 그때 이탈합니다
  useEffect(() => {
    const code = readCoupon()
    if (!code) return

    let alive = true
    checkCoupon(code).then((r) => {
      if (alive && r.valid && r.free) setFreeCoupon(true)
    })
    return () => {
      alive = false
    }
  }, [])

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
   * 카카오 OAuth는 Supabase가 account_email 스코프를 항상 붙여 KOE205가 납니다.
   * 비즈 앱 전환이 끝나야 동작합니다 (RELEASE.md 0-1절).
   *
   * 여기서는 스코프를 추가로 요청하지 않습니다. talk_message는 리포트
   * 화면에서 따로 받습니다 (FIX_4 [4]-2).
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

        {freeCoupon ? (
          <div
            className="mt-2 p-card text-center"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <p className="text-body font-semibold">무료권이 적용됐어요</p>
            <p className="mt-2 text-body" style={{ color: 'var(--text-sub)' }}>
              로그인하시면 바로
              <br />
              리포트를 만들어드려요
            </p>
            <p className="mt-3 text-headline" style={{ color: 'var(--primary)' }}>
              결제 금액 0원
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-2 text-center text-headline">
              로그인하고
              <br />
              결과를 저장하세요
            </h1>

            {/*
              신규 가입 혜택은 할인이 아니라 기능입니다 (FIX_4 [6]).
              가격은 3,900원 그대로 두고, 로그인할 이유를 여기서 답합니다.
            */}
            <ul className="mt-3 space-y-1">
              {SIGNUP_BENEFITS.map((b) => (
                <li
                  key={b}
                  className="flex items-start justify-center gap-1.5 text-body"
                  style={{ color: 'var(--text-sub)' }}
                >
                  <Check size={16} aria-hidden className="mt-1 shrink-0" style={{ color: 'var(--primary)' }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-8 space-y-2">
          {/* 카카오가 기본입니다. 크기로도 그것을 보여줍니다 (FIX_4 [4]-1) */}
          <button
            type="button"
            onClick={() => handleOAuth('kakao')}
            className="flex min-h-[60px] w-full items-center justify-center text-headline font-semibold"
            style={{
              background: '#FEE500',
              borderRadius: 'var(--radius-button)',
              color: '#191600',
            }}
          >
            카카오로 3초 만에
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
            구글로 계속하기
          </button>
        </div>

        <div className="mt-5">
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
          ) : showEmail ? (
            <form onSubmit={handleEmail} className="space-y-2">
              <label htmlFor="email" className="block text-label" style={{ color: 'var(--text-sub)' }}>
                이메일로 로그인
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
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
          ) : (
            // 이메일은 예외 상황용이라 작은 링크로만 남깁니다 (FIX_4 [4]-1)
            <button
              type="button"
              onClick={() => setShowEmail(true)}
              className="mx-auto block min-h-[44px] px-2 text-label underline"
              style={{ color: 'var(--text-sub)' }}
            >
              이메일로 로그인
            </button>
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
