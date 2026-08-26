/**
 * 사이트 절대 주소 (PRD 20장 메타데이터, robots, sitemap)
 *
 * `process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'`으로 두었다가
 * Vercel 첫 배포가 여기서 죽었습니다.
 *
 *   [Error: Failed to collect configuration for /_not-found]
 *     TypeError: Invalid URL { code: 'ERR_INVALID_URL', input: '' }
 *
 * `??`는 undefined와 null만 잡습니다. 환경변수를 이름만 만들고 값을 비워
 * 두면 빈 문자열이 그대로 통과해 `new URL('')`이 됩니다. 대시보드에서
 * 키를 추가하면 값이 비어 있는 상태가 기본이라 아주 쉽게 걸립니다.
 *
 * 빈 문자열도 "없음"으로 봅니다. 그리고 값이 없으면 Vercel이 자동으로
 * 넣어 주는 도메인을 씁니다. 환경변수를 깜빡해도 배포가 죽지 않고,
 * 메타데이터 주소가 localhost로 나가는 사고도 막습니다.
 *
 * 우선순위
 *   1. NEXT_PUBLIC_SITE_URL              직접 지정한 도메인
 *   2. VERCEL_PROJECT_PRODUCTION_URL     프로덕션 도메인 (배포마다 안 바뀜)
 *   3. VERCEL_URL                        이번 배포 주소 (프리뷰용)
 *   4. http://localhost:3000             로컬
 */

/** 값이 없거나 공백뿐이면 undefined로 봅니다 */
function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** 뒤에 붙은 슬래시를 떼어 냅니다. new URL에 넣을 때 중복 슬래시가 생깁니다 */
function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

export function getSiteUrl(): string {
  const explicit = clean(process.env.NEXT_PUBLIC_SITE_URL)
  if (explicit) return stripTrailingSlash(explicit)

  // Vercel이 넣어 주는 값에는 스킴이 없습니다 ("sihum0709.vercel.app")
  const vercel =
    clean(process.env.VERCEL_PROJECT_PRODUCTION_URL) ?? clean(process.env.VERCEL_URL)
  if (vercel) {
    return stripTrailingSlash(
      vercel.startsWith('http') ? vercel : `https://${vercel}`
    )
  }

  return 'http://localhost:3000'
}
