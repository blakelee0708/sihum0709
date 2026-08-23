/** 내 정보 수정 (PRD 11.5, 14.13) */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import SubHeader from '@/components/layout/SubHeader'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

import ProfileForm, { type ProfileValues } from './ProfileForm'

export const metadata: Metadata = { title: '내 정보 수정 · 시험사주' }

export default async function ProfilePage() {
  if (!isSupabaseConfigured) redirect('/my')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=%2Fmy%2Fprofile')

  const { data } = await supabase
    .from('profiles')
    .select('name, birth_date, birth_time, has_birth_time')
    .eq('id', user.id)
    .maybeSingle()

  const initial: ProfileValues = {
    name: data?.name ?? null,
    birthDate: data?.birth_date ?? null,
    birthTime: data?.birth_time ?? null,
    hasBirthTime: data?.has_birth_time ?? true,
  }

  return (
    <main className="mx-auto max-w-md pb-10">
      <SubHeader title="내 정보 수정" />
      <ProfileForm initial={initial} />
    </main>
  )
}
