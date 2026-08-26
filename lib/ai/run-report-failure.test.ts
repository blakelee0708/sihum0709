/**
 * 생성 실패가 reports에 어떻게 남는지 (PRD 14.12, 14.13)
 *
 * 화면(재시도 버튼)은 이 행의 status와 retry_count만 보고 그립니다.
 * 여기가 틀리면 사용자는 영원히 "만들고 있어요"를 보거나, 재시도를
 * 무한히 누를 수 있게 됩니다.
 *
 * runPipeline을 갈아끼워 실제 AI를 부르지 않습니다.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GenerateError } from './provider'

const runPipeline = vi.hoisted(() => vi.fn())
vi.mock('./pipeline', () => ({ runPipeline }))
vi.mock('./search-log', () => ({ logSearches: vi.fn() }))

const { runAndSaveReport } = await import('./run-report')

/** service_role 클라이언트 흉내. update된 값만 붙잡아 둡니다 */
function fakeService() {
  const updates: Record<string, unknown>[] = []
  const service = {
    from() {
      return {
        update(values: Record<string, unknown>) {
          updates.push(values)
          return { eq: async () => ({ data: null, error: null }) }
        },
      }
    },
  }
  return { service, updates }
}

const INPUT = {
  name: '김민준',
  examName: '국가직 9급 공무원',
  examCategory: '공무원',
  examType: '필기' as const,
  examDate: '2026-10-15',
  startTime: '10:00',
  birthDate: '1998-03-15',
  birthTime: '14:30',
  hasBirthTime: true,
}

beforeEach(() => {
  runPipeline.mockReset()
})

describe('생성 실패 기록', () => {
  it('출력이 잘리면 실패로 남기고 사용자에게 보여주지 않는다', async () => {
    runPipeline.mockRejectedValue(new GenerateError('출력 잘림', 'max_tokens(32000)'))

    const { service, updates } = fakeService()
    await runAndSaveReport({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service: service as any,
      reportId: 'r1',
      userInput: INPUT,
      companyName: null,
    })

    expect(updates).toHaveLength(1)
    expect(updates[0].status).toBe('failed')
    expect(updates[0].error_message).toBe('출력 잘림')
    // 잘림은 다시 부르면 될 수 있는 실패라 횟수를 올리지 않습니다.
    // 재시도 버튼이 바로 보여야 합니다.
    expect(updates[0].retry_count).toBeUndefined()
  })

  it('분량 미달은 재시도 횟수를 올린다', async () => {
    runPipeline.mockRejectedValue(new GenerateError('분량 미달', '2,000자 / 하한 4,290자'))

    const { service, updates } = fakeService()
    await runAndSaveReport({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service: service as any,
      reportId: 'r1',
      userInput: INPUT,
      companyName: null,
      retryCount: 1,
    })

    expect(updates[0].status).toBe('failed')
    expect(updates[0].error_message).toBe('분량 미달')
    // 같은 프롬프트로 계속 다시 부르면 원가만 쌓입니다 (PRD 8.3)
    expect(updates[0].retry_count).toBe(2)
  })

  it('예상 못 한 예외도 실패로 남긴다 — pending으로 방치하지 않는다', async () => {
    runPipeline.mockRejectedValue(new Error('소켓이 끊겼습니다'))

    const { service, updates } = fakeService()
    await runAndSaveReport({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service: service as any,
      reportId: 'r1',
      userInput: INPUT,
      companyName: null,
    })

    expect(updates[0].status).toBe('failed')
    expect(updates[0].error_message).toBe('알 수 없는 오류')
  })

  it('after() 안에서 돌기 때문에 밖으로 던지지 않는다', async () => {
    runPipeline.mockRejectedValue(new GenerateError('출력 잘림'))

    const { service } = fakeService()
    await expect(
      runAndSaveReport({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        service: service as any,
        reportId: 'r1',
        userInput: INPUT,
        companyName: null,
      })
    ).resolves.toBeUndefined()
  })
})
