/**
 * 회원 삭제 (PRD 22.9)
 *
 * 관리자에 의한 삭제는 사용자 자발적 탈퇴와 동일하게 처리합니다 (PRD 11.6).
 *   1. payments.user_id를 null로 (결제 이력 보존, 전자상거래법 5년)
 *   2. auth.users 삭제
 *   3. profiles, queries, reports는 cascade로 삭제
 */

import { NextResponse, type NextRequest } from 'next/server'

import { adminDb, requireAdmin, UnauthorizedError } from '@/lib/admin/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
    }
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'bad request' }, { status: 400 })

  const db = adminDb()

  // 1. 결제 이력은 식별 정보만 제거하고 남깁니다
  await db.from('payments').update({ user_id: null }).eq('user_id', id)

  // 2. 계정 삭제 (나머지는 cascade)
  const { error } = await db.auth.admin.deleteUser(id)

  if (error) {
    return NextResponse.json({ error: '삭제하지 못했습니다' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
