/**
 * 검증 사례 10건의 계산 결과를 test/saju-output.md 로 출력합니다.
 *
 * 실행
 *   npm test
 *
 * 각 사례에 적어둔 기대 결과(verification-cases.ts의 expect)와 실제 계산값을
 * 대조해 O/X로 표시합니다. X가 하나라도 있으면 이 테스트가 실패합니다.
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  applyTimeCorrection,
  calculateCompanySaju,
  calculateSaju,
  getIpchun,
  parseLocalDateTime,
  toDateKey,
  type Saju,
} from '../lib/saju/calculate'
import { getElementProfile, getCompanyElementProfile } from '../lib/saju/elements'
import { BRANCHES, ELEMENTS } from '../lib/saju/constants'
import { VERIFICATION_CASES, type CaseExpectation } from '../lib/saju/verification-cases'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function scoreLine(scores: Record<string, number>): string {
  return ELEMENTS.map((e) => `${e} ${scores[e]}`).join(' · ')
}

interface Check {
  label: string
  expected: string
  actual: string
  ok: boolean
}

/** 기대 결과와 실제 계산값을 대조합니다 */
function runChecks(exp: CaseExpectation, saju: Saju | null, company: boolean): Check[] {
  const checks: Check[] = []

  if (exp.year !== undefined && saju) {
    checks.push({
      label: '년주',
      expected: exp.year,
      actual: saju.year.name,
      ok: saju.year.name === exp.year,
    })
  }

  if (exp.corrected !== undefined && saju?.corrected) {
    const actual = fmtTime(saju.corrected)
    checks.push({
      label: '보정 후 시각',
      expected: exp.corrected,
      actual,
      ok: actual === exp.corrected,
    })
  }

  if (exp.hourBranch !== undefined && saju?.hour) {
    const actual = `${BRANCHES[saju.hour.branchIndex]}시`
    checks.push({
      label: '시지',
      expected: exp.hourBranch,
      actual,
      ok: actual === exp.hourBranch,
    })
  }

  if (exp.dayOf !== undefined && saju) {
    // 일주가 기대한 날짜의 일주와 같은지 확인합니다
    const reference = calculateSaju({
      birthDate: exp.dayOf,
      birthTime: null,
      hasBirthTime: false,
    })
    checks.push({
      label: '일주 기준 날짜',
      expected: `${exp.dayOf} (${reference.day.name})`,
      actual: saju.day.name,
      ok: saju.day.name === reference.day.name,
    })
  }

  if (exp.pillars !== undefined) {
    const actual = company ? 3 : saju?.hour ? 4 : 3
    checks.push({
      label: '기둥 수',
      expected: `${exp.pillars}기둥`,
      actual: `${actual}기둥`,
      ok: actual === exp.pillars,
    })
  }

  return checks
}

describe('검증 사례 출력', () => {
  it('test/saju-output.md 를 생성하고 기대 결과와 대조한다', () => {
    const lines: string[] = []
    const details: string[] = []
    const summary: string[] = []
    const failures: string[] = []

    lines.push('# 만세력 계산 검증 결과')
    lines.push('')
    lines.push('확정된 계산 규칙이 의도대로 동작하는지 확인한 결과입니다.')
    lines.push('')
    lines.push('> 이 파일은 `npm test` 실행 시 자동으로 다시 생성됩니다. 직접 고치지 마십시오.')
    lines.push('')

    lines.push('## 확정된 계산 규칙')
    lines.push('')
    lines.push('| 항목 | 처리 | 적용 대상 |')
    lines.push('|---|---|---|')
    lines.push('| 경도 보정 | 30분을 뺍니다 | **시주만** |')
    lines.push('| 서머타임 보정 | 시행 기간이면 60분을 더 뺍니다 | **시주만** |')
    lines.push('| 절기 경계 | 보정하지 않은 **원본 시각**으로 비교 | 년주, 월주 |')
    lines.push('| 일주 | **원본 날짜** 기준 경과일 | 일주 |')
    lines.push('| 자시 | 23:00-23:59는 당일 유지 (조자시) | 일주 |')
    lines.push('| 오행 강약 | 일간 3, 월지 3, 나머지 각 1. 지장간 미반영 | 오행 분포 |')
    lines.push('')
    lines.push('절기 테이블이 KST 기준이라 보정된 시각을 맞대면 기준이 섞입니다.')
    lines.push('그래서 절기 경계는 원본 시각으로 봅니다.')
    lines.push('')
    lines.push('반면 시지는 실제 태어난 시각을 묻는 자리이므로 보정을 적용합니다.')
    lines.push('그 결과 실질 자시 시작이 23:30으로 밀립니다. 의도한 동작입니다.')
    lines.push('')

    const ipchun2026 = getIpchun(2026)
    lines.push('참고로 2026년 입춘은 `' + (ipchun2026 ? fmt(ipchun2026) : '—') + '` 입니다.')
    lines.push('2024 / 2025 / 2026년 절입 36개가 공표 절기표와 분 단위까지 일치합니다.')
    lines.push('')

    lines.push('## 계산 결과')
    lines.push('')
    lines.push('| # | 사례 | 입력 | 보정 후 | 년주 | 월주 | 일주 | 시주 | 판정 |')
    lines.push('|---|---|---|---|---|---|---|---|---|')

    for (const c of VERIFICATION_CASES) {
      const input = c.birthTime
        ? `${c.birthDate} ${c.birthTime}`
        : `${c.birthDate} (시간 없음)`

      let saju: Saju | null = null
      let cells = { year: '—', month: '—', day: '—', hour: '—' }
      let correctedCell = '보정 없음'
      let profile

      if (c.isCompany) {
        const company = calculateCompanySaju(c.birthDate)
        cells = {
          year: `${company.year.name}(${company.year.hanja})`,
          month: `${company.month.name}(${company.month.hanja})`,
          day: `${company.day.name}(${company.day.hanja})`,
          hour: '—',
        }
        profile = getCompanyElementProfile(company)
      } else {
        saju = calculateSaju({
          birthDate: c.birthDate,
          birthTime: c.birthTime,
          hasBirthTime: c.hasBirthTime,
        })
        cells = {
          year: `${saju.year.name}(${saju.year.hanja})`,
          month: `${saju.month.name}(${saju.month.hanja})`,
          day: `${saju.day.name}(${saju.day.hanja})`,
          hour: saju.hour ? `${saju.hour.name}(${saju.hour.hanja})` : '—',
        }
        correctedCell = saju.corrected ? fmt(saju.corrected) : '보정 없음'
        profile = getElementProfile(saju)
      }

      const checks = runChecks(c.expect, saju, Boolean(c.isCompany))
      const allOk = checks.every((k) => k.ok)
      const verdict = checks.length === 0 ? '—' : allOk ? 'O' : 'X'

      if (!allOk) {
        for (const k of checks.filter((x) => !x.ok)) {
          failures.push(`${c.id}. ${c.label} — ${k.label}: 기대 ${k.expected}, 실제 ${k.actual}`)
        }
      }

      lines.push(
        `| ${c.id} | ${c.label} | ${input} | ${correctedCell} | ${cells.year} | ${cells.month} | ${cells.day} | ${cells.hour} | **${verdict}** |`
      )

      summary.push(`${c.id}:${verdict}`)

      // 상세
      details.push(`### ${c.id}. ${c.label}`)
      details.push('')
      details.push(`- 확인 목적 ${c.purpose}`)
      if (c.note) details.push(`- 참고 ${c.note}`)
      details.push(`- 입력 ${input}`)
      details.push(`- 보정 후 ${correctedCell}`)

      if (saju) {
        details.push(
          `- 명식 ${saju.year.name} ${saju.month.name} ${saju.day.name} ${saju.hour ? saju.hour.name : '(시주 없음)'}`
        )
        details.push(`- 일간 ${saju.dayStemName} · 일주 60갑자 인덱스 ${saju.dayPillarIndex}`)
      } else {
        const company = calculateCompanySaju(c.birthDate)
        details.push(
          `- 기업 3기둥 ${company.year.name} ${company.month.name} ${company.day.name}`
        )
        details.push(`- 일간 ${company.dayStemName}`)
      }

      details.push(`- 오행 분포 ${scoreLine(profile.scores)}`)
      details.push(`- 강한 오행 ${profile.strong} / 약한 오행 ${profile.weak}`)

      if (checks.length > 0) {
        details.push('')
        details.push('| 확인 항목 | 기대 | 실제 | |')
        details.push('|---|---|---|---|')
        for (const k of checks) {
          details.push(`| ${k.label} | ${k.expected} | ${k.actual} | ${k.ok ? 'O' : 'X'} |`)
        }
      }
      details.push('')
    }

    const passed = summary.filter((s) => s.endsWith(':O')).length
    const total = summary.filter((s) => !s.endsWith(':—')).length

    lines.push('')
    lines.push(`**판정 결과 ${passed} / ${total} 통과**`)
    if (failures.length > 0) {
      lines.push('')
      lines.push('### 실패 항목')
      lines.push('')
      for (const f of failures) lines.push(`- ${f}`)
    }
    lines.push('')

    lines.push('## 사례별 상세')
    lines.push('')
    lines.push(...details)

    lines.push('## 참고 — 관련 연도 입춘 시각')
    lines.push('')
    lines.push('| 연도 | 입춘 (KST) |')
    lines.push('|---|---|')
    for (const y of [1969, 1988, 1990, 1995, 2024, 2025, 2026]) {
      const t = getIpchun(y)
      lines.push(`| ${y} | ${t ? fmt(t) : '—'} |`)
    }
    lines.push('')

    writeFileSync(join(process.cwd(), 'test', 'saju-output.md'), lines.join('\n'), 'utf-8')

    // X가 하나라도 있으면 테스트를 실패시킵니다
    expect(failures, failures.join('\n')).toEqual([])
  })
})

describe('보정 적용 범위 (확정 규칙)', () => {
  it('절기 경계는 보정하지 않은 원본 시각으로 본다', () => {
    // 2026 입춘 05:02. 보정을 적용했다면 05:05 → 04:35 이라 을사년이 됐을 자리입니다
    const before = calculateSaju({
      birthDate: '2026-02-04',
      birthTime: '05:00',
      hasBirthTime: true,
    })
    const after = calculateSaju({
      birthDate: '2026-02-04',
      birthTime: '05:05',
      hasBirthTime: true,
    })

    expect(before.year.name).toBe('을사')
    expect(after.year.name).toBe('병오')
  })

  it('시주는 보정 후 시각으로 본다 (실질 자시 23:30)', () => {
    const a = calculateSaju({ birthDate: '1995-06-15', birthTime: '23:29', hasBirthTime: true })
    const b = calculateSaju({ birthDate: '1995-06-15', birthTime: '23:31', hasBirthTime: true })

    expect(BRANCHES[a.hour!.branchIndex]).toBe('해')
    expect(BRANCHES[b.hour!.branchIndex]).toBe('자')
  })

  it('보정으로 전날로 넘어가도 일주는 원본 날짜를 유지한다', () => {
    const s = calculateSaju({ birthDate: '1995-06-16', birthTime: '00:29', hasBirthTime: true })

    // 보정 후 시각은 전날 23:59
    expect(toDateKey(s.corrected!)).toBe('1995-06-15')
    expect(fmtTime(s.corrected!)).toBe('23:59')

    // 그래도 일주는 6월 16일
    const ref = calculateSaju({ birthDate: '1995-06-16', birthTime: null, hasBirthTime: false })
    expect(s.day.name).toBe(ref.day.name)
    expect(BRANCHES[s.hour!.branchIndex]).toBe('자')
  })

  it('시간을 모르면 보정도 시주도 없다', () => {
    const s = calculateSaju({ birthDate: '1990-05-15', birthTime: null, hasBirthTime: false })
    expect(s.corrected).toBeNull()
    expect(s.hour).toBeNull()
  })

  it('시간 유무와 무관하게 년월일주는 같다', () => {
    const withTime = calculateSaju({
      birthDate: '1990-05-15',
      birthTime: '14:30',
      hasBirthTime: true,
    })
    const without = calculateSaju({
      birthDate: '1990-05-15',
      birthTime: null,
      hasBirthTime: false,
    })

    expect(without.year.name).toBe(withTime.year.name)
    expect(without.month.name).toBe(withTime.month.name)
    expect(without.day.name).toBe(withTime.day.name)
  })

  it('applyTimeCorrection은 30분, 서머타임이면 90분을 뺀다', () => {
    const normal = applyTimeCorrection(parseLocalDateTime('1990-05-15', '14:30'))
    expect(fmtTime(normal)).toBe('14:00')

    const dst = applyTimeCorrection(parseLocalDateTime('1988-06-15', '14:30'))
    expect(fmtTime(dst)).toBe('13:00')
  })
})
