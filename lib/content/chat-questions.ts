/**
 * 리포트 후 대화의 추천 질문 (FIX_4 [3]-3, [3]-4)
 *
 * 자유 입력만 두면 사용자가 무엇을 물을지 모르고, 질문이 흔들리면 답변
 * 품질도 같이 흔들립니다. 버튼을 기본으로 두고 자유 입력은 마지막에
 * 하나만 둡니다.
 *
 * "7일 플랜을 더 자세히"는 넣지 않습니다. 리포트와 겹치고 D-1 사용자에게는
 * 성립하지 않습니다.
 *
 * 목록과 문구는 확정된 것입니다. 임의로 고치지 마십시오.
 */

import type { ReportType } from '../ai/spec'
import { getReportDdayRange } from '../saju/fortune'

export interface ChatQuestion {
  id: string
  label: string
}

/** 직접 입력으로 넘어가는 항목. 항상 마지막입니다 */
export const FREE_INPUT_ID = 'free'
export const FREE_INPUT_LABEL = '직접 물어볼래요'

/** 직접 입력 길이 상한 (FIX_4 [3]-2). 편차를 줄이기 위함입니다 */
export const FREE_INPUT_MAX = 200

const WRITTEN: ChatQuestion[] = [
  { id: 'w1', label: '내 학습 유형을 더 자세히 알려줘' },
  { id: 'w2', label: '시험 당일 실수를 줄이려면' },
  { id: 'w3', label: '남은 기간 뭐부터 해야 할까?' },
  { id: 'w4', label: '결과 보고서 이외에 내가 더 주의해야 할 건?' },
  { id: 'w5', label: '다음 시험은 언제가 좋을까?' },
  { id: 'w6', label: '내 행운의 숫자, 색깔 더 추천해줄 게 있어?' },
]

const INTERVIEW: ChatQuestion[] = [
  { id: 'i1', label: '내 답변 유형을 더 자세히' },
  { id: 'i2', label: '이 기업과 궁합을 더 자세히' },
  { id: 'i3', label: '예상 질문에 어떻게 답할까' },
  { id: 'i4', label: '면접에서 조심할 점' },
  { id: 'i5', label: '다음 면접은 언제가 좋을까?' },
  { id: 'i6', label: '내 행운의 숫자, 색깔 더 추천해줄 게 있어?' },
]

/**
 * D-day 구간별 교체 (FIX_4 [3]-4).
 *
 * 필기 3번은 남은 기간이 얼마나 되는지에 따라 질문 자체가 달라집니다.
 * D-1에게 "남은 기간 뭐부터 해야 할까"는 성립하지 않습니다.
 * D-DAY에는 5번도 시험 이후로 바뀝니다.
 */
function applyDday(list: ChatQuestion[], dday: number): ChatQuestion[] {
  const range = getReportDdayRange(dday)

  return list.map((q) => {
    if (q.id === 'w3') {
      if (range === 'short') return { ...q, label: '지금 뭘 버려야 할까?' }
      if (range === 'eve') return { ...q, label: '오늘 밤 뭘 하면 좋을까?' }
      if (range === 'dday') return { ...q, label: '지금 당장 뭘 하면 좋을까?' }
      return q
    }
    if (q.id === 'w5' && range === 'dday') {
      return { ...q, label: '시험 끝나고 뭘 하면 좋을까?' }
    }
    return q
  })
}

/** 추천 질문 6개 + 직접 입력 1개 */
export function getChatQuestions(
  reportType: ReportType,
  dday: number
): ChatQuestion[] {
  const base = reportType === '면접' ? INTERVIEW : applyDday(WRITTEN, dday)
  return [...base, { id: FREE_INPUT_ID, label: FREE_INPUT_LABEL }]
}

/**
 * 아직 안 물어본 것만 (FIX_4 [3]-5).
 *
 * 답변 뒤에도 버튼을 계속 보여줍니다. 이미 물어본 항목은 빼고, 직접
 * 입력은 항상 남깁니다.
 */
export function remainingQuestions(
  all: ChatQuestion[],
  askedIds: string[]
): ChatQuestion[] {
  return all.filter((q) => q.id === FREE_INPUT_ID || !askedIds.includes(q.id))
}
