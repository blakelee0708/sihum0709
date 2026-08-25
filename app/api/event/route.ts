/**
 * 이벤트 수집 (PRD 19장 검증 지표)
 *
 * events 테이블은 클라이언트에서 직접 접근하지 않으므로 service_role로 씁니다.
 * 계측 실패가 서비스에 영향을 주면 안 되므로 오류도 200으로 응답합니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

/** 허용하는 이벤트 이름. 목록에 없으면 버립니다 */
const ALLOWED = new Set([
  'landing_cta_click',
  'chat_step_answered',
  'chat_completed',
  'result_viewed',
  'share_clicked',
  'type_share_clicked',
  'save_clicked',
  'paid_cta_click',
  'checkout_viewed',
  'payment_completed',
  'report_viewed',
  'waitlist_submitted',
])

/**
 * props에 넣을 수 있는 키를 화이트리스트로 제한합니다.
 * 실수로 이름이나 생년월일이 흘러들어가지 않게 하기 위한 장치입니다.
 */
const ALLOWED_PROPS = new Set([
  'step',
  'examType',
  'strongElement',
  'ddayRange',
  'priceShown',
  'reason',
])

export async function POST(req: NextRequest) {
  // 계측은 실패해도 조용히 넘어갑니다
  const ok = NextResponse.json({ ok: true })

  if (!isSupabaseConfigured) return ok

  let body: { name?: string; sessionId?: string; props?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return ok
  }

  if (!body.name || !ALLOWED.has(body.name)) return ok

  const props: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body.props ?? {})) {
    if (!ALLOWED_PROPS.has(k)) continue
    if (typeof v === 'string' && v.length > 100) continue
    props[k] = v
  }

  const service = createServiceClient()
  if (!service) return ok

  // 로그인 상태면 user_id를 함께 남깁니다 (재방문율, 재결제율 산출용)
  let userId: string | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    // 비로그인
  }

  try {
    await service.from('events').insert({
      session_id: (body.sessionId ?? '').slice(0, 64) || null,
      user_id: userId,
      name: body.name,
      props,
    })
  } catch {
    // 기록 실패는 무시합니다
  }

  return ok
}
