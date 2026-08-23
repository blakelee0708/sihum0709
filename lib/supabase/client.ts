'use client'

import { createBrowserClient } from '@supabase/ssr'
import { resolvedAnonKey, resolvedUrl, isSupabaseConfigured } from './config'

export { isSupabaseConfigured }

export function createClient() {
  return createBrowserClient(resolvedUrl, resolvedAnonKey)
}
