/**
 * 응답 파싱 (PRD 8.13)
 *
 * effort를 low로 낮춘 뒤 실측에서 4건 중 1건이 파싱 실패했습니다.
 * 문자열 값 안에 줄바꿈이 이스케이프 없이 그대로 들어온 것이 원인입니다.
 * 본문은 멀쩡한데 JSON 문법만 어긋난 경우라, 실패로 돌리고 3,900원짜리
 * 생성을 다시 하는 것보다 고쳐 읽는 편이 낫습니다.
 */

import { describe, expect, it } from 'vitest'

import { GenerateError, getEffort, parseSections } from './provider'

describe('parseSections', () => {
  it('평범한 JSON을 읽는다', () => {
    expect(parseSections('{"a": "가나다"}')).toEqual({ a: '가나다' })
  })

  it('코드 블록으로 감싸도 읽는다', () => {
    expect(parseSections('```json\n{"a": "가나다"}\n```')).toEqual({ a: '가나다' })
  })

  it('배열 값은 빈 줄로 이어 붙인다', () => {
    expect(parseSections('{"a": ["하나", "둘"]}')).toEqual({ a: '하나\n\n둘' })
  })

  it('문자열 안에 날것의 줄바꿈이 있어도 읽는다', () => {
    const raw = '{\n  "a": "첫 문단입니다.\n\n둘째 문단입니다.",\n  "b": "끝"\n}'
    expect(parseSections(raw)).toEqual({
      a: '첫 문단입니다.\n\n둘째 문단입니다.',
      b: '끝',
    })
  })

  it('탭과 캐리지 리턴도 고쳐 읽는다', () => {
    const raw = '{"a": "앞\t뒤\r\n다음"}'
    expect(parseSections(raw)).toEqual({ a: '앞\t뒤\r\n다음' })
  })

  it('이스케이프된 따옴표를 문자열 끝으로 착각하지 않는다', () => {
    const raw = '{"a": "그는 \\"안녕\\"이라고 했다.\n다음 줄"}'
    expect(parseSections(raw)).toEqual({ a: '그는 "안녕"이라고 했다.\n다음 줄' })
  })

  it('고쳐도 못 읽으면 파싱 오류를 던진다', () => {
    expect(() => parseSections('{"a": ')).toThrow(GenerateError)
    expect(() => parseSections('본문만 왔습니다')).toThrow(GenerateError)
  })

  it('문자열이 하나도 없으면 파싱 오류를 던진다', () => {
    expect(() => parseSections('{"a": 1}')).toThrow(GenerateError)
  })
})

describe('getEffort', () => {
  it('기본값은 필기 low, 면접 medium이다', () => {
    delete process.env.AI_EFFORT_WRITTEN
    delete process.env.AI_EFFORT_INTERVIEW
    expect(getEffort('필기')).toBe('low')
    expect(getEffort('면접')).toBe('medium')
  })

  it('환경변수로 덮어쓴다', () => {
    process.env.AI_EFFORT_WRITTEN = 'HIGH'
    expect(getEffort('필기')).toBe('high')
    delete process.env.AI_EFFORT_WRITTEN
  })

  it('없는 단계를 주면 무시하고 기본값을 쓴다', () => {
    process.env.AI_EFFORT_INTERVIEW = 'ultra'
    expect(getEffort('면접')).toBe('medium')
    delete process.env.AI_EFFORT_INTERVIEW
  })
})
