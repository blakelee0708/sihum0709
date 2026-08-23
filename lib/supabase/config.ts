/**
 * Supabase 환경변수 상태.
 *
 * .env.local이 없거나 키가 비어 있으면 앱이 죽지 않고 목업 모드로 동작합니다.
 * 호출부는 isSupabaseConfigured를 먼저 확인하고 분기하시기 바랍니다.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0

/** createClient 자체가 던지지 않도록 쓰는 형식상 유효한 대체값 */
export const FALLBACK_URL = 'http://localhost:54321'
export const FALLBACK_KEY = 'public-anon-key-placeholder'

export const resolvedUrl = isSupabaseConfigured ? SUPABASE_URL : FALLBACK_URL
export const resolvedAnonKey = isSupabaseConfigured
  ? SUPABASE_ANON_KEY
  : FALLBACK_KEY
