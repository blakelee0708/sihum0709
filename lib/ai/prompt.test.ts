/**
 * 프롬프트가 실제로 무엇을 담고 나가는지 (PRD 8.3, 8.4, 8.13)
 *
 * 여기서 틀리면 실측을 아무리 돌려도 원인을 못 찾습니다. 특히 이스케이프는
 * 눈으로 안 보입니다. SYSTEM_PROMPT는 템플릿 리터럴이라 소스에 \n을 그대로
 * 쓰면 실제 개행이 되어, 모델은 "줄바꿈을 \n으로 쓰라"는 지시 대신
 * 줄바꿈 하나를 받습니다.
 */

import { describe, expect, it } from 'vitest'

import { buildMaterial, buildUserPrompt, SYSTEM_PROMPT } from './prompt'
import { getReportSpec } from './spec'
import { buildFreeResult, type UserInput } from '../content/assemble'

const INPUT: UserInput = {
  name: '김민준',
  examName: '국가직 9급 공무원',
  examCategory: '공무원',
  examType: '필기',
  examDate: '2026-10-15',
  startTime: '10:00',
  birthDate: '1998-03-15',
  birthTime: '14:30',
  hasBirthTime: true,
}

function written() {
  const spec = getReportSpec('필기', 'normal', 2026, { hasStartTime: true })
  const material = buildMaterial({ result: buildFreeResult(INPUT), spec })
  return { spec, prompt: buildUserPrompt(material, spec) }
}

describe('섹션 지시', () => {
  it('구성이 분량보다 먼저 나온다', () => {
    // 모델은 자기 출력의 글자 수를 셀 수 없습니다. 셀 수 있는 것을 먼저
    // 줘야 지시가 됩니다.
    const { prompt } = written()
    const first = prompt.indexOf('구성:')
    const second = prompt.indexOf('분량:')
    expect(first).toBeGreaterThan(-1)
    expect(second).toBeGreaterThan(first)
  })

  it('AI가 쓰는 모든 섹션에 구성이 붙는다', () => {
    const { spec, prompt } = written()
    const aiSections = spec.sections.filter((s) => s.source !== 'calc')

    for (const s of aiSections) {
      expect(s.structure, `${s.key}에 structure가 없습니다`).toBeTruthy()
      expect(prompt).toContain(`구성: ${s.structure}`)
    }
  })

  it('구성이 붙은 섹션 수와 분량이 붙은 섹션 수가 같다', () => {
    const { spec, prompt } = written()
    const count = (needle: string) => prompt.split(needle).length - 1
    const aiCount = spec.sections.filter((s) => s.source !== 'calc').length

    expect(count('구성:')).toBe(aiCount)
    expect(count('분량:')).toBe(aiCount)
  })

  it('brief에 글자 수를 적지 않는다', () => {
    // 구성 지시와 어긋나는 숫자를 함께 주면 숫자 전체가 무시됩니다.
    // 7일 플랜은 "하루당 150자" × 8일 = 1,200자인데 상한이 800자였습니다.
    for (const type of ['필기', '면접'] as const) {
      const spec = getReportSpec(type, 'normal', 2026, { hasStartTime: true })
      for (const s of spec.sections) {
        expect(s.brief ?? '', `${s.key}의 brief에 글자 수가 있습니다`).not.toMatch(
          /\d+\s*자/
        )
      }
    }
  })
})

describe('출력 형식 지시', () => {
  it('줄바꿈을 두 글자 이스케이프로 쓰라고 지시한다', () => {
    // 실측에서 4건 중 1건이 여기서 죽었습니다.
    // 아래 문자열은 백슬래시 한 개 + n 입니다. 실제 개행이면 안 됩니다.
    const escaped = String.raw`\n`
    expect(SYSTEM_PROMPT).toContain(`${escaped} 으로 이스케이프하십시오`)
    expect(SYSTEM_PROMPT).toContain(`"첫 문단입니다.${escaped}${escaped}둘째 문단입니다."`)
  })

  it('큰따옴표 이스케이프도 지시한다', () => {
    expect(SYSTEM_PROMPT).toContain(String.raw`\"` + ' 로 이스케이프합니다')
  })
})

describe('분량 규칙', () => {
  it('구성이 지시이고 분량은 참고선이라고 못 박는다', () => {
    expect(SYSTEM_PROMPT).toContain('구성이 지시이고 분량은 참고선입니다')
  })

  it('물타기를 금지한다', () => {
    // 구성을 강제하면 빈칸을 같은 말로 채울 위험이 생깁니다.
    expect(SYSTEM_PROMPT).toContain('물타기')
  })
})
