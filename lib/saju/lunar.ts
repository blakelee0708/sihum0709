/**
 * 음력 → 양력 변환 (PRD 4.1.2 수정)
 *
 * PRD 4.1.2에는 "음력 변환은 필요하지 않다"고 되어 있습니다. 사주 계산
 * 자체는 양력과 절기만으로 돌아가므로 그 말이 맞습니다. 그런데 입력을
 * 받을 때는 사정이 다릅니다. 나이가 있는 분들은 생일을 음력으로 알고
 * 있고, 그대로 넣으면 한 달 가까이 어긋난 사주가 나옵니다.
 *
 * 그래서 변환은 입력 단계에서만 씁니다. 변환한 양력 날짜를 확인시킨 뒤
 * 그 값으로 사주를 계산하고, 원본 음력 정보는 queries에 따로 남깁니다.
 *
 * korean-lunar-calendar를 쓰는 이유는 한국천문연구원(KARI) 기준을 따르기
 * 때문입니다. 중국 음력과 날짜가 하루씩 어긋나는 경우가 있습니다.
 */

import KoreanLunarCalendar from 'korean-lunar-calendar'

export interface LunarInput {
  year: number
  month: number
  day: number
  /** 윤달 여부 */
  isLeapMonth: boolean
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * 음력 날짜를 양력 'YYYY-MM-DD'로 바꿉니다.
 *
 * 없는 날짜(윤달이 아닌 달에 윤달을 요청하거나, 29일까지인 달의 30일)면
 * null을 돌려줍니다. 라이브러리의 setLunarDate가 false를 주므로 그것을
 * 그대로 신뢰합니다.
 */
export function lunarToSolar(input: LunarInput): string | null {
  const cal = new KoreanLunarCalendar()
  if (!cal.setLunarDate(input.year, input.month, input.day, input.isLeapMonth)) {
    return null
  }
  const s = cal.getSolarCalendar()
  return `${s.year}-${pad(s.month)}-${pad(s.day)}`
}

/** 그 해 그 달에 윤달이 있는지 */
export function hasLeapMonth(year: number, month: number): boolean {
  const cal = new KoreanLunarCalendar()
  return cal.setLunarDate(year, month, 1, true)
}

/** 'YYYY-MM-DD' 음력 문자열을 만듭니다 (queries.lunar_date 저장용) */
export function formatLunarDate(input: LunarInput): string {
  return `${input.year}-${pad(input.month)}-${pad(input.day)}`
}
