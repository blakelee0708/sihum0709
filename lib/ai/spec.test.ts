/**
 * 리포트 구성과 파싱 검증 (PRD 8.3, 8.4, 8.6, 8.10)
 */

import { describe, expect, it } from 'vitest'

import { applyMissingFoundedDate, getReportSpec, toReportType, DDAY_NOTICE } from './spec'
import {
  checkLength,
  countChars,
  targetChars,
  targetMaxChars,
  LENGTH_TOLERANCE,
  LENGTH_OVER_TOLERANCE,
} from './length'
import { extractFoundedDate, SEARCH_QUERIES } from './search'
import { parseSections, GenerateError } from './generate'
import { getReportDdayRange } from '../saju/fortune'

describe('D-day 구간 판정 (PRD 8.6)', () => {
  it('구간 경계', () => {
    expect(getReportDdayRange(30)).toBe('normal')
    expect(getReportDdayRange(8)).toBe('normal')
    expect(getReportDdayRange(7)).toBe('short')
    expect(getReportDdayRange(2)).toBe('short')
    expect(getReportDdayRange(1)).toBe('eve')
    expect(getReportDdayRange(0)).toBe('dday')
  })
})

describe('필기 리포트 구성 (PRD 8.3, 8.8)', () => {
  it('D-8 이상은 섹션 14개', () => {
    const spec = getReportSpec('필기', 'normal', 2026)
    expect(spec.sections).toHaveLength(14)
    expect(spec.sections.map((s) => s.key)).toEqual([
      'saju', 'pattern', 'studyType', 'dayTimeline', 'weekPlan', 'cautions',
      'eve', 'remaining', 'seat', 'lucky', 'avoid', 'calendar', 'after', 'strategy',
    ])
  })

  it('섹션 5와 8이 구간마다 바뀐다 (PRD 8.8 표)', () => {
    const table: Record<string, [string, string]> = {
      normal: ['시험 전 7일 데일리 플랜', '남은 기간 어떻게 쓸까'],
      short: ['남은 날짜 데일리 플랜', '지금 무엇을 버릴까'],
      eve: ['오늘 밤부터 내일 입실까지', '오늘 밤 시간표'],
    }

    for (const [range, [plan, use]] of Object.entries(table)) {
      const spec = getReportSpec('필기', range as 'normal', 2026)
      expect(spec.sections[4].title, range).toBe(plan)
      expect(spec.sections[7].title, range).toBe(use)
    }
  })

  it('D-DAY는 지금 바로 할 3가지가 최상단이고 섹션 8이 5에 통합된다', () => {
    const spec = getReportSpec('필기', 'dday', 2026)
    expect(spec.sections[0].key).toBe('nowThree')
    expect(spec.sections[0].highlight).toBe(true)
    expect(spec.sections[1].title).toBe('지금부터 시험 종료까지')
    // 남은 기간 배분(섹션 8)은 별도 섹션으로 두지 않습니다
    expect(spec.sections.map((s) => s.key)).not.toContain('remaining')
    expect(spec.sections).toHaveLength(9)
  })

  it('캘린더 제목에 시험 연도가 들어간다', () => {
    const spec = getReportSpec('필기', 'normal', 2027)
    const cal = spec.sections.find((s) => s.key === 'calendar')!
    expect(cal.title).toBe('2027년 시험운 캘린더')
  })

  it('시작 시각을 모르면 섹션 4가 시간대 없는 구성으로 바뀐다 (PRD 8.16)', () => {
    const withTime = getReportSpec('필기', 'normal', 2026, { hasStartTime: true })
    const without = getReportSpec('필기', 'normal', 2026, { hasStartTime: false })

    expect(withTime.sections[3].source).toBe('calc+ai')
    expect(without.sections[3].source).toBe('ai')
    expect(without.sections[3].brief).toContain('timeSlots가 없습니다')
    // 제목과 분량은 그대로입니다
    expect(without.sections[3].title).toBe(withTime.sections[3].title)
    expect(without.sections[3].minChars).toBe(withTime.sections[3].minChars)
  })
})

describe('면접 리포트 구성 (PRD 8.4)', () => {
  it('섹션 15개이고 7일 플랜이 없다', () => {
    const spec = getReportSpec('면접', 'normal', 2026)
    expect(spec.sections).toHaveLength(15)
    expect(spec.sections.map((s) => s.key)).not.toContain('weekPlan')
  })

  it('시간대별 운용이 들어간다 (PRD 8.4 섹션 4)', () => {
    const spec = getReportSpec('면접', 'normal', 2026)
    expect(spec.sections[3].key).toBe('dayTimeline')
    expect(spec.sections[3].title).toBe('면접 당일 시간대별 운용')
  })

  it('D-8 이상과 D-2~D-7 구성이 같다', () => {
    const a = getReportSpec('면접', 'normal', 2026)
    const b = getReportSpec('면접', 'short', 2026)
    expect(b.sections.map((s) => s.title)).toEqual(a.sections.map((s) => s.title))
  })

  it('D-1은 전날 밤이 오늘 밤부터 내일 입실까지로 바뀐다', () => {
    const spec = getReportSpec('면접', 'eve', 2026)
    const eve = spec.sections.find((s) => s.key === 'eve')!
    expect(eve.title).toBe('오늘 밤부터 내일 입실까지')
  })

  it('캘린더 제목이 면접운이다', () => {
    const spec = getReportSpec('면접', 'normal', 2026)
    const cal = spec.sections.find((s) => s.key === 'calendar')!
    expect(cal.title).toBe('2026년 면접운 캘린더')
  })

  it('설립일 미확인이면 궁합이 위치 섹션으로 바뀐다 (PRD 8.9)', () => {
    const spec = applyMissingFoundedDate(getReportSpec('면접', 'normal', 2026))
    const s = spec.sections.find((x) => x.key === 'compatibility')!
    expect(s.title).toBe('이 조직에서 나의 위치')
    // 자리를 비워두지 않으므로 섹션 개수는 그대로입니다
    expect(spec.sections).toHaveLength(15)
  })
})

describe('상품 종류 (PRD 8.2)', () => {
  it('실기는 유료 상품이 없다', () => {
    expect(toReportType('실기')).toBeNull()
    expect(toReportType('필기')).toBe('필기')
    expect(toReportType('면접')).toBe('면접')
  })
})

describe('결제 전 안내 (PRD 8.6)', () => {
  it('D-8 이상은 안내가 없다', () => {
    expect(DDAY_NOTICE.normal).toHaveLength(0)
  })

  it('D-1 안내에 7일 플랜 대신이라는 설명이 있다', () => {
    expect(DDAY_NOTICE.eve.join(' ')).toContain('7일 플랜 대신')
  })
})

describe('검색어 (PRD 8.12)', () => {
  it('PRD가 지정한 검색어를 그대로 쓴다', () => {
    expect(SEARCH_QUERIES.companyFounded('삼성전자')).toBe('삼성전자 법인 설립일 연혁')
    expect(SEARCH_QUERIES.companyInfo('삼성전자')).toBe('삼성전자 사업 인재상 최근')
  })

  it('필기 검색어는 없다 — 필기는 검색 0회다', () => {
    expect(Object.keys(SEARCH_QUERIES)).toEqual(['companyFounded', 'companyInfo'])
  })
})

describe('설립일 추출 (PRD 4.4, 10.5)', () => {
  it('한글 표기를 읽는다', () => {
    expect(extractFoundedDate('삼성전자는 1969년 1월 13일 설립되었습니다.')).toBe(
      '1969-01-13'
    )
  })

  it('구분자 표기를 읽는다', () => {
    expect(extractFoundedDate('설립 1969.01.13')).toBe('1969-01-13')
    expect(extractFoundedDate('설립 1969-01-13')).toBe('1969-01-13')
  })

  it('날짜가 없으면 null을 준다 (추측하지 않는다)', () => {
    expect(extractFoundedDate('설립일 정보를 찾을 수 없습니다.')).toBeNull()
    expect(extractFoundedDate('')).toBeNull()
  })

  it('상식을 벗어난 값은 버린다', () => {
    expect(extractFoundedDate('2999년 1월 1일')).toBeNull()
    expect(extractFoundedDate('1800년 1월 1일')).toBeNull()
  })
})

describe('AI 응답 파싱 (PRD 8.15)', () => {
  it('평범한 JSON을 읽는다', () => {
    expect(parseSections('{"studyType":"본문입니다."}')).toEqual({
      studyType: '본문입니다.',
    })
  })

  it('코드 블록으로 감싼 경우를 벗겨낸다', () => {
    const text = '```json\n{"studyType":"본문입니다."}\n```'
    expect(parseSections(text)).toEqual({ studyType: '본문입니다.' })
  })

  it('앞뒤 설명이 붙어도 읽는다', () => {
    const text = '아래와 같습니다.\n{"a":"1"}\n이상입니다.'
    expect(parseSections(text)).toEqual({ a: '1' })
  })

  it('배열 값은 문단으로 이어 붙인다', () => {
    expect(parseSections('{"a":["첫 문단","둘째 문단"]}')).toEqual({
      a: '첫 문단\n\n둘째 문단',
    })
  })

  it('JSON이 아니면 파싱 오류를 던진다', () => {
    expect(() => parseSections('그냥 문장입니다.')).toThrow(GenerateError)
    expect(() => parseSections('{}')).toThrow(GenerateError)
  })
})

describe('섹션별 최소 분량 (PRD 8.3, 8.4)', () => {
  it('필기 D-8 이상이 PRD 8.3 표와 같다', () => {
    const spec = getReportSpec('필기', 'normal', 2026)
    expect(spec.sections.map((s) => [s.minChars, s.maxChars])).toEqual([
      [180, 250], [350, 450], [350, 450], [500, 650], [600, 800], [300, 400],
      [300, 400], [300, 400], [200, 280], [250, 330], [200, 280], [180, 250],
      [280, 360], [300, 400],
    ])
    // PRD 8.3 본문은 "합계 4,000~4,800자"라 적었으나 표를 더하면
    // 4,290~5,700입니다. 표의 값을 그대로 씁니다.
    expect(targetChars(spec)).toBe(4290)
    expect(targetMaxChars(spec)).toBe(5700)
  })

  it('면접 D-8 이상이 PRD 8.4 표와 같다', () => {
    const spec = getReportSpec('면접', 'normal', 2026)
    expect(spec.sections.map((s) => [s.minChars, s.maxChars])).toEqual([
      [180, 250], [350, 450], [380, 480], [500, 650], [280, 380], [380, 480],
      [380, 480], [550, 700], [300, 400], [250, 330], [250, 330], [300, 400],
      [180, 250], [280, 360], [300, 400],
    ])
    expect(targetChars(spec)).toBe(4860)
    expect(targetMaxChars(spec)).toBe(6340)
  })

  it('분량이 축소 전보다 줄었다', () => {
    // 축소 전 하한 합계는 필기 7,200 / 면접 7,900이었고 소요가 217초 / 308초였습니다
    expect(targetChars(getReportSpec('필기', 'normal', 2026))).toBeLessThan(7200)
    expect(targetChars(getReportSpec('면접', 'normal', 2026))).toBeLessThan(7900)
  })

  it('모든 섹션에 분량과 근거가 지정돼 있다 (PRD 8.5, 8.8)', () => {
    for (const type of ['필기', '면접'] as const) {
      for (const range of ['normal', 'short', 'eve', 'dday'] as const) {
        for (const hasStartTime of [true, false]) {
          for (const section of getReportSpec(type, range, 2026, { hasStartTime })
            .sections) {
            expect(section.minChars, section.title).toBeGreaterThan(0)
            expect(section.maxChars, section.title).toBeGreaterThan(section.minChars)
            expect(section.basis, section.title).toBeTruthy()
          }
        }
      }
    }
  })

  it('D-DAY는 구성이 줄어드는 만큼 목표도 낮다 (PRD 8.8)', () => {
    const normal = targetChars(getReportSpec('필기', 'normal', 2026))
    const dday = targetChars(getReportSpec('필기', 'dday', 2026))
    expect(dday).toBeLessThan(normal)
  })

  it('명식과 캘린더에도 해설을 요구한다', () => {
    const spec = getReportSpec('필기', 'normal', 2026)
    const saju = spec.sections.find((x) => x.key === 'saju')!
    const cal = spec.sections.find((x) => x.key === 'calendar')!
    // 그림만 두면 무료 결과와 차이가 없어 짧은 해설을 붙였습니다
    expect(saju.source).toBe('calc+ai')
    expect(cal.source).toBe('calc+ai')
    expect([saju.minChars, saju.maxChars]).toEqual([180, 250])
    expect([cal.minChars, cal.maxChars]).toEqual([180, 250])
  })

  it('신규 섹션 2와 마지막 섹션은 조각을 앞에 둔다 (PRD 5.6, 8.18)', () => {
    for (const type of ['필기', '면접'] as const) {
      const spec = getReportSpec(type, 'normal', 2026)
      expect(spec.sections[1].key).toBe('pattern')
      expect(spec.sections[1].source).toBe('fragment+ai')
      expect(spec.sections[spec.sections.length - 1].key).toBe('strategy')
      expect(spec.sections[spec.sections.length - 1].source).toBe('fragment+ai')
    }
  })
})

describe('분량 검증 (PRD 8.3)', () => {
  const spec = getReportSpec('필기', 'normal', 2026)

  /** 각 섹션을 하한 × ratio 만큼 채웁니다 */
  function fill(ratio: number): Record<string, string> {
    const out: Record<string, string> = {}
    for (const s of spec.sections) out[s.key] = '가'.repeat(Math.round(s.minChars * ratio))
    return out
  }

  it('공백을 포함해 세고 앞뒤 공백은 버린다', () => {
    expect(countChars('  가 나  ')).toBe(3)
  })

  it('하한을 채우면 통과한다', () => {
    const r = checkLength(fill(1), spec)
    expect(r.total).toBe(4290)
    expect(r.target).toBe(4290)
    expect(r.targetMax).toBe(5700)
    expect(r.ok).toBe(true)
    expect(r.over).toBe(false)
    expect(r.short).toHaveLength(0)
  })

  it('하한의 70% 미만이면 실패로 본다', () => {
    expect(checkLength(fill(0.69), spec).ok).toBe(false)
    expect(checkLength(fill(LENGTH_TOLERANCE), spec).ok).toBe(true)
  })

  it('상한의 150%를 넘으면 경고로 표시한다 (실패는 아니다)', () => {
    const overRatio = (spec.sections.reduce((a, s) => a + s.maxChars, 0) *
      LENGTH_OVER_TOLERANCE) / spec.sections.reduce((a, s) => a + s.minChars, 0)

    const r = checkLength(fill(overRatio + 0.1), spec)
    expect(r.over).toBe(true)
    // 넘쳐도 실패로 돌리지 않습니다. 이미 쓴 원가를 버리면 손해가 두 배입니다.
    expect(r.ok).toBe(true)
  })

  it('축소 전 실측 9,000자는 이제 상한 초과로 잡힌다', () => {
    // 하한만 두었을 때 필기가 실제로 9,000자 넘게 썼습니다
    const r = checkLength({ studyType: '가'.repeat(9000) }, spec)
    expect(r.over).toBe(true)
  })

  it('실측 3,069자는 지금 기준으로도 미달이다', () => {
    const r = checkLength({ studyType: '가'.repeat(2900) }, spec)
    expect(r.ok).toBe(false)
  })

  it('모자란 섹션과 넘친 섹션을 각각 짚어준다', () => {
    const content = fill(1)
    content.seat = '가'.repeat(10)
    content.weekPlan = '가'.repeat(5000)

    const r = checkLength(content, spec)
    expect(r.short.map((x) => x.key)).toEqual(['seat'])
    expect(r.short[0].minChars).toBe(200)
    expect(r.long.map((x) => x.key)).toEqual(['weekPlan'])
    expect(r.long[0].maxChars).toBe(800)
  })
})
