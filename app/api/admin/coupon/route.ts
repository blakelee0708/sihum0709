/**
 * 쿠폰 발급 (PRD 22.11, 12.6)
 *
 * 인플루언서 제공, 이벤트 당첨, 사전 테스트에 씁니다.
 * 100퍼센트 할인 쿠폰으로 무료 지급 처리가 가능합니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { adminDb, requireAdmin, UnauthorizedError } from '@/lib/admin/auth'

export async function POST(req: NextRequest) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
    }
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  let body: {
    code?: string
    discountType?: string
    discountValue?: number
    maxUses?: number | null
    validUntil?: string | null
    memo?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const code = (body.code ?? '').trim().toUpperCase()
  const discountType = body.discountType ?? 'percent'
  const discountValue = Number(body.discountValue)

  if (!/^[A-Z0-9-]{4,32}$/.test(code)) {
    return NextResponse.json(
      { error: '쿠폰 코드는 영문 대문자, 숫자, 하이픈 4-32자입니다' },
      { status: 400 }
    )
  }
  if (!['percent', 'amount'].includes(discountType)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return NextResponse.json({ error: '할인 값을 확인해 주십시오' }, { status: 400 })
  }
  if (discountType === 'percent' && discountValue > 100) {
    return NextResponse.json({ error: '퍼센트 할인은 100을 넘을 수 없습니다' }, { status: 400 })
  }

  const db = adminDb()

  const { error } = await db.from('coupons').insert({
    code,
    discount_type: discountType,
    discount_value: Math.round(discountValue),
    max_uses: body.maxUses ?? null,
    valid_until: body.validUntil || null,
    memo: body.memo?.slice(0, 200) ?? null,
    created_by: admin.email,
  })

  if (error) {
    return NextResponse.json(
      { error: error.code === '23505' ? '이미 있는 쿠폰 코드입니다' : '발급하지 못했습니다' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}
