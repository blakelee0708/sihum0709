/**
 * 검색 API 호출 (PRD 8.10, 10.4, 10.5)
 *
 * Claude API의 web_search 도구를 쓰지 않습니다. 검색 횟수와 토큰량 통제가
 * 어려워 원가가 예측되지 않기 때문입니다.
 *
 * 키가 없으면 목업 결과를 돌려주고 리포트 생성을 계속합니다.
 */

/** 프롬프트에 넣을 검색 문맥 상한 (PRD 8.10) */
const CONTEXT_LIMIT = 6000

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
}

const EMPTY: SearchContext = { context: '', success: false, mock: false }

function getProvider(): { name: 'brave' | 'serper'; key: string } | null {
  const brave = process.env.BRAVE_SEARCH_API_KEY
  const serper = process.env.SERPER_API_KEY
  const preferred = process.env.SEARCH_PROVIDER

  if (preferred === 'serper' && serper) return { name: 'serper', key: serper }
  if (preferred === 'brave' && brave) return { name: 'brave', key: brave }
  if (brave) return { name: 'brave', key: brave }
  if (serper) return { name: 'serper', key: serper }
  return null
}

export function isSearchConfigured(): boolean {
  return getProvider() !== null
}

/**
 * 검색 결과 상위 3개의 스니펫을 이어 붙여 돌려줍니다.
 *
 * TODO: 사용자 확인 필요
 * Brave Search 또는 Serper API 키를 발급받아 .env.local에 넣어야 실제로 검색합니다.
 * 키가 없으면 아래 목업이 나가고, 리포트는 "확인되지 않음"으로 처리됩니다.
 */
export async function search(query: string): Promise<SearchContext> {
  const provider = getProvider()

  if (!provider) {
    return { context: mockContext(query), success: false, mock: true }
  }

  try {
    const results =
      provider.name === 'brave'
        ? await searchBrave(query, provider.key)
        : await searchSerper(query, provider.key)

    if (results.length === 0) return EMPTY

    const context = results
      .slice(0, 3)
      .map((r) => r.snippet)
      .join('\n')
      .slice(0, CONTEXT_LIMIT)

    return { context, success: context.length > 0, mock: false }
  } catch {
    return EMPTY
  }
}

async function searchBrave(query: string, key: string): Promise<SearchResult[]> {
  const url = new URL('https://api.search.brave.com/res/v1/web/search')
  url.searchParams.set('q', query)
  url.searchParams.set('count', '5')

  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Subscription-Token': key },
  })
  if (!res.ok) return []

  const json = (await res.json()) as {
    web?: { results?: { title: string; description: string; url: string }[] }
  }

  return (json.web?.results ?? []).map((r) => ({
    title: r.title,
    snippet: r.description,
    url: r.url,
  }))
}

async function searchSerper(query: string, key: string): Promise<SearchResult[]> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, gl: 'kr', hl: 'ko', num: 5 }),
  })
  if (!res.ok) return []

  const json = (await res.json()) as {
    organic?: { title: string; snippet: string; link: string }[]
  }

  return (json.organic ?? []).map((r) => ({
    title: r.title,
    snippet: r.snippet,
    url: r.link,
  }))
}

/**
 * 키가 없을 때 쓰는 목업.
 *
 * 일부러 사실을 담지 않습니다. AI가 이 문자열을 근거로 단정하면 안 되므로
 * "확인되지 않았다"는 내용만 넣습니다.
 */
function mockContext(query: string): string {
  return [
    `[검색 미연동] "${query}"에 대한 외부 검색이 수행되지 않았습니다.`,
    '이 섹션은 검색으로 확인된 사실이 없는 것으로 처리하시기 바랍니다.',
    '구체적인 과목명, 설립일, 전형 방식을 추측해서 쓰지 마십시오.',
  ].join('\n')
}

// ─── 검색어 (PRD 8.10) ───

export const SEARCH_QUERIES = {
  companyFounded: (company: string) => `${company} 법인 설립일 연혁`,
  companyInfo: (company: string) => `${company} 사업 인재상 최근`,
  examSubjects: (exam: string) => `${exam} 시험 과목 구성 배점`,
}

/**
 * 검색 결과에서 법인 설립일을 뽑습니다 (PRD 4.4, 10.5).
 * 확인되지 않으면 null을 돌려주고, 궁합 섹션은 대체 섹션으로 바뀝니다.
 * 추측 날짜로 계산하지 않습니다.
 */
export function extractFoundedDate(context: string): string | null {
  if (!context) return null

  // 1969년 1월 13일 / 1969.01.13 / 1969-01-13 형태를 찾습니다
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
