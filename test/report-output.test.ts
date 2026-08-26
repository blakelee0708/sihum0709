/**
 * 실제 AI 키로 필기·면접 리포트를 각각 한 번씩 생성하고 실측값을 남깁니다.
 *
 * 실행 (키가 .env.local에 있어야 합니다)
 *   RUN_REPORT_SAMPLE=1 npx vitest run test/report-output.test.ts
 *
 * 키가 없거나 플래그가 없으면 통째로 건너뜁니다. 매번 돌리면 실제 과금이
 * 발생하고 한 번에 80초 넘게 걸리므로 기본 테스트에 섞지 않습니다.
 *
 * 결과는 test/report-output.md에 씁니다.
 * 분량, 소요 시간, 토큰 사용량, 섹션별 글자 수를 기록합니다.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { runPipeline } from '../lib/ai/pipeline'
import { checkLength } from '../lib/ai/length'
import { MAX_TOKENS } from '../lib/ai/provider'
import type { UserInput } from '../lib/content/assemble'

/**
 * vitest는 .env.local을 process.env에 넣어주지 않습니다.
 * 앱과 같은 값으로 재려면 여기서 직접 읽어야 합니다.
 */
function loadEnvLocal() {
  let text: string
  try {
    text = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
  } catch {
    return
  }

  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim()
  }
}

loadEnvLocal()

const ENABLED = process.env.RUN_REPORT_SAMPLE === '1' && Boolean(process.env.ANTHROPIC_API_KEY)

/** 백만 토큰당 입력 $2 / 출력 $10, 환율 1,400원 (PRD 8.12) */
function won(inputTokens: number, outputTokens: number): number {
  const usd = (inputTokens * 2 + outputTokens * 10) / 1_000_000
  return Math.round(usd * 1400)
}

const WRITTEN: UserInput = {
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

const INTERVIEW: UserInput = {
  name: '이서연',
  examName: '삼성전자 면접',
  examCategory: null,
  examType: '면접',
  examDate: '2026-10-08',
  startTime: '14:00',
  birthDate: '1999-07-22',
  birthTime: '09:10',
  hasBirthTime: true,
  companyScale: '대기업',
  workType: '분석하고만드는일',
  jobTitle: '반도체 공정기술',
}

interface Measured {
  label: string
  ok: boolean
  note: string
  ddayRange: string
  inputTokens: number
  outputTokens: number
  seconds: number
  total: number
  target: number
  sections: { key: string; title: string; chars: number; minChars: number }[]
}

async function measure(
  label: string,
  userInput: UserInput,
  companyName: string | null
): Promise<Measured> {
  const started = Date.now()

  try {
    const out = await runPipeline({ userInput, companyName })
    const length = checkLength(out.generated.content, out.spec)

    return {
      label,
      ok: true,
      note: out.generated.mock ? '목업' : '실제 호출',
      ddayRange: out.ddayRange,
      inputTokens: out.generated.inputTokens,
      outputTokens: out.generated.outputTokens,
      seconds: Math.round(out.generated.generationMs / 100) / 10,
      total: length.total,
      target: length.target,
      sections: out.spec.sections.map((s) => ({
        key: s.key,
        title: s.title,
        chars: length.sections[s.key] ?? 0,
        minChars: s.minChars,
      })),
    }
  } catch (e) {
    return {
      label,
      ok: false,
      note: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      ddayRange: '-',
      inputTokens: 0,
      outputTokens: 0,
      seconds: Math.round((Date.now() - started) / 100) / 10,
      total: 0,
      target: 0,
      sections: [],
    }
  }
}

function render(rows: Measured[]): string {
  const lines: string[] = []

  lines.push('# 리포트 생성 실측')
  lines.push('')
  lines.push(`모델 \`${process.env.AI_MODEL ?? 'claude-sonnet-5'}\` · max_tokens ${MAX_TOKENS}`)
  lines.push('')
  lines.push('원가는 백만 토큰당 입력 $2 / 출력 $10, 환율 1,400원 기준입니다 (PRD 8.12).')
  lines.push('출력 토큰에는 adaptive thinking 분량이 포함됩니다.')
  lines.push('')

  lines.push('## 요약')
  lines.push('')
  lines.push('| 구분 | 결과 | 입력 | 출력 | 소요 | 분량 | 목표 | 달성률 | 원가 |')
  lines.push('|---|---|---|---|---|---|---|---|---|')
  for (const r of rows) {
    const ratio = r.target > 0 ? Math.round((r.total / r.target) * 100) : 0
    lines.push(
      `| ${r.label} | ${r.ok ? '성공' : '실패'} | ${r.inputTokens.toLocaleString()} | ` +
        `${r.outputTokens.toLocaleString()} | ${r.seconds}초 | ${r.total.toLocaleString()}자 | ` +
        `${r.target.toLocaleString()}자 | ${ratio}% | ${won(r.inputTokens, r.outputTokens)}원 |`
    )
  }
  lines.push('')

  for (const r of rows) {
    lines.push(`## ${r.label}`)
    lines.push('')
    lines.push(`- 상태: ${r.ok ? '성공' : '실패'} (${r.note})`)
    lines.push(`- D-day 구간: ${r.ddayRange}`)
    lines.push('')

    if (!r.sections.length) {
      lines.push('섹션 기록이 없습니다.')
      lines.push('')
      continue
    }

    lines.push('| # | 섹션 | 글자 수 | 최소 | 충족 |')
    lines.push('|---|---|---|---|---|')
    r.sections.forEach((s, i) => {
      lines.push(
        `| ${i + 1} | ${s.title} | ${s.chars} | ${s.minChars} | ${s.chars >= s.minChars ? 'O' : 'X'} |`
      )
    })
    lines.push('')
  }

  return lines.join('\n')
}

describe.skipIf(!ENABLED)('리포트 생성 실측 (PRD 8.3, 8.4, 8.12)', () => {
  it(
    '필기와 면접을 각각 한 번 생성하고 test/report-output.md에 기록한다',
    async () => {
      const rows = [
        await measure('필기', WRITTEN, null),
        await measure('면접', INTERVIEW, '삼성전자'),
      ]

      writeFileSync(join(process.cwd(), 'test', 'report-output.md'), render(rows), 'utf-8')

      for (const r of rows) {
        // 잘리거나 분량이 모자라면 여기서 걸립니다
        expect(r.ok, `${r.label}: ${r.note}`).toBe(true)
        expect(r.total).toBeGreaterThan(4000)
      }
    },
    600_000
  )
})
