/**
 * 만세력 상수 (PRD 4.2, 5.1, 5.2)
 *
 * 이 파일의 값은 PRD에 명시된 것을 그대로 옮긴 것입니다. 임의로 바꾸지 마십시오.
 */

// 타입

export type Element = '목' | '화' | '토' | '금' | '수'
export type Relation = '상생' | '비화' | '상극' | '설기' | '아극'
export type ExamType = '필기' | '면접' | '실기'
export type MethodKey = '객관식필기' | '서술논술' | '면접' | '실기'
export type WorkType =
  | '사람을만나는일'
  | '분석하고만드는일'
  | '조율하고운영하는일'
  | '현장에서움직이는일'
export type CompanyScale =
  | '대기업'
  | '중견기업'
  | '공기업'
  | '금융권'
  | '스타트업'
  | '기타'

// 천간 지지

export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const
export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const

export const STEM_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const BRANCH_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

/** PRD 5.1 천간 오행 — 갑 을 병 정 무 기 경 신 임 계 */
export const STEM_ELEMENT: Element[] = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수']

/** PRD 5.1 지지 오행 — 자 축 인 묘 진 사 오 미 신 유 술 해 */
export const BRANCH_ELEMENT: Element[] = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수']

/** 일간 표기 (fragments.json dayStem 키) — 갑목 을목 병화 ... */
export const DAY_STEM_NAMES = [
  '갑목', '을목', '병화', '정화', '무토',
  '기토', '경금', '신금', '임수', '계수',
] as const

export const ELEMENTS: Element[] = ['목', '화', '토', '금', '수']

// PRD 5.2 가중치

export const WEIGHTS = {
  dayStem: 3, // 일간 — 사주에서 본인을 뜻하는 자리
  monthBranch: 3, // 월지 — 계절을 결정하는 자리
  yearStem: 1,
  yearBranch: 1,
  monthStem: 1,
  dayBranch: 1,
  hourStem: 1,
  hourBranch: 1,
} as const

// PRD 5.5 상생 상극

/** 상생: 목생화, 화생토, 토생금, 금생수, 수생목 */
export const GENERATES: Record<Element, Element> = {
  목: '화',
  화: '토',
  토: '금',
  금: '수',
  수: '목',
}

/** 상극: 목극토, 토극수, 수극화, 화극금, 금극목 */
export const OVERCOMES: Record<Element, Element> = {
  목: '토',
  토: '수',
  수: '화',
  화: '금',
  금: '목',
}

// PRD 5.4 오행 파생 값 (모두 약한 오행 기준)

export const LUCKY_NUMBERS: Record<Element, [number, number]> = {
  목: [3, 8],
  화: [2, 7],
  토: [5, 10],
  금: [4, 9],
  수: [1, 6],
}

export const LUCKY_COLORS: Record<Element, string[]> = {
  목: ['청색', '초록'],
  화: ['적색'],
  토: ['황색', '베이지'],
  금: ['흰색', '은색'],
  수: ['검정', '남색'],
}

export const LUCKY_DIRECTIONS: Record<Element, string> = {
  목: '동',
  화: '남',
  토: '중앙',
  금: '서',
  수: '북',
}

export const LUCKY_HOURS: Record<Element, string> = {
  목: '인묘시 (03-07)',
  화: '사오시 (09-13)',
  토: '진술축미시',
  금: '신유시 (15-19)',
  수: '자해시 (21-01)',
}

/**
 * PRD 4.2 2단계 — 월간 5패턴 (년간 기준 시작 인덱스)
 * 갑기년 병인월(2) / 을경년 무인월(4) / 병신년 경인월(6)
 * 정임년 임인월(8) / 무계년 갑인월(0)
 */
export const MONTH_STEM_START = [2, 4, 6, 8, 0] as const

/**
 * PRD 4.2 4단계 — 시간 5패턴 (일간 기준 시작 인덱스)
 * 갑기일 갑자시(0) / 을경일 병자시(2) / 병신일 무자시(4)
 * 정임일 경자시(6) / 무계일 임자시(8)
 */
export const HOUR_STEM_START = [0, 2, 4, 6, 8] as const

/**
 * PRD 4.2 2단계 — 절입 구간별 월지
 * 배열 순서는 solarterms.json의 월 순서(소한 시작)와 맞춥니다.
 */
export const TERM_NAMES = [
  '소한', '입춘', '경칩', '청명', '입하', '망종',
  '소서', '입추', '백로', '한로', '입동', '대설',
] as const

export type TermName = (typeof TERM_NAMES)[number]

/** 절기명 → 그 절입 이후 구간의 월지 인덱스 */
export const TERM_TO_BRANCH: Record<TermName, number> = {
  소한: 1, // 축월
  입춘: 2, // 인월
  경칩: 3, // 묘월
  청명: 4, // 진월
  입하: 5, // 사월
  망종: 6, // 오월
  소서: 7, // 미월
  입추: 8, // 신월
  백로: 9, // 유월
  한로: 10, // 술월
  입동: 11, // 해월
  대설: 0, // 자월
}

/** 인월(2)을 0번으로 하는 월 순번. 월간 계산에 사용합니다. */
export const BRANCH_TO_MONTH_ORDER: Record<number, number> = {
  2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5,
  8: 6, 9: 7, 10: 8, 11: 9, 0: 10, 1: 11,
}

/**
 * PRD 4.2 0단계 — 서머타임 시행 기간
 * 이 기간 출생은 경도 보정 30분에 더해 60분을 뺍니다.
 */
export const DST_PERIODS: [string, string][] = [
  ['1948-05-31', '1948-09-12'],
  ['1949-04-03', '1949-09-10'],
  ['1950-04-01', '1950-09-09'],
  ['1951-05-06', '1951-09-08'],
  ['1955-05-05', '1955-09-08'],
  ['1956-05-20', '1956-09-29'],
  ['1957-05-05', '1957-09-21'],
  ['1958-05-04', '1958-09-20'],
  ['1959-05-03', '1959-09-19'],
  ['1960-05-01', '1960-09-17'],
  ['1987-05-10', '1987-10-11'],
  ['1988-05-08', '1988-10-09'],
]

/** PRD 4.2 0단계 — 동경 135도와 실제 경도(약 127.5도) 차이 보정 */
export const LONGITUDE_OFFSET_MINUTES = 30

/** PRD 4.1.2 일주 기준일. 1900-01-01 = 갑술일 (60갑자 인덱스 10) */
export const DAY_PILLAR_EPOCH = '1900-01-01'
export const DAY_PILLAR_EPOCH_INDEX = 10

/** PRD 6.3 시험 방식 궁합 점수 (강한 오행별 방식 적합도) */
export const METHOD_FIT: Record<Element, Record<MethodKey, number>> = {
  목: { 객관식필기: 70, 서술논술: 75, 면접: 72, 실기: 68 },
  화: { 객관식필기: 74, 서술논술: 58, 면접: 81, 실기: 62 },
  토: { 객관식필기: 82, 서술논술: 70, 면접: 65, 실기: 78 },
  금: { 객관식필기: 85, 서술논술: 80, 면접: 70, 실기: 75 },
  수: { 객관식필기: 72, 서술논술: 85, 면접: 78, 실기: 60 },
}

export const METHOD_KEYS: MethodKey[] = ['객관식필기', '서술논술', '면접', '실기']

/** 입력 방식(3분류) → 방식 궁합표에서 대표로 쓸 키 */
export const EXAM_TYPE_TO_METHOD_KEY: Record<ExamType, MethodKey> = {
  필기: '객관식필기',
  면접: '면접',
  실기: '실기',
}

/** PRD 6.1 시험 당일 운 지수 — 관계별 가산 */
export const DAY_SCORE_BY_RELATION: Record<Relation, number> = {
  상생: 30,
  비화: 15,
  아극: 5,
  설기: -10,
  상극: -20,
}

/** PRD 6.7 기업 궁합 — 관계별 가산 (일반 운 지수와 값이 다릅니다) */
export const COMPAT_SCORE_BY_RELATION: Record<Relation, number> = {
  상생: 30,
  비화: 15,
  아극: 10,
  설기: -5,
  상극: -15,
}

export const BASE_SCORE = 50

/** PRD 10.7 일의 성격 4분류 라벨 */
export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  사람을만나는일: '사람을 만나는 일',
  분석하고만드는일: '분석하고 만드는 일',
  조율하고운영하는일: '조율하고 운영하는 일',
  현장에서움직이는일: '현장에서 움직이는 일',
}

export const WORK_TYPES: WorkType[] = [
  '사람을만나는일',
  '분석하고만드는일',
  '조율하고운영하는일',
  '현장에서움직이는일',
]

export const COMPANY_SCALES: CompanyScale[] = [
  '대기업',
  '중견기업',
  '공기업',
  '금융권',
  '스타트업',
  '기타',
]
