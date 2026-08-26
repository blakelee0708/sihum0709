/**
 * 응답 파싱 (PRD 8.13)
 *
 * effort를 low로 낮춘 뒤 실측에서 4건 중 1건이 파싱 실패했습니다.
 * 문자열 값 안에 줄바꿈이 이스케이프 없이 그대로 들어온 것이 원인입니다.
 * 본문은 멀쩡한데 JSON 문법만 어긋난 경우라, 실패로 돌리고 3,900원짜리
 * 생성을 다시 하는 것보다 고쳐 읽는 편이 낫습니다.
 */

import { describe, expect, it } from 'vitest'

import {
  GenerateError,
  getEffort,
  getParseRepairCount,
  parseSections,
  resetParseRepairCount,
} from './provider'

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

  it('따옴표가 어긋나 객체가 일찍 닫혀도 키로 긁어낸다', () => {
    // 실측에서 나온 두 번째 실패 모양입니다.
    //   Unexpected non-whitespace character after JSON at position 897
    // 값 안의 이스케이프 안 된 따옴표가 문자열을 일찍 끝내고, 파서가
    // 객체를 닫아 버린 뒤 남은 본문을 쓰레기로 봅니다.
    // 제어문자 이스케이프로는 못 고칩니다. 안팎 판정 자체가 무너집니다.
    const raw = '{\n  "a": "그는 "안녕"이라고 했다. 뒷문장입니다.",\n  "b": "둘째 섹션입니다."\n}'

    const out = parseSections(raw, ['a', 'b'])
    expect(out.a).toContain('안녕')
    expect(out.a).toContain('뒷문장입니다.')
    expect(out.b).toBe('둘째 섹션입니다.')
  })

  it('키를 절반도 못 찾으면 살리지 않는다', () => {
    // 억지로 살린 반쪽짜리 리포트를 결제한 사용자에게 보여주는 것이
    // 실패로 돌리는 것보다 나쁩니다.
    const raw = '{ "a": "값" ]]] 망가짐'
    expect(() => parseSections(raw, ['a', 'b', 'c', 'd'])).toThrow(GenerateError)
  })

  it('긁어낼 때 이스케이프를 되돌린다', () => {
    const raw = '{\n  "a": "첫 문단.\\n\\n둘째 "따옴표" 문단.",\n  "b": "끝."\n}'
    const out = parseSections(raw, ['a', 'b'])
    expect(out.a).toContain('첫 문단.\n\n둘째')
  })

  it('멀쩡한 JSON은 긁어내기까지 가지 않는다', () => {
    resetParseRepairCount()
    parseSections('{"a": "가나다"}', ['a'])
    expect(getParseRepairCount()).toEqual({ escaped: 0, loose: 0 })
  })

  it('복구가 일어나면 센다', () => {
    resetParseRepairCount()
    parseSections('{\n  "a": "첫 문단.\n\n둘째 문단."\n}', ['a'])
    expect(getParseRepairCount().escaped).toBe(1)

    parseSections('{\n  "a": "그는 "안녕"이라 했다. 뒷문장입니다.",\n  "b": "끝."\n}', ['a', 'b'])
    expect(getParseRepairCount().loose).toBe(1)
    resetParseRepairCount()
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
  it('기본값은 둘 다 medium이다', () => {
    // low에서는 섹션 하한 미달이 회당 1~4개 남습니다 (실측)
    delete process.env.AI_EFFORT_WRITTEN
    delete process.env.AI_EFFORT_INTERVIEW
    expect(getEffort('필기')).toBe('medium')
    expect(getEffort('면접')).toBe('medium')
  })

  it('환경변수로 덮어쓴다', () => {
    process.env.AI_EFFORT_WRITTEN = 'HIGH'
    expect(getEffort('필기')).toBe('high')
    process.env.AI_EFFORT_WRITTEN = 'low'
    expect(getEffort('필기')).toBe('low')
    delete process.env.AI_EFFORT_WRITTEN
  })

  it('없는 단계를 주면 무시하고 기본값을 쓴다', () => {
    process.env.AI_EFFORT_INTERVIEW = 'ultra'
    expect(getEffort('면접')).toBe('medium')
    delete process.env.AI_EFFORT_INTERVIEW
  })
})
