/**
 * 개발용 초기화 (목업 결제 경로용)
 *
 * 같은 시나리오를 여러 번 확인하려면 앞선 리포트를 지워야 합니다.
 * 리포트가 completed로 남아 있으면 /api/report가 기존 것을 그대로 돌려주기
 * 때문입니다 (PRD 8.17).
 *
 * 지우는 대상은 로그인한 테스트 계정의 것뿐입니다.
 * mock-login과 같은 조건에서만 열립니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

function enabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DEV_MOCK_LOGIN === '1'
}

export async function POST(req: NextRequest) {
  if (!enabled()) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const service = createServiceClient()
  if (!service) {
    return NextResponse.json({ error: 'service key required' }, { status: 503 })
  }

  const keepQueries = req.nextUrl.searchParams.get('keepQueries') === '1'

  await service.from('payments').delete().eq('user_id', user.id)
  await service.from('reports').delete().eq('user_id', user.id)
  if (!keepQueries) await service.from('queries').delete().eq('user_id', user.id)

  return NextResponse.json({ ok: true, userId: user.id, keptQueries: keepQueries })
}
