/**
 * 리포트 후 대화 (FIX_4 [3])
 *
 * 유료 리포트를 읽은 뒤 합격이와 이어서 이야기합니다. 3,900원에 포함되며
 * 별도 결제가 없습니다.
 *
 * ── 원가는 서버만 셉니다 ──
 *
 * 누적 원가로 제한하므로(FIX_4 [3]-2) 그 값을 클라이언트가 만지면 상한이
 * 상한이 아닙니다. conversations 테이블은 사용자에게 select만 열려 있고,
 * 쓰기는 이 라우트가 service_role로만 합니다.
 *
 * ── 리포트와 겹치지 않게 ──
 *
 * 시스템 프롬프트에 리포트 전문과 대화 전용 계산 재료가 함께 들어갑니다
 * (lib/ai/chat-prompt.ts). 금지 규칙만으로는 같은 말을 다른 표현으로 씁니다.
 */

import { NextResponse, type NextRequest } from 'next/server'

/** 답변이 3~5문장이라 오래 걸리지 않습니다. 상한만 둡니다 */
export const maxDuration = 60

import { runChatTurn, type ChatMessage } from '@/lib/ai/chat'
import { buildChatSystemPrompt } from '@/lib/ai/chat-prompt'
import { buildReportText, type StoredReportContent } from '@/lib/ai/report-text'
import {
  isExhausted,
  remainingRatio,
  turnCost,
  type ChatState,
} from '@/lib/ai/chat-cost'
import { GenerateError } from '@/lib/ai/provider'
import {
  FREE_INPUT_ID,
  FREE_INPUT_MAX,
  getChatQuestions,
} from '@/lib/content/chat-questions'
import { buildFreeResult, type ExamPeriod, type UserInput } from '@/lib/content/assemble'
import type { CompanyScale, ExamType, WorkType } from '@/lib/saju/constants'
import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

/** 저장되는 메시지. 어떤 버튼으로 물었는지도 남겨 버튼 재표시에 씁니다 */
interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
  questionId?: string
}

interface ConversationRow {
  id: string
  messages: StoredMessage[] | null
  total_cost: number | null
  turn_count: number | null
}

interface ReportRow {
  id: string
  user_id: string
  query_id: string
  report_type: string
  status: string | null
  content: StoredReportContent | null
}

interface QueryRow {
  exam_name: string
  exam_category: string | null
  exam_type: string
  exam_period: string | null
  exam_date: string
  exam_start_time: string | null
  birth_date: string
  birth_time: string | null
  has_birth_time: boolean
  name: string | null
  company_scale: string | null
  work_type: string | null
  job_title: string | null
}

const QUERY_COLUMNS =
  'exam_name, exam_category, exam_type, exam_period, exam_date, exam_start_time, birth_date, birth_time, has_birth_time, name, company_scale, work_type, job_title'

function toUserInput(query: QueryRow): UserInput {
  return {
    name: query.name,
    examName: query.exam_name,
    examCategory: query.exam_category,
    examType: query.exam_type as ExamType,
    examPeriod: query.exam_period as ExamPeriod | null,
    examDate: query.exam_date,
    startTime: query.exam_start_time,
    birthDate: query.birth_date,
    birthTime: query.birth_time,
    hasBirthTime: query.has_birth_time,
    companyScale: query.company_scale as CompanyScale | null,
    workType: query.work_type as WorkType | null,
    jobTitle: query.job_title,
  }
}

function stateOf(row: ConversationRow | null): ChatState {
  return {
    totalCost: Number(row?.total_cost ?? 0),
    turnCount: row?.turn_count ?? 0,
  }
}

function askedFrom(messages: StoredMessage[]): string[] {
  return messages
    .filter((m) => m.role === 'user' && m.questionId)
    .map((m) => m.questionId as string)
}

/** 화면이 필요로 하는 상태 한 덩어리 */
function viewOf(row: ConversationRow | null, dday: number, reportType: string) {
  const state = stateOf(row)
  const messages = row?.messages ?? []

  return {
    messages,
    gauge: remainingRatio(state),
    exhausted: isExhausted(state),
    questions: getChatQuestions(reportType === '면접' ? '면접' : '필기', dday),
    askedIds: askedFrom(messages),
  }
}

/** 리포트와 조회 기록을 함께 읽습니다. 둘 다 있어야 대화가 성립합니다 */
async function load(reportId: string, userId: string) {
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('reports')
    .select('id, user_id, query_id, report_type, status, content')
    .eq('id', reportId)
    .maybeSingle<ReportRow>()

  if (!report || report.user_id !== userId) return null
  if (report.status !== 'completed' || !report.content) return null

  const { data: query } = await supabase
    .from('queries')
    .select(QUERY_COLUMNS)
    .eq('id', report.query_id)
    .maybeSingle<QueryRow>()

  if (!query) return null

  return { report, query }
}

/**
 * 대화 기록을 읽습니다.
 *
 * ok가 false면 테이블 자체를 못 읽은 것입니다(마이그레이션 007 미적용 등).
 * 이때는 답변하지 않고 물러납니다. 저장이 안 되면 누적 원가가 매 턴 0으로
 * 돌아가 상한이 사라지고, 사용자는 끝없이 물어볼 수 있게 됩니다.
 * 못 세는 것보다 안 여는 것이 낫습니다.
 */
async function readConversation(
  reportId: string
): Promise<{ ok: boolean; row: ConversationRow | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select('id, messages, total_cost, turn_count')
    .eq('report_id', reportId)
    .maybeSingle<ConversationRow>()

  if (error) return { ok: false, row: null }
  return { ok: true, row: data ?? null }
}

/** 재진입 — 지금까지의 대화와 남은 기운을 돌려줍니다 (FIX_4 [3]-10) */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  const reportId = req.nextUrl.searchParams.get('reportId')
  if (!reportId) return NextResponse.json({ error: 'bad request' }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const loaded = await load(reportId, user.id)
  if (!loaded) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const free = buildFreeResult(toUserInput(loaded.query))
  const { ok, row } = await readConversation(reportId)

  if (!ok) return NextResponse.json({ error: 'not ready' }, { status: 503 })

  return NextResponse.json(viewOf(row, free.dday, loaded.report.report_type))
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  let body: { reportId?: string; message?: string; questionId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const reportId = body.reportId
  const raw = (body.message ?? '').trim()
  if (!reportId || !raw) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  // 직접 입력은 200자로 자릅니다 (FIX_4 [3]-2). 길이 편차가 답변 품질과
  // 원가를 동시에 흔듭니다. 화면에서도 막지만 서버가 최종입니다.
  const message = raw.slice(0, FREE_INPUT_MAX)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const service = createServiceClient()
  if (!service) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  const loaded = await load(reportId, user.id)
  if (!loaded) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { report, query } = loaded
  const free = buildFreeResult(toUserInput(query))
  const reportType = report.report_type === '면접' ? '면접' : '필기'

  const { ok, row } = await readConversation(reportId)
  if (!ok) return NextResponse.json({ error: 'not ready' }, { status: 503 })

  const state = stateOf(row)

  // 기운이 다 떨어졌으면 답하지 않습니다. 최소 4턴은 상한을 넘겨도 답합니다
  if (isExhausted(state)) {
    return NextResponse.json({
      ...viewOf(row, free.dday, report.report_type),
      exhausted: true,
    })
  }

  // 버튼으로 물은 것인지 직접 입력인지 남깁니다. 이미 물어본 버튼은
  // 다음 화면에서 빼기 위함입니다 (FIX_4 [3]-5)
  const questions = getChatQuestions(reportType, free.dday)
  const questionId =
    body.questionId && body.questionId !== FREE_INPUT_ID
      ? questions.find((q) => q.id === body.questionId)?.id
      : undefined

  const history: StoredMessage[] = row?.messages ?? []
  const forModel: ChatMessage[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: message },
  ]

  const system = buildChatSystemPrompt({
    reportType,
    reportText: buildReportText(report.content as StoredReportContent, query.name),
    free,
    name: query.name,
    examName: query.exam_name,
    dday: free.dday,
  })

  let turn
  try {
    turn = await runChatTurn(system, forModel)
  } catch (e) {
    const kind = e instanceof GenerateError ? e.kind : '알 수 없는 오류'
    return NextResponse.json({ error: 'generate', kind }, { status: 502 })
  }

  const nextState: ChatState = {
    totalCost: state.totalCost + turnCost(turn.inputTokens, turn.outputTokens),
    turnCount: state.turnCount + 1,
  }

  const messages: StoredMessage[] = [
    ...history,
    { role: 'user', content: message, ...(questionId ? { questionId } : {}) },
    { role: 'assistant', content: turn.text },
  ]

  const saved = {
    report_id: reportId,
    user_id: user.id,
    messages,
    total_cost: nextState.totalCost,
    turn_count: nextState.turnCount,
  }

  const write = row
    ? await service.from('conversations').update(saved).eq('id', row.id)
    : await service.from('conversations').insert(saved)

  if (write.error) {
    // 답변은 이미 만들어졌지만 원가를 세지 못했습니다. 다음 턴이 다시 0에서
    // 시작하면 상한이 없는 것과 같으므로, 이번 답변만 전하고 대화를 닫습니다.
    return NextResponse.json({
      reply: turn.text,
      messages,
      gauge: 0,
      exhausted: true,
      questions,
      askedIds: askedFrom(messages),
      mock: turn.mock,
    })
  }

  return NextResponse.json({
    reply: turn.text,
    messages,
    gauge: remainingRatio(nextState),
    exhausted: isExhausted(nextState),
    questions,
    askedIds: askedFrom(messages),
    mock: turn.mock,
  })
}
