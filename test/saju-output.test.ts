/**
 * PRD 17장 검증 사례 10건의 계산 결과를 test/saju-output.md 로 출력합니다.
 *
 * 실행
 *   npm test
 *
 * 출력된 표를 다른 만세력 서비스와 대조한 뒤,
 * lib/saju/calculate.test.ts 의 EXPECTED 표에 정답을 채워 넣으시면 됩니다.
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  adjustBirthTime,
  calculateCompanySaju,
  calculateSaju,
  getIpchun,
  parseLocalDateTime,
  type Saju,
} from '../lib/saju/calculate'
import { getElementProfile, getCompanyElementProfile } from '../lib/saju/elements'
import { ELEMENTS } from '../lib/saju/constants'
import { VERIFICATION_CASES } from '../lib/saju/verification-cases'

function fmt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function scoreLine(scores: Record<string, number>): string {
  return ELEMENTS.map((e) => `${e} ${scores[e]}`).join(' · ')
}

function pillarCell(saju: Saju) {
  return {
    year: `${saju.year.name}(${saju.year.hanja})`,
    month: `${saju.month.name}(${saju.month.hanja})`,
    day: `${saju.day.name}(${saju.day.hanja})`,
    hour: saju.hour ? `${saju.hour.name}(${saju.hour.hanja})` : '—',
  }
}

describe('검증 사례 출력', () => {
  it('test/saju-output.md 를 생성한다', () => {
    const lines: string[] = []

    lines.push('# 만세력 계산 검증 결과')
    lines.push('')
    lines.push('PRD 17장이 지정한 검증 사례 10건의 계산 결과입니다.')
    lines.push('')
    lines.push('다른 만세력 서비스에 같은 생년월일시를 넣어 아래 표와 대조해 주십시오.')
    lines.push('대조가 끝나면 `lib/saju/calculate.test.ts` 의 `EXPECTED` 표에 정답을')
    lines.push('채워 넣으시면 테스트가 실제 검증으로 바뀝니다.')
    lines.push('')
    lines.push('> 이 파일은 `npm test` 실행 시 자동으로 다시 생성됩니다. 직접 고치지 마십시오.')
    lines.push('')

    // 대조 시 알아야 할 계산 기준
    lines.push('## 이 서비스의 계산 기준')
    lines.push('')
    lines.push('다른 만세력과 값이 다르면 대개 아래 세 가지 중 하나 때문입니다.')
    lines.push('')
    lines.push('| 항목 | 이 서비스의 처리 | PRD 근거 |')
    lines.push('|---|---|---|')
    lines.push('| 경도 보정 | 출생 시각에서 **30분**을 뺍니다 | 4.2 0단계 |')
    lines.push('| 서머타임 | 시행 기간이면 **추가 60분**을 뺍니다 | 4.2 0단계 |')
    lines.push('| 자시 | 23:00-23:59는 **당일 유지**(조자시) | 4.3.1 |')
    lines.push('| 입춘 경계 | **보정 후 시각**으로 비교합니다 | 4.2 (0단계 → 1단계 순서) |')
    lines.push('| 절기 시각 | skyfield + DE421로 계산한 KST 분 단위 | 4.1.1 |')
    lines.push('')

    const ipchun2026 = getIpchun(2026)
    lines.push('### 확인이 필요한 지점')
    lines.push('')
    lines.push('PRD 4.1.1의 예시 JSON은 2026년 입춘을 `2026-02-04 05:46`으로 적고 있으나,')
    lines.push(
      `skyfield로 계산한 실제 값은 \`${ipchun2026 ? fmt(ipchun2026) : '—'}\` 입니다.`
    )
    lines.push('')
    lines.push('생성한 테이블은 2024년 입춘 17:27, 2025년 입춘 2월 3일 23:10 등')
    lines.push('공표된 만세력 값과 일치하므로 계산 쪽이 맞다고 보고 진행했습니다.')
    lines.push('PRD 예시는 형식 설명용 숫자로 판단했습니다.')
    lines.push('')
    lines.push('이 때문에 PRD가 지정한 "입춘 당일 05:45 / 05:47" 사례(2, 3번)는')
    lines.push('둘 다 같은 년주가 나옵니다. 실제 경계를 확인하실 수 있도록')
    lines.push('보정 후 입춘을 사이에 두는 4, 5번 사례를 따로 넣었습니다.')
    lines.push('')

    // 본 표
    lines.push('## 계산 결과')
    lines.push('')
    lines.push('| # | 사례 | 입력 | 보정 후 | 년주 | 월주 | 일주 | 시주 |')
    lines.push('|---|---|---|---|---|---|---|---|')

    const details: string[] = []

    for (const c of VERIFICATION_CASES) {
      const input = c.birthTime ? `${c.birthDate} ${c.birthTime}` : `${c.birthDate} (시간 없음)`

      if (c.isCompany) {
        const company = calculateCompanySaju(c.birthDate)
        lines.push(
          `| ${c.id} | ${c.label} | ${input} | 보정 없음 | ${company.year.name}(${company.year.hanja}) | ${company.month.name}(${company.month.hanja}) | ${company.day.name}(${company.day.hanja}) | — |`
        )

        const profile = getCompanyElementProfile(company)
        details.push(`### ${c.id}. ${c.label}`)
        details.push('')
        details.push(`- 확인 목적 ${c.purpose}`)
        if (c.note) details.push(`- 참고 ${c.note}`)
        details.push(`- 기업 3기둥 ${company.year.name} ${company.month.name} ${company.day.name}`)
        details.push(`- 일간 ${company.dayStemName}`)
        details.push(`- 오행 분포 ${scoreLine(profile.scores)}`)
        details.push(`- 강한 오행 ${profile.strong} / 약한 오행 ${profile.weak}`)
        details.push('')
        continue
      }

      const saju = calculateSaju({
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        hasBirthTime: c.hasBirthTime,
      })
      const p = pillarCell(saju)
      const raw = parseLocalDateTime(c.birthDate, c.birthTime)
      const adjusted = c.hasBirthTime ? fmt(adjustBirthTime(raw, true)) : '보정 없음'

      lines.push(
        `| ${c.id} | ${c.label} | ${input} | ${adjusted} | ${p.year} | ${p.month} | ${p.day} | ${p.hour} |`
      )

      const profile = getElementProfile(saju)
      details.push(`### ${c.id}. ${c.label}`)
      details.push('')
      details.push(`- 확인 목적 ${c.purpose}`)
      if (c.note) details.push(`- 참고 ${c.note}`)
      details.push(`- 입력 ${input}`)
      details.push(`- 보정 후 ${adjusted}`)
      details.push(
        `- 명식 ${saju.year.name} ${saju.month.name} ${saju.day.name} ${saju.hour ? saju.hour.name : '(시주 없음)'}`
      )
      details.push(`- 일간 ${saju.dayStemName} · 일주 60갑자 인덱스 ${saju.dayPillarIndex}`)
      details.push(`- 오행 분포 ${scoreLine(profile.scores)}`)
      details.push(`- 강한 오행 ${profile.strong} / 약한 오행 ${profile.weak}`)
      details.push('')
    }

    lines.push('')
    lines.push('## 사례별 상세')
    lines.push('')
    lines.push(...details)

    // 참고: 절기 테이블 발췌
    lines.push('## 참고 — 관련 연도 입춘 시각')
    lines.push('')
    lines.push('| 연도 | 입춘 (KST) |')
    lines.push('|---|---|')
    for (const y of [1969, 1988, 1990, 1995, 2024, 2025, 2026]) {
      const t = getIpchun(y)
      lines.push(`| ${y} | ${t ? fmt(t) : '—'} |`)
    }
    lines.push('')

    const outPath = join(process.cwd(), 'test', 'saju-output.md')
    writeFileSync(outPath, lines.join('\n'), 'utf-8')

    expect(lines.length).toBeGreaterThan(30)
  })
})
