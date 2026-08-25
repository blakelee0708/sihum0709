/**
 * 검색 로그 기록 (PRD 22.14)
 *
 * 크레딧 소모량과 실패율을 나중에 파악하기 위한 것입니다.
 * 기업명 검색 실패율이 높으면 기업 DB 구축이 필요하다는 신호이고,
 * 자주 입력되는 기업명은 우선 등록 대상이 됩니다.
 *
 * search_logs는 클라이언트에서 접근하지 않으므로 service_role로 씁니다 (PRD 13.2).
 * 기록 실패가 리포트 생성을 막으면 안 되므로 조용히 넘어갑니다.
 */

import { createServiceClient } from '@/lib/supabase/server'

export interface SearchLogEntry {
  queryType: 'company' | 'exam'
  keyword: string
  success: boolean
}

export async function logSearches(logs: SearchLogEntry[]): Promise<void> {
  if (logs.length === 0) return

  const service = createServiceClient()
  if (!service) return

  try {
    await service.from('search_logs').insert(
      logs.map((l) => ({
        query_type: l.queryType,
        keyword: l.keyword.slice(0, 200),
        success: l.success,
      }))
    )
  } catch {
    // 기록 실패는 무시합니다
  }
}
