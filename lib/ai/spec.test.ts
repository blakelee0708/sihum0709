/**
 * 리포트 구성과 파싱 검증 (PRD 8.3, 8.4, 8.6, 8.10)
 */

import { describe, expect, it } from 'vitest'

import { applyMissingFoundedDate, getReportSpec, toReportType, DDAY_NOTICE } from './spec'
import { checkLength, countChars, targetChars, LENGTH_TOLERANCE } from './length'
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

describe('필기 리포트 구성 (PRD 8.3, 8.6)', () => {
  it('D-8 이상은 섹션 11개', () => {
    const spec = getReportSpec('필기', 'normal', 2026)
    expect(spec.sections).toHaveLength(11)
    expect(spec.sections[0].key).toBe('saju')
    expect(spec.sections.map((s) => s.key)).toContain('weekPlan')
  })

  it('D-2~D-7은 7일 플랜이 남은 기간 집중 배분으로 바뀐다', () => {
    const spec = getReportSpec('필기', 'short', 2026)
    const plan = spec.sections.find((s) => s.key === 'weekPlan')!
    expect(plan.title).toBe('남은 기간 집중 배분')
  })

  it('D-1은 오늘 밤과 내일 아침이 들어가고 7일 플랜이 빠진다', () => {
    const spec = getReportSpec('필기', 'eve', 2026)
    const keys = spec.sections.map((s) => s.key)
    expect(keys).toContain('tonight')
    expect(keys).toContain('morning')
    expect(keys).not.toContain('weekPlan')
  })

  it('D-DAY는 지금 바로 할 3가지가 최상단이고 분량이 줄어든다', () => {
    const spec = getReportSpec('필기', 'dday', 2026)
    expect(spec.sections[0].key).toBe('nowThree')
    expect(spec.sections[0].highlight).toBe(true)
    expect(spec.sections).toHaveLength(8)
    expect(spec.sections.map((s) => s.key)).not.toContain('weekPlan')
  })

  it('캘린더 제목에 시험 연도가 들어간다', () => {
    const spec = getReportSpec('필기', 'normal', 2027)
    const cal = spec.sections.find((s) => s.key === 'calendar')!
    expect(cal.title).toBe('2027년 시험운 캘린더')
  })
})

describe('면접 리포트 구성 (PRD 8.4)', () => {
  it('섹션 11개이고 7일 플랜이 없다', () => {
    const spec = getReportSpec('면접', 'normal', 2026)
    expect(spec.sections).toHaveLength(11)
    expect(spec.sections.map((s) => s.key)).not.toContain('weekPlan')
  })

  it('시간대별 운용 섹션을 넣지 않는다 (PRD 8.4)', () => {
    const spec = getReportSpec('면접', 'normal', 2026)
    expect(spec.sections.map((s) => s.key)).not.toContain('dayTimeline')
  })

  it('캘린더 제목이 면접운이다', () => {
    const spec = getReportSpec('면접', 'normal', 2026)
    const cal = spec.sections.find((s) => s.key === 'calendar')!
    expect(cal.title).toBe('2026년 면접운 캘린더')
  })

  it('설립일 미확인이면 궁합이 위치 섹션으로 바뀐다 (PRD 8.7)', () => {
    const spec = applyMissingFoundedDate(getReportSpec('면접', 'normal', 2026))
    const s = spec.sections.find((x) => x.key === 'compatibility')!
    expect(s.title).toBe('이 조직에서 나의 위치')
    // 자리를 비워두지 않으므로 섹션 개수는 그대로입니다
    expect(spec.sections).toHaveLength(11)
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

describe('검색어 (PRD 8.10)', () => {
  it('PRD가 지정한 검색어를 그대로 쓴다', () => {
    expect(SEARCH_QUERIES.companyFounded('삼성전자')).toBe('삼성전자 법인 설립일 연혁')
    expect(SEARCH_QUERIES.companyInfo('삼성전자')).toBe('삼성전자 사업 인재상 최근')
    expect(SEARCH_QUERIES.examSubjects('국가직 9급')).toBe('국가직 9급 시험 과목 구성 배점')
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
  it('필기 D-8 이상 합계가 4,800자다', () => {
    const spec = getReportSpec('필기', 'normal', 2026)
    expect(spec.sections.reduce((a, x) => a + x.minChars, 0)).toBe(4800)
  })

  it('면접 D-8 이상 합계가 5,150자다', () => {
    const spec = getReportSpec('면접', 'normal', 2026)
    expect(spec.sections.reduce((a, x) => a + x.minChars, 0)).toBe(5150)
  })

  it('대체 섹션에도 분량이 지정돼 있다 (PRD 8.6)', () => {
    for (const type of ['필기', '면접'] as const) {
      for (const range of ['normal', 'short', 'eve', 'dday'] as const) {
        for (const section of getReportSpec(type, range, 2026).sections) {
          expect(section.minChars).toBeGreaterThan(0)
        }
      }
    }
  })

  it('D-DAY는 구성이 줄어드는 만큼 목표도 낮다 (PRD 8.6)', () => {
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
    expect(saju.minChars).toBe(200)
    expect(cal.minChars).toBe(250)
  })
})

describe('분량 검증 (PRD 8.3)', () => {
  const spec = getReportSpec('필기', 'normal', 2026)

  function fill(ratio: number): Record<string, string> {
    const out: Record<string, string> = {}
    for (const s of spec.sections) out[s.key] = '가'.repeat(Math.round(s.minChars * ratio))
    return out
  }

  it('공백을 포함해 세고 앞뒤 공백은 버린다', () => {
    expect(countChars('  가 나  ')).toBe(3)
  })

  it('목표를 채우면 통과한다', () => {
    const r = checkLength(fill(1), spec)
    expect(r.total).toBe(4800)
    expect(r.target).toBe(4800)
    expect(r.ok).toBe(true)
    expect(r.short).toHaveLength(0)
  })

  it('목표의 70% 미만이면 실패로 본다', () => {
    expect(checkLength(fill(0.69), spec).ok).toBe(false)
    expect(checkLength(fill(LENGTH_TOLERANCE), spec).ok).toBe(true)
  })

  it('실측 3,069자는 지금 기준으로 미달이다', () => {
    // 프롬프트를 고치기 전 실측값입니다. 이 검증이 걸러내야 하는 대상입니다.
    const r = checkLength({ studyType: '가'.repeat(3069) }, spec)
    expect(r.ok).toBe(false)
  })

  it('모자란 섹션을 짚어준다', () => {
    const content = fill(1)
    content.seat = '가'.repeat(10)
    const r = checkLength(content, spec)
    expect(r.short.map((x) => x.key)).toEqual(['seat'])
    expect(r.short[0].minChars).toBe(300)
  })
})
