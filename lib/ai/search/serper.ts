/**
 * Serper 검색 구현체 (PRD 8.10)
 *
 * 엔드포인트  https://google.serper.dev/search
 * 인증        X-API-KEY 헤더
 *
 * ── 크레딧 절약 ──
 *
 * num을 10으로 고정합니다. 11 이상을 요청하면 1회당 2크레딧이 나갑니다.
 * 이 값을 올리면 원가가 두 배가 되므로 상수로 박아두고 호출부에서
 * 바꿀 수 없게 했습니다.
 */

import {
  buildContext,
  EMPTY,
  MAX_RESULTS,
  mockContext,
  type SearchContext,
  type SearchProvider,
  type SearchResult,
} from '../search'

const ENDPOINT = 'https://google.serper.dev/search'

/** 검색 하나가 이 이상 걸리면 리포트 생성 전체가 늦어집니다 */
const TIMEOUT_MS = 10_000

interface SerperResponse {
  organic?: { title?: string; snippet?: string; link?: string }[]
  answerBox?: { snippet?: string; answer?: string; title?: string }
  knowledgeGraph?: { description?: string; title?: string }
}

export class SerperProvider implements SearchProvider {
  readonly name = 'serper' as const

  isConfigured(): boolean {
    return Boolean(process.env.SEARCH_API_KEY)
  }

  async search(query: string): Promise<SearchContext> {
    if (!this.isConfigured()) {
      return { context: mockContext(query), success: false, mock: true, credits: 0 }
    }

    let json: SerperResponse
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SEARCH_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          gl: 'kr',
          hl: 'ko',
          // 11 이상이면 1회당 2크레딧입니다. 절대 올리지 마십시오.
          num: MAX_RESULTS,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })

      if (!res.ok) return { ...EMPTY, credits: 1 }
      json = (await res.json()) as SerperResponse
    } catch {
      // 타임아웃이나 네트워크 오류. 크레딧은 소모됐을 수 있습니다
      return { ...EMPTY, credits: 1 }
    }

    const results = collect(json)
    const context = buildContext(results)

    return {
      context,
      success: context.length > 0,
      mock: false,
      credits: 1,
    }
  }
}

/**
 * 답변 박스와 지식 그래프를 앞에 둡니다.
 *
 * 설립일 같은 사실은 organic 스니펫보다 여기 정확하게 들어 있는 경우가
 * 많습니다. 스니펫 3개 상한 안에서 가장 쓸모 있는 것부터 담습니다.
 */
function collect(json: SerperResponse): SearchResult[] {
  const out: SearchResult[] = []

  const box = json.answerBox
  if (box) {
    const snippet = box.answer ?? box.snippet
    if (snippet) out.push({ title: box.title ?? '', snippet, url: '' })
  }

  const kg = json.knowledgeGraph
  if (kg?.description) {
    out.push({ title: kg.title ?? '', snippet: kg.description, url: '' })
  }

  for (const r of json.organic ?? []) {
    if (!r.snippet) continue
    out.push({ title: r.title ?? '', snippet: r.snippet, url: r.link ?? '' })
  }

  return out
}
