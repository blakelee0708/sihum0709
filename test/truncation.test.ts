/**
 * 잘림 처리 확인 (PRD 8.13)
 *
 * 실측에서는 stop_reason이 max_tokens인 건이 나오지 않았습니다. 나오지
 * 않는다고 처리가 맞는다는 뜻은 아니므로, max_tokens를 일부러 낮춰
 * 잘림을 만들고 '출력 잘림'으로 떨어지는지 확인합니다.
 *
 * 실행 (실제 과금. 2,000 토큰이라 20원 안쪽입니다)
 *   RUN_TRUNCATION_CHECK=1 npx vitest run test/truncation.test.ts
 *
 * 잘린 본문은 사용자에게 보여주지 않습니다. reports.status가 failed가 되고
 * 화면은 재시도 버튼을 띄웁니다 (PRD 14.13).
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { GenerateError } from '../lib/ai/provider'
import { runPipeline } from '../lib/ai/pipeline'
import type { UserInput } from '../lib/content/assemble'

function loadEnvLocal() {
  let text: string
  try {
    text = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
  } catch {
    return
  }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim()
  }
}

loadEnvLocal()

const ENABLED =
  process.env.RUN_TRUNCATION_CHECK === '1' && Boolean(process.env.ANTHROPIC_API_KEY)

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

describe.skipIf(!ENABLED)('잘림 처리 (PRD 8.13)', () => {
  it('max_tokens에 걸리면 출력 잘림으로 실패한다', async () => {
    // 본문 4,300자에 2,000 토큰은 턱없이 부족합니다. 반드시 잘립니다.
    process.env.AI_MAX_TOKENS = '2000'

    try {
      await runPipeline({ userInput: WRITTEN, companyName: null })
      throw new Error('잘렸어야 하는데 성공했습니다')
    } catch (e) {
      expect(e).toBeInstanceOf(GenerateError)
      expect((e as GenerateError).kind).toBe('출력 잘림')
      console.log('실측:', (e as GenerateError).message)
    } finally {
      delete process.env.AI_MAX_TOKENS
    }
  }, 5 * 60_000)
})
