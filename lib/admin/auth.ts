/**
 * 관리자 권한 확인 (PRD 22.3)
 *
 * 별도 관리자 계정 테이블을 만들지 않고 일반 로그인 후 이메일로 판별합니다.
 *
 * 미들웨어만 신뢰하지 않습니다. 각 API Route에서 한 번 더 확인합니다.
 * 관리자 화면의 DB 접근은 service_role 키를 쓰므로 RLS를 우회합니다.
 * 권한 확인이 빠지면 그대로 전체 데이터가 열립니다.
 */

import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

export const ADMIN_EMAILS =
  process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()).filter(Boolean) ?? []

export interface AdminUser {
  id: string
  email: string
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
  }
}

/** 관리자면 사용자 정보를, 아니면 null을 돌려줍니다 */
export async function getAdmin(): Promise<AdminUser | null> {
  if (!isSupabaseConfigured || ADMIN_EMAILS.length === 0) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return null

  return { id: user.id, email: user.email }
}

/** 관리자가 아니면 던집니다. API Route에서 먼저 호출합니다 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin()
  if (!admin) throw new UnauthorizedError()
  return admin
}

/**
 * 관리자용 DB 클라이언트.
 * requireAdmin을 통과한 뒤에만 호출하십시오.
 */
export function adminDb() {
  const service = createServiceClient()
  if (!service) throw new Error('service_role 키가 필요합니다')
  return service
}
