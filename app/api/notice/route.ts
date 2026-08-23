/**
 * 활성 공지 배너 조회 (PRD 14.5, 22.15)
 *
 * notices 테이블은 클라이언트에서 직접 접근하지 않으므로 (PRD 13.2)
 * service_role 키를 쓰는 이 라우트를 거칩니다.
 */

import { NextResponse } from 'next/server'

import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient()

  // Supabase 미설정이면 공지 없음으로 처리합니다 (목업 모드)
  if (!supabase) return NextResponse.json({})

  const { data, error } = await supabase
    .from('notices')
    .select('message')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return NextResponse.json({})

  return NextResponse.json({ message: data.message })
}
