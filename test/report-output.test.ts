/**
 * 실제 AI 키로 리포트를 생성하고 실측값을 남깁니다 (PRD 8.3, 8.4, 8.13).
 *
 * 실행 (키가 .env.local에 있어야 합니다)
 *   RUN_REPORT_SAMPLE=1 npx vitest run test/report-output.test.ts
 *
 * 옵션
 *   ONLY=면접   한쪽만
 *   RUNS=2      방식마다 몇 번 돌릴지 (기본 2)
 *
 * 키가 없거나 플래그가 없으면 통째로 건너뜁니다. 실제 과금이 발생하고
 * 한 번에 여러 분이 걸리므로 기본 테스트에 섞지 않습니다.
 *
 * 결과는 test/report-output.md에 씁니다.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { runPipeline } from '../lib/ai/pipeline'
import { checkLength } from '../lib/ai/length'
import { getEffort, getMaxTokens } from '../lib/ai/provider'
import { SHIPSIN_KEYS } from '../lib/saju/shipsin'
import { BRANCHES } from '../lib/saju/constants'
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

const ENABLED =
  process.env.RUN_REPORT_SAMPLE === '1' && Boolean(process.env.ANTHROPIC_API_KEY)

/** 백만 토큰당 입력 $2 / 출력 $10, 환율 1,400원 (PRD 8.13) */
function won(inputTokens: number, outputTokens: number): number {
  const usd = (inputTokens * 2 + outputTokens * 10) / 1_000_000
  return Math.round(usd * 1400)
}

/** 지시받은 목표 소요 (초) */
const TIME_GOAL: Record<'필기' | '면접', number> = { 필기: 120, 면접: 160 }

/** 지시받은 원가 목표 (원) */
const COST_GOAL: Record<'필기' | '면접', number> = { 필기: 150, 면접: 220 }

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
  label: '필기' | '면접'
  run: number
  ok: boolean
  note: string
  inputTokens: number
  outputTokens: number
  /** 전체 소요 (초) */
  seconds: number
  /** 검색에 쓴 시간 (초). 필기는 0 */
  searchSeconds: number
  /** 실제로 쓴 사고량 단계 */
  effort: string
  /** 응답의 stop_reason. 잘림이면 실패로 던져지므로 note에 남습니다 */
  stopReason: string
  /** AI 생성에 쓴 시간 (초) */
  aiSeconds: number
  total: number
  target: number
  targetMax: number
  sections: {
    key: string
    title: string
    chars: number
    minChars: number
    maxChars: number
  }[]
  /** PRD 8.5 — 오행 수치가 없는 섹션 */
  sectionsWithoutNumber: string[]
  /** PRD 5.6 — 섹션 2에 언급된 십신 */
  shipsinInPattern: string[]
  /** PRD 8.6 — 섹션 4의 12지지 */
  branchesInTimeline: string[]
  /** 생성 본문. effort를 낮췄을 때 품질이 떨어지는지 눈으로 보려고 남깁니다 */
  body: Record<string, string>
}

/** 오행 이름 뒤에 숫자가 붙거나, 숫자 뒤에 점/개가 붙는 형태를 찾습니다 */
function hasElementNumber(text: string): boolean {
  return (
    /[목화토금수]\s*\(?[木火土金水]?\)?\s*(기운)?\s*(가|이|은|는)?\s*\d+/.test(text) ||
    /\d+\s*(점|개)/.test(text)
  )
}

async function measure(
  label: '필기' | '면접',
  run: number,
  userInput: UserInput,
  companyName: string | null
): Promise<Measured> {
  const started = Date.now()

  try {
    const out = await runPipeline({ userInput, companyName })
    const length = checkLength(out.generated.content, out.spec)
    const totalMs = Date.now() - started

    return {
      label,
      run,
      ok: true,
      note: out.generated.mock ? '목업' : '실제 호출',
      inputTokens: out.generated.inputTokens,
      outputTokens: out.generated.outputTokens,
      seconds: Math.round(totalMs / 100) / 10,
      searchSeconds: Math.round(out.searchMs / 100) / 10,
      effort: out.generated.effort ?? '-',
      stopReason: out.generated.stopReason ?? '-',
      aiSeconds: Math.round(out.generated.generationMs / 100) / 10,
      total: length.total,
      target: length.target,
      targetMax: length.targetMax,
      sections: out.spec.sections.map((s) => ({
        key: s.key,
        title: s.title,
        chars: length.sections[s.key] ?? 0,
        minChars: s.minChars,
        maxChars: s.maxChars,
      })),
      sectionsWithoutNumber: out.spec.sections
        .filter((s) => s.source !== 'calc')
        .filter((s) => !hasElementNumber(out.generated.content[s.key] ?? ''))
        .map((s) => s.title),
      shipsinInPattern: SHIPSIN_KEYS.filter((k) =>
        (out.generated.content.pattern ?? '').includes(k)
      ),
      branchesInTimeline: BRANCHES.filter((b) =>
        (out.generated.content.dayTimeline ?? '').includes(`${b}시`)
      ),
      body: out.generated.content,
    }
  } catch (e) {
    return {
      label,
      run,
      ok: false,
      note: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      inputTokens: 0,
      outputTokens: 0,
      seconds: Math.round((Date.now() - started) / 100) / 10,
      searchSeconds: 0,
      effort: getEffort(label),
      // 잘림이면 '출력 잘림'으로 던져집니다. note에 max_tokens 값이 남습니다
      stopReason: /출력 잘림|max_tokens/.test(
        e instanceof Error ? e.message : String(e)
      )
        ? 'max_tokens'
        : '-',
      aiSeconds: 0,
      total: 0,
      target: 0,
      targetMax: 0,
      sections: [],
      sectionsWithoutNumber: [],
      shipsinInPattern: [],
      branchesInTimeline: [],
      body: {},
    }
  }
}

/** 생성 본문 전문. 품질 판단은 표가 아니라 이걸 읽어서 합니다 */
function renderBodies(rows: Measured[]): string {
  const lines: string[] = ['# 리포트 생성 본문 (품질 확인용)', '']

  for (const r of rows) {
    lines.push(`## ${r.label} ${r.run}회차 · effort ${r.effort}`)
    lines.push('')
    if (!r.ok) {
      lines.push(`실패: ${r.note}`)
      lines.push('')
      continue
    }
    for (const s of r.sections) {
      const text = r.body[s.key]
      if (!text) continue
      lines.push(`### ${s.title} (${s.chars}자 / ${s.minChars}~${s.maxChars})`)
      lines.push('')
      lines.push(text)
      lines.push('')
    }
  }

  return lines.join('\n')
}

function render(rows: Measured[]): string {
  const lines: string[] = []

  lines.push('# 리포트 생성 실측')
  lines.push('')
  lines.push(
    `모델 \`${process.env.AI_MODEL ?? 'claude-sonnet-5'}\` · max_tokens ${getMaxTokens()} · ` +
      `effort 필기 \`${getEffort('필기')}\` / 면접 \`${getEffort('면접')}\``
  )
  lines.push('')
  lines.push('원가는 백만 토큰당 입력 $2 / 출력 $10, 환율 1,400원 기준입니다 (PRD 8.13).')
  lines.push('출력 토큰에는 adaptive thinking 분량이 포함됩니다.')
  lines.push('')
  lines.push(
    `목표는 필기 ${TIME_GOAL.필기}초 · ${COST_GOAL.필기}원, ` +
      `면접 ${TIME_GOAL.면접}초 · ${COST_GOAL.면접}원입니다. 분량은 섹션 범위 합계를 따릅니다.`
  )
  lines.push('')

  lines.push('## 요약')
  lines.push('')
  lines.push(
    '| 구분 | 회차 | effort | 결과 | 전체 | 검색 | AI | 입력 | 출력 | 본문 | 범위 | 원가 | stop_reason |'
  )
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const r of rows) {
    const inRange = r.total >= r.target && r.total <= r.targetMax ? 'O' : 'X'
    lines.push(
      `| ${r.label} | ${r.run} | ${r.effort} | ${r.ok ? '성공' : '실패'} | ${r.seconds}초 | ` +
        `${r.searchSeconds}초 | ${r.aiSeconds}초 | ${r.inputTokens.toLocaleString()} | ` +
        `${r.outputTokens.toLocaleString()} | ${r.total.toLocaleString()}자 | ` +
        `${inRange} | ${won(r.inputTokens, r.outputTokens)}원 | ${r.stopReason} |`
    )
  }
  lines.push('')

  // 목표 대비
  lines.push('## 목표 대비')
  lines.push('')
  lines.push('| 구분 | 소요 (목표) | 분량 (범위) | 원가 (목표) |')
  lines.push('|---|---|---|---|')
  for (const label of ['필기', '면접'] as const) {
    const mine = rows.filter((r) => r.label === label && r.ok)
    if (!mine.length) continue
    const avg = (f: (r: Measured) => number) =>
      Math.round((mine.reduce((a, r) => a + f(r), 0) / mine.length) * 10) / 10
    const sec = avg((r) => r.seconds)
    const chars = Math.round(avg((r) => r.total))
    const cost = Math.round(avg((r) => won(r.inputTokens, r.outputTokens)))
    lines.push(
      `| ${label} | ${sec}초 (${TIME_GOAL[label]}초) ${sec <= TIME_GOAL[label] ? 'O' : 'X'} | ` +
        `${chars.toLocaleString()}자 (${mine[0].target.toLocaleString()}~${mine[0].targetMax.toLocaleString()}) ` +
        `${chars >= mine[0].target && chars <= mine[0].targetMax ? 'O' : 'X'} | ` +
        `${cost}원 (${COST_GOAL[label]}원) ${cost <= COST_GOAL[label] ? 'O' : 'X'} |`
    )
  }
  lines.push('')

  for (const r of rows) {
    lines.push(`## ${r.label} ${r.run}회차`)
    lines.push('')
    lines.push(`- 상태: ${r.ok ? '성공' : '실패'} (${r.note})`)
    lines.push(`- effort: ${r.effort} · stop_reason: ${r.stopReason}`)
    lines.push(`- 소요: 전체 ${r.seconds}초 = 검색 ${r.searchSeconds}초 + AI ${r.aiSeconds}초`)
    lines.push(
      `- 오행 수치가 없는 섹션: ${
        r.sectionsWithoutNumber.length ? r.sectionsWithoutNumber.join(', ') : '없음'
      }`
    )
    lines.push(
      `- 섹션 2에 언급된 십신: ${
        r.shipsinInPattern.length ? r.shipsinInPattern.join(', ') : '없음'
      }`
    )
    lines.push(
      `- 섹션 4의 12지지: ${
        r.branchesInTimeline.length
          ? r.branchesInTimeline.map((b) => `${b}시`).join(', ')
          : '없음'
      }`
    )
    lines.push('')

    if (!r.sections.length) {
      lines.push('섹션 기록이 없습니다.')
      lines.push('')
      continue
    }

    lines.push('| # | 섹션 | 글자 수 | 범위 | 준수 |')
    lines.push('|---|---|---|---|---|')
    r.sections.forEach((s, i) => {
      const ok = s.chars >= s.minChars && s.chars <= s.maxChars
      const mark = ok ? 'O' : s.chars < s.minChars ? '미달' : '초과'
      lines.push(
        `| ${i + 1} | ${s.title} | ${s.chars} | ${s.minChars}~${s.maxChars} | ${mark} |`
      )
    })
    lines.push('')
  }

  return lines.join('\n')
}

describe.skipIf(!ENABLED)('리포트 생성 실측 (PRD 8.3, 8.4, 8.13)', () => {
  it(
    '필기와 면접을 각각 여러 번 생성하고 test/report-output.md에 기록한다',
    async () => {
      const only = process.env.ONLY
      const runs = Number(process.env.RUNS) || 2
      const rows: Measured[] = []

      for (let n = 1; n <= runs; n += 1) {
        if (!only || only === '필기') rows.push(await measure('필기', n, WRITTEN, null))
        if (!only || only === '면접') {
          rows.push(await measure('면접', n, INTERVIEW, '삼성전자'))
        }
      }

      const suffix = only ? `-${only}` : ''
      writeFileSync(
        join(process.cwd(), 'test', `report-output${suffix}.md`),
        render(rows),
        'utf-8'
      )
      writeFileSync(
        join(process.cwd(), 'test', `report-output-body${suffix}.md`),
        renderBodies(rows),
        'utf-8'
      )

      for (const r of rows) {
        // 잘리지 않았는지 / 하한의 70%를 넘는지
        expect(r.ok, `${r.label} ${r.run}회차: ${r.note}`).toBe(true)
        expect(r.total, `${r.label} ${r.run}회차 분량`).toBeGreaterThan(r.target * 0.7)

        // 모든 섹션에 오행 수치 언급 (PRD 8.5)
        expect(
          r.sectionsWithoutNumber,
          `${r.label} ${r.run}회차 오행 수치 없음`
        ).toHaveLength(0)

        // 섹션 2에 십신, 섹션 4에 12지지 (PRD 5.6, 8.6)
        expect(r.shipsinInPattern.length, `${r.label} ${r.run}회차 십신`).toBeGreaterThan(0)
        expect(
          r.branchesInTimeline.length,
          `${r.label} ${r.run}회차 12지지`
        ).toBeGreaterThan(0)
      }
    },
    30 * 60_000
  )
})
