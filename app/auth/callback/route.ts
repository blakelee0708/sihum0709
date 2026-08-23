/**
 * 로그인 콜백 (PRD 11.1)
 *
 * 이메일 매직 링크와 OAuth 리다이렉트를 함께 처리합니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/my'

  if (!code || !isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/login?error=1`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=1`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
