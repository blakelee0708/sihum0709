/**
 * 검색 크롤러 규칙 (PRD 14.4)
 *
 * 이 서비스의 트래픽은 검색에서 옵니다. 랜딩과 정책 화면은 열고,
 * 개인 결과와 관리자 화면은 막습니다.
 */

import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/my',        // 개인 정보 화면
        '/result',    // 개인 결과
        '/report',    // 유료 리포트
        '/checkout',
        '/auth/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
