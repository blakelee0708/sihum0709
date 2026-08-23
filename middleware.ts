/**
 * 세션 갱신과 관리자 접근 제어 (PRD 22.3)
 *
 * 미들웨어만 신뢰하지 않습니다. 각 API Route에서 권한을 한 번 더 확인합니다.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

import { isSupabaseConfigured, resolvedAnonKey, resolvedUrl } from '@/lib/supabase/config'

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) ?? []

export async function middleware(req: NextRequest) {
  const isAdminPath = req.nextUrl.pathname.startsWith('/admin')

  // Supabase 미설정이면 세션이 없습니다.
  // 관리자 화면만 막고 나머지는 그대로 통과시킵니다 (목업 모드).
  if (!isSupabaseConfigured) {
    if (isAdminPath) return NextResponse.redirect(new URL('/', req.url))
    return NextResponse.next()
  }

  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(resolvedUrl, resolvedAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        )
      },
    },
  })

  // 세션 토큰을 갱신합니다. 이 호출을 빼면 서버 컴포넌트에서 로그아웃 상태로 보입니다.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isAdminPath) {
    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * 정적 파일과 이미지 최적화 요청은 제외합니다.
     */
    '/((?!_next/static|_next/image|favicon.ico|character|fonts|.*\\.png$).*)',
  ],
}
