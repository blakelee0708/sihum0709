/**
 * 무료권 발급 (FIX_4 [5]-1)
 *
 * 457deep(취준생 구독 사이트)에서 구독자에게 시험사주 무료권을 발급할 때
 * 부릅니다. 사람이 쓰는 화면이 아니라 서버끼리 부르는 자리라 세션이 아니라
 * API 키로 인증합니다.
 *
 *   POST /api/coupon/issue
 *   X-API-Key: <COUPON_API_KEY>
 *   { "source": "457deep", "externalUserId": "xxx" }
 *
 * 같은 externalUserId로 다시 부르면 새로 만들지 않고 기존 코드를 돌려줍니다.
 * 457deep 쪽에서 재시도하거나 사용자가 페이지를 새로고침해도 무료권이
 * 늘어나면 안 됩니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

/** 유효 기간 (일) */
const VALID_DAYS = 30

/**
 * 코드 문자 집합.
 *
 * 0/O, 1/I 처럼 헷갈리는 글자를 뺐습니다. 링크로만 쓰면 상관없지만
 * 사람이 옮겨 적는 경우가 반드시 생깁니다.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

function randomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export async function POST(req: NextRequest) {
  const expected = process.env.COUPON_API_KEY
  if (!expected) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  if (req.headers.get('x-api-key') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  let body: { source?: string; externalUserId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const source = (body.source ?? '').trim()
  const externalUserId = (body.externalUserId ?? '').trim()

  if (!source || !externalUserId) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const service = createServiceClient()
  if (!service) {
    return NextResponse.json({ error: 'service key required' }, { status: 503 })
  }

  // 이미 발급했으면 그 코드를 그대로 돌려줍니다
  const { data: existing } = await service
    .from('coupons')
    .select('code, valid_until')
    .eq('source', source)
    .eq('external_user_id', externalUserId)
    .maybeSingle<{ code: string; valid_until: string | null }>()

  if (existing) {
    return NextResponse.json({
      code: existing.code,
      validUntil: existing.valid_until,
      reused: true,
    })
  }

  const validUntil = new Date(Date.now() + VALID_DAYS * 86400_000).toISOString()

  // 코드가 겹치면 다시 뽑습니다. 32^6이라 실제로는 거의 없지만,
  // 겹쳤을 때 남의 쿠폰을 덮어쓰는 것보다는 몇 번 더 뽑는 편이 낫습니다
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode()

    const { data, error } = await service
      .from('coupons')
      .insert({
        code,
        discount_type: 'percent',
        discount_value: 100,
        max_uses: 1,
        used_count: 0,
        valid_until: validUntil,
        memo: `${source} 무료권`,
        created_by: source,
        source,
        external_user_id: externalUserId,
      })
      .select('code, valid_until')
      .single<{ code: string; valid_until: string | null }>()

    if (data) {
      return NextResponse.json({
        code: data.code,
        validUntil: data.valid_until,
        reused: false,
      })
    }

    // 같은 externalUserId가 동시에 두 번 들어온 경우입니다.
    // 유니크 인덱스가 막아 주므로 이미 만들어진 것을 찾아 돌려줍니다
    const { data: raced } = await service
      .from('coupons')
      .select('code, valid_until')
      .eq('source', source)
      .eq('external_user_id', externalUserId)
      .maybeSingle<{ code: string; valid_until: string | null }>()

    if (raced) {
      return NextResponse.json({
        code: raced.code,
        validUntil: raced.valid_until,
        reused: true,
      })
    }

    if (!error) break
  }

  return NextResponse.json({ error: 'issue failed' }, { status: 500 })
}
