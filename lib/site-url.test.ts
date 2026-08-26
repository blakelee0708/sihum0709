/**
 * 사이트 주소 결정 (PRD 20장)
 *
 * Vercel 첫 배포가 여기서 죽었습니다. 환경변수를 이름만 만들고 값을 비워
 * 두면 빈 문자열이 넘어오는데, `??`가 그걸 못 잡습니다.
 */

import { afterEach, describe, expect, it } from 'vitest'

import { getSiteUrl } from './site-url'

const KEYS = [
  'NEXT_PUBLIC_SITE_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
  'VERCEL_URL',
] as const

function clearAll() {
  for (const k of KEYS) delete process.env[k]
}

afterEach(clearAll)

describe('getSiteUrl', () => {
  it('지정한 주소를 쓴다', () => {
    clearAll()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://sihum.co.kr'
    expect(getSiteUrl()).toBe('https://sihum.co.kr')
  })

  it('빈 값은 없는 것으로 본다', () => {
    // 이것 때문에 배포가 죽었습니다.
    //   TypeError: Invalid URL { code: 'ERR_INVALID_URL', input: '' }
    clearAll()
    process.env.NEXT_PUBLIC_SITE_URL = ''
    expect(getSiteUrl()).toBe('http://localhost:3000')

    process.env.NEXT_PUBLIC_SITE_URL = '   '
    expect(getSiteUrl()).toBe('http://localhost:3000')
  })

  it('돌려준 값은 언제나 new URL이 받는다', () => {
    for (const value of ['', '   ', undefined, 'https://sihum.co.kr/']) {
      clearAll()
      if (value !== undefined) process.env.NEXT_PUBLIC_SITE_URL = value
      expect(() => new URL(getSiteUrl())).not.toThrow()
    }
  })

  it('환경변수가 비면 Vercel 도메인을 쓴다', () => {
    clearAll()
    process.env.NEXT_PUBLIC_SITE_URL = ''
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'sihum0709.vercel.app'
    expect(getSiteUrl()).toBe('https://sihum0709.vercel.app')
  })

  it('프로덕션 도메인이 배포별 주소보다 우선한다', () => {
    // VERCEL_URL은 배포마다 바뀝니다. 사이트맵에 넣으면 안 됩니다.
    clearAll()
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'sihum0709.vercel.app'
    process.env.VERCEL_URL = 'sihum0709-abc123.vercel.app'
    expect(getSiteUrl()).toBe('https://sihum0709.vercel.app')
  })

  it('스킴이 없으면 https를 붙인다', () => {
    clearAll()
    process.env.VERCEL_URL = 'sihum0709-abc123.vercel.app'
    expect(getSiteUrl()).toBe('https://sihum0709-abc123.vercel.app')
  })

  it('뒤에 붙은 슬래시를 떼어 낸다', () => {
    // 안 떼면 사이트맵에 sihum.co.kr//start 가 생깁니다
    clearAll()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://sihum.co.kr///'
    expect(getSiteUrl()).toBe('https://sihum.co.kr')
  })

  it('아무것도 없으면 로컬', () => {
    clearAll()
    expect(getSiteUrl()).toBe('http://localhost:3000')
  })
})
