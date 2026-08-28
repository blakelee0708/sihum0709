/**
 * 유입 경로 기록 (FIX_4 [5]-3)
 *
 * 가입 시 어디서 왔는지 한 번만 남깁니다. '457deep', 'organic', 'share' 등이며
 * 나중에 코호트 분석에 씁니다.
 *
 * 이미 값이 있으면 덮어쓰지 않습니다. 알고 싶은 것은 "처음 어디서 왔는가"라
 * 나중 방문 경로로 바뀌면 값이 무의미해집니다.
 *
 * profiles는 사용자 본인이 쓸 수 있는 테이블이지만(PRD 13.2), 덮어쓰지 않는
 * 규칙을 서버가 지켜야 하므로 여기서 처리합니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

/** 임의로 긴 값이 들어오지 않게 자릅니다 */
const MAX_LENGTH = 40

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  let body: { source?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const source = (body.source ?? '').trim().slice(0, MAX_LENGTH)
  if (!source) return NextResponse.json({ error: 'bad request' }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('source')
    .eq('id', user.id)
    .maybeSingle<{ source: string | null }>()

  // 이미 남아 있으면 그대로 둡니다
  if (profile?.source) return NextResponse.json({ ok: true, source: profile.source })

  await supabase.from('profiles').update({ source }).eq('id', user.id)

  return NextResponse.json({ ok: true, source })
}
