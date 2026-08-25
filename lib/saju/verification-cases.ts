/**
 * 만세력 검증 사례 10건
 *
 * 확정된 계산 규칙을 확인하는 사례입니다.
 *
 *   - 절기 경계(년주, 월주)는 보정하지 않은 원본 시각으로 판정
 *   - 시주는 보정 후 시각으로 판정 (실질 자시 시작 23:30)
 *   - 일주는 원본 날짜 기준 (조자시 방식)
 *
 * 각 사례에는 기대 결과(expect)를 함께 적어 두었고,
 * test/saju-output.md 가 실제 계산값과 대조해 O/X로 표시합니다.
 */

export interface CaseExpectation {
  /** 기대하는 년주 (예: '을사') */
  year?: string
  /** 기대하는 보정 후 시각 'HH:mm' */
  corrected?: string
  /** 기대하는 시지 이름 (예: '해시', '자시') */
  hourBranch?: string
  /** 일주가 어느 날짜 기준이어야 하는지 'YYYY-MM-DD' */
  dayOf?: string
  /** 기둥 개수 */
  pillars?: 3 | 4
}

export interface VerificationCase {
  id: number
  label: string
  /** 이 사례로 무엇을 확인하는지 */
  purpose: string
  birthDate: string
  birthTime: string | null
  hasBirthTime: boolean
  /** 기업 설립일 사례면 true (3기둥만 계산) */
  isCompany?: boolean
  /** 기대 결과. saju-output.md 가 실제값과 대조합니다 */
  expect: CaseExpectation
  /** 확인할 때 눈여겨봐야 할 점 */
  note?: string
}

export const VERIFICATION_CASES: VerificationCase[] = [
  {
    id: 1,
    label: '입춘 전날',
    purpose: '입춘 전날 출생은 을사년이어야 함',
    birthDate: '2026-02-03',
    birthTime: '12:00',
    hasBirthTime: true,
    expect: { year: '을사', pillars: 4 },
    note: '2026년 입춘은 02-04 05:02입니다',
  },
  {
    id: 2,
    label: '입춘 2분 전',
    purpose: '보정 없이 원본 시각으로 비교해 을사년이어야 함',
    birthDate: '2026-02-04',
    birthTime: '05:00',
    hasBirthTime: true,
    expect: { year: '을사', pillars: 4 },
    note: '보정을 적용했다면 04:30이 되어 역시 을사년이지만, 경계가 달라집니다',
  },
  {
    id: 3,
    label: '입춘 3분 후',
    purpose: '보정 없이 원본 시각으로 비교해 병오년이어야 함',
    birthDate: '2026-02-04',
    birthTime: '05:05',
    hasBirthTime: true,
    expect: { year: '병오', pillars: 4 },
    note: '보정을 적용했다면 04:35이라 을사년이 됐을 자리입니다. 이 사례가 규칙 변경을 확인합니다',
  },
  {
    id: 4,
    label: '자시 직전 (22:59)',
    purpose: '보정 후 22:29이므로 해시',
    birthDate: '1995-06-15',
    birthTime: '22:59',
    hasBirthTime: true,
    expect: { corrected: '22:29', hourBranch: '해시', dayOf: '1995-06-15', pillars: 4 },
  },
  {
    id: 5,
    label: '자시 시작 (23:31)',
    purpose: '보정 후 23:01이므로 자시',
    birthDate: '1995-06-15',
    birthTime: '23:31',
    hasBirthTime: true,
    expect: { corrected: '23:01', hourBranch: '자시', dayOf: '1995-06-15', pillars: 4 },
    note: '실질 자시 시작이 23:30으로 밀립니다. 의도한 동작입니다',
  },
  {
    id: 6,
    label: '자정 직후 (00:29) — 날짜 넘어감 확인',
    purpose: '보정 후 전날 23:59이지만 일주는 6월 16일이어야 함',
    birthDate: '1995-06-16',
    birthTime: '00:29',
    hasBirthTime: true,
    expect: { corrected: '23:59', hourBranch: '자시', dayOf: '1995-06-16', pillars: 4 },
    note: '가장 중요한 사례입니다. 보정 때문에 시각이 전날로 넘어가도 조자시 방식이므로 일주는 원본 날짜(6/16)를 유지해야 합니다',
  },
  {
    id: 7,
    label: '서머타임 기간 출생',
    purpose: '30분 + 60분 = 90분 보정',
    birthDate: '1988-06-15',
    birthTime: '14:30',
    hasBirthTime: true,
    expect: { corrected: '13:00', pillars: 4 },
    note: '1988-05-08 ~ 1988-10-09 구간',
  },
  {
    id: 8,
    label: '일반 사례',
    purpose: '평상시 30분 보정',
    birthDate: '1990-05-15',
    birthTime: '14:30',
    hasBirthTime: true,
    expect: { corrected: '14:00', pillars: 4 },
  },
  {
    id: 9,
    label: '태어난 시간 모름',
    purpose: '3기둥으로 진행, 보정 없음',
    birthDate: '1990-05-15',
    birthTime: null,
    hasBirthTime: false,
    expect: { pillars: 3 },
    note: '8번과 같은 날짜입니다. 시주만 빠지고 년월일주는 같아야 합니다',
  },
  {
    id: 10,
    label: '기업 설립일 (삼성전자 1969-01-13)',
    purpose: '기업 3기둥 — 시각 없음, 보정 없음',
    birthDate: '1969-01-13',
    birthTime: null,
    hasBirthTime: false,
    isCompany: true,
    expect: { pillars: 3 },
    note: '소한(01-06) 이후이므로 축월입니다',
  },
]
