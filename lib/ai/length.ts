/**
 * 리포트 분량 검증 (PRD 8.3, 8.4)
 *
 * PRD 8.3의 목표는 5,000자인데 실측이 2,813-3,069자로 60%에 그쳤습니다.
 * 원인은 프롬프트가 분량을 문장 수로 지시한 것입니다. 모델은 "충분히 답했다"고
 * 판단하면 멈추고, 문장 수로만 묶어두면 짧은 문장으로 개수만 채웁니다.
 *
 * 그래서 두 군데에서 막습니다.
 *   1. 프롬프트 — 섹션마다 최소 글자 수를 명시 (spec.ts minChars)
 *   2. 여기 — 생성 결과를 세어 목표에 크게 못 미치면 실패 처리
 *
 * 이것은 원가 통제 장치이기도 합니다. 출력 원가를 정하는 것은 max_tokens가
 * 아니라 모델이 실제로 쓰는 분량이므로, 분량 기준이 곧 원가 기준입니다.
 */

import type { ReportSpec } from './spec'

/**
 * 목표 대비 이 비율에 못 미치면 실패로 봅니다.
 *
 * 1.0으로 두면 몇 자 모자란 리포트까지 버리게 되어 재생성 원가만 늘어납니다.
 * 눈에 띄게 부실한 것만 걸러내는 선입니다.
 */
export const LENGTH_TOLERANCE = 0.7

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

/**
 * 이 구성에서 AI가 써야 하는 글자 수 합계.
 *
 * 계산만 하는 섹션은 AI가 문장을 쓰지 않으므로 제외합니다.
 * 현재 구성에서는 명식과 캘린더도 짧은 해설이 붙어 calc+ai입니다.
 */
export function targetChars(spec: ReportSpec): number {
  return spec.sections
    .filter((s) => s.source !== 'calc')
    .reduce((a, s) => a + s.minChars, 0)
}

export interface LengthCheck {
  total: number
  target: number
  /** 목표 대비 비율 (1.0이면 목표 달성) */
  ratio: number
  ok: boolean
  sections: Record<string, number>
  /** 자기 최소 기준에 못 미친 섹션 */
  short: { key: string; chars: number; minChars: number }[]
}

export function checkLength(
  content: Record<string, string>,
  spec: ReportSpec
): LengthCheck {
  const sections = sectionChars(content)
  const total = totalChars(content)
  const target = targetChars(spec)

  const short = spec.sections
    .filter((s) => s.source !== 'calc')
    .map((s) => ({ key: s.key, chars: sections[s.key] ?? 0, minChars: s.minChars }))
    .filter((s) => s.chars < s.minChars)

  const ratio = target > 0 ? total / target : 1

  return { total, target, ratio, ok: ratio >= LENGTH_TOLERANCE, sections, short }
}
