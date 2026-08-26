/**
 * 검색 인터페이스 (PRD 8.10, 10.4, 10.5)
 *
 * Claude API의 web_search 도구를 쓰지 않습니다. 검색 횟수와 토큰량 통제가
 * 어려워 원가가 예측되지 않기 때문입니다.
 *
 * 나중에 DataForSEO 등으로 갈아끼울 수 있게 구현을 분리했습니다.
 *
 * ── 크레딧 절약 규칙 (반드시 지킬 것) ──
 *
 * 1. num은 10 이하로 고정합니다. 11 이상 요청하면 1회당 2크레딧이 나갑니다.
 * 2. 결과는 상위 3개 스니펫만 씁니다.
 * 3. 프롬프트에 넣기 전 6000자로 자릅니다.
 *
 * ── 호출 지점 ──
 *
 *   필기 리포트  1회
 *   면접 리포트  2회
 *   무료 구간    0회  절대 호출하지 않습니다
 */

/** PRD 8.10 — 프롬프트에 넣을 검색 문맥 상한 */
export const CONTEXT_LIMIT = 6000

/** 11 이상이면 1회당 2크레딧이 소모됩니다. 절대 올리지 마십시오 */
export const MAX_RESULTS = 10

/** 실제로 프롬프트에 넣는 스니펫 수 */
export const SNIPPET_COUNT = 3

export type SearchProviderName = 'serper'

export interface SearchResult {
  title: string
  snippet: string
  url: string
}

export interface SearchContext {
  /** 프롬프트에 주입할 문자열. 실패하면 빈 문자열 */
  context: string
  success: boolean
  /** 키가 없어 목업으로 돌려준 경우 */
  mock: boolean
  /** 소모한 크레딧 추정치 (기록용) */
  credits: number
}

export interface SearchProvider {
  name: SearchProviderName
  isConfigured(): boolean
  search(query: string): Promise<SearchContext>
}

export const EMPTY: SearchContext = {
  context: '',
  success: false,
  mock: false,
  credits: 0,
}

// ─── 검색어 (PRD 8.10) ───

export const SEARCH_QUERIES = {
  companyFounded: (company: string) => `${company} 법인 설립일 연혁`,
  companyInfo: (company: string) => `${company} 사업 인재상 최근`,
}

/**
 * 상위 3개 스니펫만 이어 붙이고 상한으로 자릅니다.
 * 모든 provider가 이 함수를 거쳐 문맥을 만듭니다.
 */
export function buildContext(results: SearchResult[]): string {
  return results
    .slice(0, SNIPPET_COUNT)
    .map((r) => r.snippet)
    .filter(Boolean)
    .join('\n')
    .slice(0, CONTEXT_LIMIT)
}

/**
 * 키가 없을 때 쓰는 목업.
 *
 * 일부러 사실을 담지 않습니다. AI가 이 문자열을 근거로 단정하면 안 되므로
 * "확인되지 않았다"는 내용만 넣습니다.
 */
export function mockContext(query: string): string {
  return [
    `[검색 미연동] "${query}"에 대한 외부 검색이 수행되지 않았습니다.`,
    '이 섹션은 검색으로 확인된 사실이 없는 것으로 처리하시기 바랍니다.',
    '구체적인 과목명, 설립일, 전형 방식을 추측해서 쓰지 마십시오.',
  ].join('\n')
}

/**
 * 검색 결과에서 법인 설립일을 뽑습니다 (PRD 4.4, 10.5).
 * 확인되지 않으면 null을 돌려주고, 궁합 섹션은 대체 섹션으로 바뀝니다.
 * 추측 날짜로 계산하지 않습니다.
 */
export function extractFoundedDate(context: string): string | null {
  if (!context) return null

  const patterns = [
    /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/,
    /(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/,
  ]

  for (const re of patterns) {
    const m = context.match(re)
    if (!m) continue

    const year = Number(m[1])
    const month = Number(m[2])
    const day = Number(m[3])

    // 절기 테이블 범위와 상식 범위를 벗어나면 버립니다
    if (year < 1900 || year > new Date().getFullYear()) continue
    if (month < 1 || month > 12 || day < 1 || day > 31) continue

    const p = (n: number) => String(n).padStart(2, '0')
    return `${year}-${p(month)}-${p(day)}`
  }

  return null
}

// ─── provider 선택 ───

import { SerperProvider } from './search/serper'

export function getSearchProvider(): SearchProvider {
  // 지금은 Serper 하나뿐입니다. 늘어나면 여기서 분기합니다.
  return new SerperProvider()
}

export function isSearchConfigured(): boolean {
  return getSearchProvider().isConfigured()
}

export async function search(query: string): Promise<SearchContext> {
  return getSearchProvider().search(query)
}
