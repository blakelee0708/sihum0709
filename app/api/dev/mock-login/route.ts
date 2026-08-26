/**
 * 개발용 로그인 (PRD 12장 목업 결제 경로)
 *
 * 결제 이후 화면 — 생성 중 이탈, 완료 후 재진입, 마이페이지 "만들고 있어요" —
 * 은 로그인 세션이 있어야 볼 수 있습니다. 이메일 매직 링크는 메일함을 거쳐야
 * 하고 카카오·구글은 OAuth 앱 등록이 끝나야 동작해서, 로컬에서 화면을 확인할
 * 방법이 없었습니다.
 *
 * 이 라우트는 service_role로 테스트 계정을 만들고 그 계정의 세션 쿠키를
 * 심어 줍니다. 결제·리포트 생성은 손대지 않고 실제 라우트를 그대로 씁니다.
 * 로그인 한 걸음만 건너뛰는 것이 목적입니다.
 *
 * ── 켜지는 조건 ──
 *
 * 프로덕션 빌드에서는 무조건 404입니다. 그 위에 DEV_MOCK_LOGIN=1까지
 * 있어야 동작합니다. 둘 중 하나만 빠져도 열리지 않습니다.
 *
 *   개발 서버를 띄운 뒤 브라우저에서
 *   http://localhost:3000/api/dev/mock-login?next=/start
 */

import { NextResponse, type NextRequest } from 'next/server'

import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

const DEFAULT_EMAIL = 'dev@sihum.local'

function enabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DEV_MOCK_LOGIN === '1'
}

export async function GET(req: NextRequest) {
  if (!enabled()) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  const service = createServiceClient()
  if (!service) {
    return NextResponse.json({ error: 'service key required' }, { status: 503 })
  }

  const email = process.env.DEV_MOCK_EMAIL ?? DEFAULT_EMAIL
  const next = req.nextUrl.searchParams.get('next') ?? '/my'

  // 이미 있으면 그대로 씁니다. 매 호출마다 계정이 늘어나면 안 됩니다.
  const created = await service.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (created.error && !/already/i.test(created.error.message)) {
    return NextResponse.json(
      { error: 'create user failed', detail: created.error.message },
      { status: 500 }
    )
  }

  // 매직 링크의 토큰만 꺼내 씁니다. 메일은 보내지 않습니다.
  const link = await service.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = link.data?.properties?.hashed_token
  if (link.error || !tokenHash) {
    return NextResponse.json(
      { error: 'generate link failed', detail: link.error?.message },
      { status: 500 }
    )
  }

  // PKCE code_verifier가 없으므로 exchangeCodeForSession은 쓸 수 없습니다.
  // token_hash를 직접 검증하면 이 응답에 세션 쿠키가 실립니다.
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: tokenHash })
  if (error) {
    return NextResponse.json({ error: 'verify failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL(next, req.nextUrl.origin))
}
