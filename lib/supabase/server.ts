import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolvedAnonKey, resolvedUrl, isSupabaseConfigured } from './config'

export { isSupabaseConfigured }

/** 서버 컴포넌트 / Route Handler 용 클라이언트 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(resolvedUrl, resolvedAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // 서버 컴포넌트에서 호출된 경우. 미들웨어가 세션을 갱신하므로 무시합니다.
        }
      },
    },
  })
}

/**
 * RLS를 우회하는 service_role 클라이언트 (PRD 13.2).
 * 서버 라우트에서만 사용하며, 키가 없으면 null을 반환합니다.
 */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!isSupabaseConfigured || !serviceKey) return null

  return createServerClient(resolvedUrl, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })
}
