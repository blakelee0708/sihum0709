/**
 * 리포트 분량 검증 (PRD 8.3, 8.4)
 *
 * 두 번 어긋났습니다.
 *
 * 처음에는 프롬프트가 분량을 문장 수로 지시해 목표의 60%밖에 나오지
 * 않았습니다. 모델은 "충분히 답했다"고 판단하면 멈추고, 문장 수로만
 * 묶어두면 짧은 문장으로 개수만 채웁니다. 그래서 글자 수로 바꿨습니다.
 *
 * 그다음에는 하한만 두었더니 목표의 130%를 써서 소요 시간이 필기 217초,
 * 면접 308초까지 늘었습니다. 그래서 상한을 함께 둡니다.
 *
 * 지금은 세 군데에서 잡습니다.
 *   1. 프롬프트 — 섹션마다 분량 범위를 명시 (spec.ts minChars/maxChars)
 *   2. 여기 — 하한의 70%에 못 미치면 실패 처리
 *   3. 여기 — 상한의 150%를 넘으면 경고 로그 (실패로 돌리지는 않음)
 *
 * 이것은 원가 통제 장치이기도 합니다. 출력 원가를 정하는 것은 max_tokens가
 * 아니라 모델이 실제로 쓰는 분량이므로, 분량 기준이 곧 원가 기준입니다.
 */

import type { ReportSpec } from './spec'

/**
 * 하한 합계 대비 이 비율에 못 미치면 실패로 봅니다.
 *
 * 1.0으로 두면 몇 자 모자란 리포트까지 버리게 되어 재생성 원가만 늘어납니다.
 * 눈에 띄게 부실한 것만 걸러내는 선입니다.
 */
export const LENGTH_TOLERANCE = 0.7

/**
 * 상한 합계 대비 이 비율을 넘으면 경고를 남깁니다.
 *
 * 실패로 돌리지 않는 이유는, 넘쳤다고 버리면 이미 쓴 원가를 버리고 다시
 * 쓰게 되어 손해가 두 배가 되기 때문입니다. 사용자에게는 그대로 보여주고
 * 로그로 프롬프트를 조정할 신호만 남깁니다.
 */
export const LENGTH_OVER_TOLERANCE = 1.5

/** 공백을 포함해 셉니다. 사용자가 화면에서 보는 분량과 같은 기준입니다 */
export function countChars(text: string): number {
  return text.trim().length
}

/** 섹션 키 → 글자 수 */
export function sectionChars(content: Record<string, string>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(content)) out[k] = countChars(v)
  return out
}

export function totalChars(content: Record<string, string>): number {
  return Object.values(content).reduce((a, v) => a + countChars(v), 0)
}

/** AI가 문장을 쓰는 섹션만 셉니다. 계산만 하는 섹션은 제외합니다 */
function aiSections(spec: ReportSpec) {
  return spec.sections.filter((s) => s.source !== 'calc')
}

/** 이 구성에서 AI가 써야 하는 글자 수 하한 합계 */
export function targetChars(spec: ReportSpec): number {
  return aiSections(spec).reduce((a, s) => a + s.minChars, 0)
}

/** 이 구성의 글자 수 상한 합계 */
export function targetMaxChars(spec: ReportSpec): number {
  return aiSections(spec).reduce((a, s) => a + s.maxChars, 0)
}

export interface LengthCheck {
  total: number
  /** 하한 합계 */
  target: number
  /** 상한 합계 */
  targetMax: number
  /** 하한 합계 대비 비율 (1.0이면 하한 달성) */
  ratio: number
  /** 하한의 70%를 넘겼는지 */
  ok: boolean
  /** 상한의 150%를 넘겼는지 */
  over: boolean
  sections: Record<string, number>
  /** 자기 하한에 못 미친 섹션 */
  short: { key: string; chars: number; minChars: number }[]
  /** 자기 상한을 넘긴 섹션 */
  long: { key: string; chars: number; maxChars: number }[]
}

export function checkLength(
  content: Record<string, string>,
  spec: ReportSpec
): LengthCheck {
  const sections = sectionChars(content)
  const total = totalChars(content)
  const target = targetChars(spec)
  const targetMax = targetMaxChars(spec)

  const measured = aiSections(spec).map((s) => ({
    key: s.key,
    chars: sections[s.key] ?? 0,
    minChars: s.minChars,
    maxChars: s.maxChars,
  }))

  const short = measured
    .filter((s) => s.chars < s.minChars)
    .map(({ key, chars, minChars }) => ({ key, chars, minChars }))

  const long = measured
    .filter((s) => s.chars > s.maxChars)
    .map(({ key, chars, maxChars }) => ({ key, chars, maxChars }))

  const ratio = target > 0 ? total / target : 1

  return {
    total,
    target,
    targetMax,
    ratio,
    ok: ratio >= LENGTH_TOLERANCE,
    over: targetMax > 0 && total > targetMax * LENGTH_OVER_TOLERANCE,
    sections,
    short,
    long,
  }
}
