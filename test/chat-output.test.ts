/**
 * 실제 AI 키로 리포트 후 대화를 돌려 보고 겹침을 확인합니다 (FIX_4 [3], [7]).
 *
 * 실행 (키가 .env.local에 있어야 합니다)
 *   RUN_CHAT_SAMPLE=1 npx vitest run test/chat-output.test.ts
 *
 * 옵션
 *   REPORT_ID=<uuid>   특정 리포트로 (기본: 가장 최근 완료 건)
 *   TURNS=3            몇 턴을 돌릴지 (기본 3)
 *
 * 이 기능의 성패는 "리포트와 겹치지 않는가"입니다. 그래서 답변을 받아
 * 리포트 본문과 겹치는 구간을 기계적으로 찾아 함께 적습니다. 사람이
 * 최종 판단하되, 어디를 봐야 하는지는 기계가 짚어 줍니다.
 *
 * 키가 없거나 플래그가 없으면 통째로 건너뜁니다. 실제 과금이 발생합니다.
 * 결과는 test/chat-output.md에 씁니다.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { runChatTurn, type ChatMessage } from '../lib/ai/chat'
import { buildChatSystemPrompt } from '../lib/ai/chat-prompt'
import { buildReportText, type StoredReportContent } from '../lib/ai/report-text'
import { remainingRatio, turnCost, isExhausted } from '../lib/ai/chat-cost'
import { getChatQuestions } from '../lib/content/chat-questions'
import { buildFreeResult, type UserInput } from '../lib/content/assemble'
import type { CompanyScale, ExamType, WorkType } from '../lib/saju/constants'

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
  process.env.RUN_CHAT_SAMPLE === '1' && Boolean(process.env.ANTHROPIC_API_KEY)

const TURNS = Number(process.env.TURNS) || 3

/** service_role로 직접 읽습니다. 라우트를 거치지 않고 재료만 봅니다 */
async function rest<T>(path: string): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key ?? '', Authorization: `Bearer ${key ?? ''}` },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return (await res.json()) as T
}

/**
 * 답변에서 리포트와 그대로 겹치는 구간을 찾습니다.
 *
 * 16자 이상 연속으로 같으면 "같은 문장을 옮겨 썼다"로 봅니다.
 *
 * 처음에는 12자로 뒀는데 계산값을 말하는 대목이 걸렸습니다.
 * "인성이 2점이지만 천간과 지지"처럼 사실을 그대로 말하는 구간은 같은
 * 사주를 설명하는 이상 겹칠 수밖에 없고, 이것을 피하려고 숫자를 돌려
 * 말하면 오히려 나빠집니다. 문제는 사실이 겹치는 것이 아니라 같은 해석과
 * 같은 조언을 다시 하는 것이므로 기준을 올렸습니다.
 */
function findOverlaps(answer: string, report: string, min = 16): string[] {
  const clean = (s: string) => s.replace(/\s+/g, '')
  const a = clean(answer)
  const r = clean(report)

  const hits: string[] = []
  for (let i = 0; i + min <= a.length; i += 1) {
    let len = min
    while (i + len <= a.length && r.includes(a.slice(i, i + len))) len += 1
    if (len > min) {
      hits.push(a.slice(i, i + len - 1))
      i += len - min
    }
  }
  return hits
}

describe.skipIf(!ENABLED)('리포트 후 대화 실측', () => {
  it(
    '겹치지 않는 답변이 나온다',
    async () => {
      const reportId = process.env.REPORT_ID

      const reports = await rest<
        {
          id: string
          query_id: string
          report_type: string
          content: StoredReportContent
        }[]
      >(
        reportId
          ? `reports?select=id,query_id,report_type,content&id=eq.${reportId}`
          : 'reports?select=id,query_id,report_type,content&status=eq.completed&order=created_at.desc&limit=1'
      )

      expect(reports.length).toBeGreaterThan(0)
      const report = reports[0]

      const queries = await rest<Record<string, string | boolean | null>[]>(
        `queries?select=*&id=eq.${report.query_id}`
      )
      const q = queries[0]

      const userInput: UserInput = {
        name: (q.name as string) ?? null,
        examName: q.exam_name as string,
        examCategory: (q.exam_category as string) ?? null,
        examType: q.exam_type as ExamType,
        examDate: q.exam_date as string,
        startTime: (q.exam_start_time as string) ?? null,
        birthDate: q.birth_date as string,
        birthTime: (q.birth_time as string) ?? null,
        hasBirthTime: Boolean(q.has_birth_time),
        companyScale: (q.company_scale as CompanyScale) ?? null,
        workType: (q.work_type as WorkType) ?? null,
        jobTitle: (q.job_title as string) ?? null,
      }

      const free = buildFreeResult(userInput)
      const reportType = report.report_type === '면접' ? '면접' : '필기'
      const reportText = buildReportText(report.content, userInput.name ?? null)

      const system = buildChatSystemPrompt({
        reportType,
        reportText,
        free,
        name: userInput.name ?? null,
        examName: userInput.examName,
        dday: free.dday,
      })

      const questions = getChatQuestions(reportType, free.dday).filter(
        (x) => x.id !== 'free'
      )

      const lines: string[] = [
        '# 리포트 후 대화 실측',
        '',
        `리포트 ${report.id} · ${reportType} · D-${free.dday}`,
        `리포트 본문 ${reportText.length}자 · 시스템 프롬프트 ${system.length}자`,
        '',
      ]

      const problems: string[] = []
      const history: ChatMessage[] = []
      let totalCost = 0
      let turnCount = 0

      for (let i = 0; i < TURNS; i += 1) {
        const question = questions[i % questions.length]
        history.push({ role: 'user', content: question.label })

        const turn = await runChatTurn(system, history)
        history.push({ role: 'assistant', content: turn.text })

        totalCost += turnCost(turn.inputTokens, turn.outputTokens)
        turnCount += 1

        const overlaps = findOverlaps(turn.text, reportText)

        lines.push(
          `## ${i + 1}턴 — ${question.label}`,
          '',
          turn.text,
          '',
          `입력 ${turn.inputTokens} · 출력 ${turn.outputTokens} · 이 턴 ${turnCost(turn.inputTokens, turn.outputTokens).toFixed(1)}원`,
          `누적 ${totalCost.toFixed(1)}원 · 게이지 ${(remainingRatio({ totalCost, turnCount }) * 100).toFixed(0)}% · 소진 ${isExhausted({ totalCost, turnCount })}`,
          `겹치는 구간 ${overlaps.length}개${overlaps.length ? `: ${overlaps.join(' / ')}` : ''}`,
          `문장 수 ${turn.text.split(/[.!?]\s|다\.\s/).filter(Boolean).length} · 길이 ${turn.text.length}자`,
          '',
        )

        problems.push(
          ...overlaps.map((o) => `${i + 1}턴 겹침: ${o}`),
          // 리포트를 가리키며 시작하면 "아까 그 이야기"로 읽힙니다.
          // 리포트를 아예 언급하지 못하게 막지는 않습니다. "리포트 말고
          // 더 주의할 것"을 묻는 질문에는 무엇을 빼고 말하는지 밝히는 편이
          // 낫습니다
          ...(/^리포트에\s|^리포트에서 말씀|^리포트에서 말한|^리포트에서 드린/.test(
            turn.text
          )
            ? [`${i + 1}턴: 리포트를 가리키며 시작`]
            : []),
          ...(/합격하실|반드시 붙|확률은/.test(turn.text)
            ? [`${i + 1}턴: 결과 단정 표현`]
            : [])
        )
      }

      // 먼저 기록하고 나서 판정합니다. 실패했을 때 무엇이 나왔는지 봐야
      // 프롬프트를 조일 수 있습니다
      writeFileSync(join(process.cwd(), 'test', 'chat-output.md'), lines.join('\n'))
      expect(problems).toEqual([])
    },
    600_000
  )
})
