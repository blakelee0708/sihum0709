/**
 * 공지 배너 설정 (PRD 22.15)
 *
 * 활성화하면 홈 최상단에 표시됩니다.
 * 장애 발생 시 배너 하나로 문의 대부분을 줄일 수 있습니다.
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

  let body: { message?: string; isActive?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const message = (body.message ?? '').trim()
  if (!message) return NextResponse.json({ error: '문구를 입력해 주십시오' }, { status: 400 })

  const db = adminDb()

  // 배너는 하나만 보이므로 새로 켤 때 기존 것을 모두 끕니다
  if (body.isActive) {
    await db.from('notices').update({ is_active: false }).eq('is_active', true)
  }

  const { error } = await db.from('notices').insert({
    message: message.slice(0, 200),
    is_active: Boolean(body.isActive),
    created_by: admin.email,
  })

  if (error) return NextResponse.json({ error: '저장하지 못했습니다' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

/** 배너 끄기 */
export async function DELETE() {
  try {
    await requireAdmin()
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
    }
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  const db = adminDb()
  await db.from('notices').update({ is_active: false }).eq('is_active', true)

  return NextResponse.json({ ok: true })
}
