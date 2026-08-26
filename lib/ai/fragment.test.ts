/**
 * 조각 처리 (PRD 8.18)
 *
 * 둘 다 목업 결제 경로로 완료된 리포트를 열어 보고 찾은 것입니다.
 */

import { describe, expect, it } from 'vitest'

import { fillFragment, stripFragmentEcho } from './fragment'

describe('fillFragment', () => {
  it('이름을 채운다', () => {
    expect(fillFragment('{name}님은 어떤 시험을 봐도', '김민준')).toBe(
      '김민준님은 어떤 시험을 봐도'
    )
  })

  it('이름이 없으면 호명을 지운다', () => {
    expect(fillFragment('{name}님은 어떤 시험을 봐도', null)).toBe('어떤 시험을 봐도')
    expect(fillFragment('{name}님의 사주는', undefined)).toBe('사주는')
  })

  it('자리표시자를 화면에 남기지 않는다', () => {
    for (const name of ['김민준', null, undefined]) {
      expect(fillFragment('{name}님 결과입니다', name)).not.toContain('{name}')
    }
  })
})

describe('stripFragmentEcho', () => {
  const FRAGMENT =
    '신금 일간에게 관성은 화(火)입니다. 이미 다듬어진 보석이라 강한 불은 오히려 해가 됩니다. 화가 적당하면 빛이 나고, 지나치면 형태가 무너집니다.'

  it('본문 앞의 조각 메아리를 지운다', () => {
    const body = `${FRAGMENT}\n\n관성은 0점이며 원국에 전혀 자리하지 않습니다. 외부 평가에 무관심하다는 뜻입니다.`
    expect(stripFragmentEcho(body, FRAGMENT)).toBe(
      '관성은 0점이며 원국에 전혀 자리하지 않습니다. 외부 평가에 무관심하다는 뜻입니다.'
    )
  })

  it('줄바꿈과 공백 차이는 무시한다', () => {
    const echoed = FRAGMENT.replace('입니다. ', '입니다.\n')
    const body = `${echoed}\n\n관성은 0점이며 원국에 전혀 자리하지 않습니다. 외부 평가에 무관심하다는 뜻입니다.`
    expect(stripFragmentEcho(body, FRAGMENT)).not.toContain('다듬어진 보석')
  })

  it('여러 문단짜리 조각도 통째로 지운다', () => {
    const frag = '김민준님은 이 패턴이 반복됩니다.\n\n빠른 흡수, 넓은 확장, 마무리 지연\n\n초반 진도는 잘 나가는데 마무리를 못 합니다.'
    const body = `${frag}\n\n이 패턴은 십신 분포에서 그대로 나옵니다. 재성이 6점으로 과다합니다.`
    expect(stripFragmentEcho(body, frag)).toBe(
      '이 패턴은 십신 분포에서 그대로 나옵니다. 재성이 6점으로 과다합니다.'
    )
  })

  it('메아리가 없으면 그대로 둔다', () => {
    const body = '관성은 0점이며 원국에 전혀 자리하지 않습니다. 외부 평가에 무관심하다는 뜻입니다.'
    expect(stripFragmentEcho(body, FRAGMENT)).toBe(body)
  })

  it('조각이 없으면 그대로 둔다', () => {
    const body = '본문입니다.'
    expect(stripFragmentEcho(body, null)).toBe(body)
    expect(stripFragmentEcho(body, undefined)).toBe(body)
  })

  it('본문이 조각뿐이면 버리지 않는다', () => {
    // 판정이 틀렸을 때 결제한 사용자에게 빈 섹션을 보여주면 안 됩니다
    expect(stripFragmentEcho(FRAGMENT, FRAGMENT)).toBe(FRAGMENT)
  })

  it('앞 문단만 보고 뒤는 건드리지 않는다', () => {
    const body = `새 내용입니다. 조각과 상관없는 문단이고 충분히 깁니다.\n\n${FRAGMENT}`
    expect(stripFragmentEcho(body, FRAGMENT)).toBe(body)
  })
})
