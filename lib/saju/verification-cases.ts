/**
 * PRD 17장 검증 사례 10건
 *
 * PRD가 반드시 포함하라고 명시한 항목
 *   - 입춘 직전 출생 (2월 3일)
 *   - 입춘 당일 시각 전후 (05:45 / 05:47)
 *   - 자시 경계 (22:59 / 23:01)
 *   - 서머타임 기간 출생 (1988년 6월)
 *   - 태어난 시간 모름
 *   - 기업 설립일 (시간 없음)
 *
 * 기대값은 아직 없습니다. test/saju-output.md의 계산 결과를 다른 만세력
 * 서비스와 대조한 뒤 calculate.test.ts에 채워 넣으시기 바랍니다.
 */

export interface VerificationCase {
  id: number
  label: string
  /** PRD 17장의 어떤 항목을 확인하는 사례인지 */
  purpose: string
  birthDate: string
  birthTime: string | null
  hasBirthTime: boolean
  /** 기업 설립일 사례면 true (3기둥만 계산) */
  isCompany?: boolean
  /** 확인할 때 눈여겨봐야 할 점 */
  note?: string
}

export const VERIFICATION_CASES: VerificationCase[] = [
  {
    id: 1,
    label: '입춘 직전 출생 (2월 3일)',
    purpose: '입춘 경계 — 전년도로 넘어가는지',
    birthDate: '2026-02-03',
    birthTime: '12:00',
    hasBirthTime: true,
    note: '2026 입춘은 02-04 05:02이므로 년주가 2025년(을사)이어야 합니다',
  },
  {
    id: 2,
    label: '입춘 당일 05:45 (PRD 명시)',
    purpose: '입춘 시각 전후 비교',
    birthDate: '2026-02-04',
    birthTime: '05:45',
    hasBirthTime: true,
    note: 'PRD 예시는 입춘을 05:46으로 적었으나 실제 계산값은 05:02입니다',
  },
  {
    id: 3,
    label: '입춘 당일 05:47 (PRD 명시)',
    purpose: '입춘 시각 전후 비교',
    birthDate: '2026-02-04',
    birthTime: '05:47',
    hasBirthTime: true,
    note: '사례 2와 년주가 같게 나옵니다. 아래 사례 4, 5를 함께 보십시오',
  },
  {
    id: 4,
    label: '보정 후 입춘 직전 (05:31)',
    purpose: '경도 보정 30분을 반영한 실제 경계 직전',
    birthDate: '2026-02-04',
    birthTime: '05:31',
    hasBirthTime: true,
    note: '보정 후 05:01 → 입춘(05:02) 이전 → 2025년(을사)',
  },
  {
    id: 5,
    label: '보정 후 입춘 직후 (05:33)',
    purpose: '경도 보정 30분을 반영한 실제 경계 직후',
    birthDate: '2026-02-04',
    birthTime: '05:33',
    hasBirthTime: true,
    note: '보정 후 05:03 → 입춘(05:02) 이후 → 2026년(병오)',
  },
  {
    id: 6,
    label: '자시 경계 22:59',
    purpose: '자시 직전 — 해시로 나와야 함',
    birthDate: '1995-06-15',
    birthTime: '22:59',
    hasBirthTime: true,
    note: '보정 후 22:29 → 해시',
  },
  {
    id: 7,
    label: '자시 경계 23:01',
    purpose: '자시 직후 — 조자시 방식이므로 일주는 당일 유지',
    birthDate: '1995-06-15',
    birthTime: '23:01',
    hasBirthTime: true,
    note: '보정 후 22:31 → 아직 해시입니다. 보정 때문에 경계가 23:30으로 밀립니다',
  },
  {
    id: 8,
    label: '서머타임 기간 출생 (1988년 6월)',
    purpose: '서머타임 60분 추가 보정',
    birthDate: '1988-06-15',
    birthTime: '14:30',
    hasBirthTime: true,
    note: '1988-05-08 ~ 1988-10-09 구간. 30분 + 60분 = 90분을 뺍니다 → 13:00',
  },
  {
    id: 9,
    label: '태어난 시간 모름',
    purpose: '3기둥 진행 + 시간 보정 생략',
    birthDate: '1990-05-15',
    birthTime: null,
    hasBirthTime: false,
    note: '시주가 없고 오행 가중치에서 시간, 시지를 제외합니다',
  },
  {
    id: 10,
    label: '기업 설립일 (삼성전자 1969-01-13)',
    purpose: '기업 3기둥 — 시각 없음, 보정 없음',
    birthDate: '1969-01-13',
    birthTime: null,
    hasBirthTime: false,
    isCompany: true,
    note: 'PRD 8.7 출력 예시의 설립일입니다. 소한(01-06) 이후이므로 축월입니다',
  },
]
