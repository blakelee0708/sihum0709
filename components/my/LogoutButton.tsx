'use client'

import { useRouter } from 'next/navigation'

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    if (isSupabaseConfigured) {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="min-h-[48px] w-full text-body"
      style={{ color: 'var(--text-sub)' }}
    >
      로그아웃
    </button>
  )
}
