/**
 * 만세력 4기둥 계산 (PRD 4.2, 4.3, 4.4)
 *
 * ── 시간 보정을 어디에 적용하는가 (확정 규칙) ──
 *
 * 경도 보정(30분)과 서머타임 보정(60분)은 **시주 계산에만** 적용합니다.
 *
 * 절기 테이블은 KST 기준으로 생성했습니다. 여기에 보정된 출생 시각을
 * 맞대면 기준이 섞입니다. 절기 경계(년주, 월주)는 보정하지 않은 원본
 * 시각으로 비교하고, 일주도 원본 날짜로 셉니다.
 *
 * 반대로 시지는 "그 사람이 실제로 몇 시에 태어났는가"를 묻는 자리이므로
 * 보정을 적용합니다. 그 결과 실질 자시 시작이 23:30이 되지만, 경도 보정을
 * 도입한 이상 시지에 반영하는 쪽이 일관됩니다. 의도한 동작입니다.
 *
 * 계산 순서 (PRD 4.2)
 *   1단계 년주 (입춘 경계, 원본 시각)
 *   2단계 월주 (절입 구간 + 년간 5패턴, 원본 시각)
 *   3단계 일주 (1900-01-01 갑술일 기준 경과일, 원본 날짜)
 *   4단계 시주 (보정 시각으로 시지 결정 + 원본 날짜의 일간으로 시간 결정)
 *
 * 예외 (PRD 4.3)
 *   4.3.1 자시  23:00-23:59 출생은 당일 유지 (조자시 방식)
 *   4.3.2 입춘  시각 단위까지 비교
 *   4.3.3 시간 모름  3기둥으로 진행
 */

import solarterms from './solarterms.json'
import {
  BRANCHES,
  BRANCH_ELEMENT,
  BRANCH_HANJA,
  BRANCH_TO_MONTH_ORDER,
  DAY_PILLAR_EPOCH_INDEX,
  DAY_STEM_NAMES,
  DST_PERIODS,
  HOUR_STEM_START,
  LONGITUDE_OFFSET_MINUTES,
  MONTH_STEM_START,
  STEMS,
  STEM_ELEMENT,
  STEM_HANJA,
  TERM_NAMES,
  TERM_TO_BRANCH,
  type Element,
  type TermName,
} from './constants'

const TERMS: Record<string, Record<string, string>> = solarterms as never

// ─── 타입 ───

export interface Pillar {
  stemIndex: number
  branchIndex: number
  /** 60갑자 인덱스 (0-59) */
  index: number
  /** 예: '갑자' */
  name: string
  /** 예: '甲子' */
  hanja: string
  stemElement: Element
  branchElement: Element
}

export interface Saju {
  year: Pillar
  month: Pillar
  day: Pillar
  /** 태어난 시간을 모르면 null (PRD 4.3.3) */
  hour: Pillar | null
  hasBirthTime: boolean
  /** 일간 인덱스 (0-9) */
  dayStemIndex: number
  /** 예: '병화' — fragments.json dayStem 키 */
  dayStemName: string
  dayStemElement: Element
  /** 일주 60갑자 인덱스. PRD 3.7 변형 선택에 사용합니다. */
  dayPillarIndex: number
  /** 입력받은 원본 시각. 년주·월주·일주가 이 값을 씁니다 */
  raw: Date
  /** 보정 후 시각. 시주가 이 값을 씁니다. 시간을 모르면 null */
  corrected: Date | null
}

/** PRD 4.4 기업 사주 — 시각 정보가 없으므로 3기둥만 계산합니다 */
export interface CompanySaju {
  year: Pillar
  month: Pillar
  day: Pillar
  dayStemIndex: number
  dayStemName: string
  dayStemElement: Element
  dayPillarIndex: number
}

// ─── 유틸 ───

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Date를 로컬 기준 YYYY-MM-DD 문자열로 (UTC 변환 없이) */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function makePillar(stemIndex: number, branchIndex: number): Pillar {
  const s = ((stemIndex % 10) + 10) % 10
  const b = ((branchIndex % 12) + 12) % 12
  // 60갑자 인덱스는 천간 10, 지지 12의 조합에서 유일하게 결정됩니다
  let index = 0
  for (let i = 0; i < 60; i++) {
    if (i % 10 === s && i % 12 === b) {
      index = i
      break
    }
  }
  return {
    stemIndex: s,
    branchIndex: b,
    index,
    name: `${STEMS[s]}${BRANCHES[b]}`,
    hanja: `${STEM_HANJA[s]}${BRANCH_HANJA[b]}`,
    stemElement: STEM_ELEMENT[s],
    branchElement: BRANCH_ELEMENT[b],
  }
}

function pillarFromIndex(index: number): Pillar {
  const i = ((index % 60) + 60) % 60
  return makePillar(i % 10, i % 12)
}

/** 'YYYY-MM-DD HH:mm' 형식의 절기 시각을 로컬 Date로 파싱합니다 */
function parseTermTime(s: string): Date {
  const [datePart, timePart] = s.split(' ')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

// ─── 시간 보정 (PRD 4.2 4단계 4-1) ───

function isInDST(date: Date): boolean {
  const key = toDateKey(date)
  return DST_PERIODS.some(([from, to]) => key >= from && key <= to)
}

/**
 * 출생 시각을 진태양시에 가깝게 보정합니다.
 * 경도 보정 30분, 서머타임 기간이면 추가로 60분을 뺍니다.
 *
 * **시주 계산에서만 호출합니다.** 년주, 월주, 일주는 원본 시각을 씁니다.
 * 태어난 시간을 모르는 경우와 기업 설립일은 이 단계를 건너뜁니다.
 */
export function applyTimeCorrection(date: Date): Date {
  let minutes = LONGITUDE_OFFSET_MINUTES
  if (isInDST(date)) minutes += 60

  return new Date(date.getTime() - minutes * 60 * 1000)
}

// ─── 절기 조회 ───

interface TermPoint {
  name: TermName
  time: Date
}

/** 해당 연도의 절입 12개를 시각 순으로 반환합니다 */
function getYearTerms(year: number): TermPoint[] {
  const raw = TERMS[String(year)]
  if (!raw) return []
  return TERM_NAMES.filter((n) => raw[n]).map((n) => ({
    name: n,
    time: parseTermTime(raw[n]),
  }))
}

/** 절기 테이블이 대상 연도를 담고 있는지 */
export function hasTermData(year: number): boolean {
  return Boolean(TERMS[String(year)])
}

/** 입춘 시각. 테이블에 없으면 null */
export function getIpchun(year: number): Date | null {
  const raw = TERMS[String(year)]
  if (!raw || !raw['입춘']) return null
  return parseTermTime(raw['입춘'])
}

// ─── 1단계: 년주 (PRD 4.2) ───

/**
 * 입춘 시각 이전이면 전년도로 처리합니다 (PRD 4.3.2 — 시각 단위까지 비교).
 *
 * 넘겨받는 date는 **보정하지 않은 원본 시각**이어야 합니다.
 * 예: 2026년 입춘은 02-04 05:02이므로 05:00 출생은 2025년(을사),
 *     05:05 출생은 2026년(병오)입니다.
 */
export function getSajuYear(date: Date): number {
  const y = date.getFullYear()
  const ipchun = getIpchun(y)
  if (!ipchun) return y
  return date.getTime() < ipchun.getTime() ? y - 1 : y
}

export function getYearPillar(date: Date): Pillar {
  const year = getSajuYear(date)
  const stemIndex = ((year - 4) % 10 + 10) % 10
  const branchIndex = ((year - 4) % 12 + 12) % 12
  return makePillar(stemIndex, branchIndex)
}

// ─── 2단계: 월주 (PRD 4.2) ───

/**
 * 대상일이 속한 절입 구간의 월지를 찾습니다.
 * 소한 이전(1월 초)이면 전년도 대설 구간(자월)입니다.
 */
export function getMonthBranchIndex(date: Date): number {
  const y = date.getFullYear()
  const terms = getYearTerms(y)

  if (terms.length === 0) {
    // 절기 데이터가 없으면 양력 월로 근사합니다 (1940년 이전 설립 기업 등)
    // 입춘 기준 인월(2)부터 시작하므로 2월 -> 2
    return (date.getMonth() + 2) % 12
  }

  let current: TermPoint | null = null
  for (const t of terms) {
    if (date.getTime() >= t.time.getTime()) current = t
    else break
  }

  if (current) return TERM_TO_BRANCH[current.name]

  // 그 해 소한보다 이르면 전년도 대설 구간 = 자월(0)
  return TERM_TO_BRANCH['대설']
}

export function getMonthPillar(date: Date): Pillar {
  const branchIndex = getMonthBranchIndex(date)
  const yearPillar = getYearPillar(date)

  // 년간 5패턴: 갑기(0,5) 을경(1,6) 병신(2,7) 정임(3,8) 무계(4,9)
  const start = MONTH_STEM_START[yearPillar.stemIndex % 5]
  const order = BRANCH_TO_MONTH_ORDER[branchIndex]
  const stemIndex = (start + order) % 10

  return makePillar(stemIndex, branchIndex)
}

// ─── 3단계: 일주 (PRD 4.1.2, 4.2) ───

const EPOCH_UTC = Date.UTC(1900, 0, 1)

/**
 * 일주 인덱스 = ((대상일 - 1900-01-01).days + 10) % 60
 * 시분을 제거하고 날짜만으로 경과일을 셉니다.
 */
export function getDayPillarIndex(date: Date): number {
  const dayUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const days = Math.round((dayUTC - EPOCH_UTC) / 86400000)
  return (((days + DAY_PILLAR_EPOCH_INDEX) % 60) + 60) % 60
}

export function getDayPillar(date: Date): Pillar {
  return pillarFromIndex(getDayPillarIndex(date))
}

export function getDayStemIndex(date: Date): number {
  return getDayPillarIndex(date) % 10
}

// ─── 4단계: 시주 (PRD 4.2, 4.3.1) ───

/**
 * 시지 결정 (2시간 단위 12구간).
 * 23:00-00:59는 자시(0)입니다.
 */
export function getHourBranchIndex(date: Date): number {
  const h = date.getHours()
  if (h === 23) return 0
  return Math.floor((h + 1) / 2) % 12
}

/**
 * 시주를 계산합니다.
 *
 * 시지는 보정된 시각(corrected)으로 정하고, 시간(천간)은 **원본 날짜의
 * 일간**(dayStemIndex)으로 정합니다.
 *
 * PRD 4.3.1 자시 처리 — 23:00-23:59 출생은 당일 유지로 통일합니다(조자시 방식).
 * 야자시 방식(다음 날 일간으로 시간을 뽑는 방식)과 결과가 다르지만
 * 서비스 안에서 일관성만 지키면 되므로 조자시로 고정합니다.
 *
 * 일간을 인자로 받는 이유가 여기 있습니다. 보정 때문에 보정된 시각이
 * 전날로 넘어가는 경우(예: 00:29 출생 → 보정 후 전날 23:59)가 생기는데,
 * 그때도 일주는 원본 날짜를 따라야 하기 때문입니다.
 */
export function getHourPillar(corrected: Date, dayStemIndex: number): Pillar {
  const branchIndex = getHourBranchIndex(corrected)
  const start = HOUR_STEM_START[dayStemIndex % 5]
  const stemIndex = (start + branchIndex) % 10
  return makePillar(stemIndex, branchIndex)
}

// ─── 통합 ───

export interface CalculateInput {
  /** 생년월일 'YYYY-MM-DD' */
  birthDate: string
  /** 태어난 시간 'HH:mm'. hasBirthTime이 false면 무시됩니다 */
  birthTime?: string | null
  hasBirthTime: boolean
}

export function parseLocalDateTime(dateStr: string, timeStr?: string | null): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!timeStr) return new Date(y, m - 1, d, 0, 0, 0, 0)
  const [hh, mm] = timeStr.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

export function calculateSaju(input: CalculateInput): Saju {
  const raw = parseLocalDateTime(
    input.birthDate,
    input.hasBirthTime ? input.birthTime ?? '00:00' : null
  )

  // 절기 판정 — 보정하지 않은 원본 시각으로 비교합니다.
  // 절기 테이블이 KST 기준이라 보정된 시각을 맞대면 기준이 섞입니다.
  const year = getYearPillar(raw)
  const month = getMonthPillar(raw)

  // 일주 — 원본 날짜 기준
  const day = getDayPillar(raw)
  const dayPillarIndex = getDayPillarIndex(raw)
  const dayStemIndex = dayPillarIndex % 10

  // 시주 — 보정 시각으로 시지를 정하고, 시간은 원본 날짜의 일간으로 정합니다
  const corrected = input.hasBirthTime ? applyTimeCorrection(raw) : null
  const hour = corrected ? getHourPillar(corrected, dayStemIndex) : null

  return {
    year,
    month,
    day,
    hour,
    hasBirthTime: input.hasBirthTime,
    dayStemIndex,
    dayStemName: DAY_STEM_NAMES[dayStemIndex],
    dayStemElement: STEM_ELEMENT[dayStemIndex],
    dayPillarIndex,
    raw,
    corrected,
  }
}

/**
 * PRD 4.4 기업 사주 — 법인 설립일 기준 3기둥.
 * 시각 정보가 없으므로 시간 보정과 시주 계산을 하지 않습니다.
 */
export function calculateCompanySaju(foundedDate: string): CompanySaju {
  const date = parseLocalDateTime(foundedDate, null)

  const year = getYearPillar(date)
  const month = getMonthPillar(date)
  const day = getDayPillar(date)
  const dayPillarIndex = getDayPillarIndex(date)
  const dayStemIndex = dayPillarIndex % 10

  return {
    year,
    month,
    day,
    dayStemIndex,
    dayStemName: DAY_STEM_NAMES[dayStemIndex],
    dayStemElement: STEM_ELEMENT[dayStemIndex],
    dayPillarIndex,
  }
}

export { makePillar, pillarFromIndex }
