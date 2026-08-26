/**
 * 사이트맵 (PRD 14.4)
 *
 * 크롤러가 읽어야 하는 공개 화면만 넣습니다.
 * 개인 결과와 리포트는 검색에 노출되면 안 되므로 제외합니다.
 */

import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/site-url'

const SITE_URL = getSiteUrl()

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/start`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/my/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
