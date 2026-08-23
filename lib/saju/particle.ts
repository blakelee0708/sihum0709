/**
 * 한글 조사 처리 (PRD 3.8, README 변수 치환)
 *
 * 영문 시험명(GSAT, LEET 등)은 한글이 아니므로 받침 있음으로 처리합니다.
 * 영문 약어는 대부분 자음으로 끝나 이 처리가 자연스럽습니다.
 */

export type ParticleType = '은는' | '이가' | '을를'

export function attachParticle(word: string, type: ParticleType): string {
  const last = word.charCodeAt(word.length - 1)

  if (last < 0xac00 || last > 0xd7a3) {
    // 한글 음절이 아니면 받침 있음으로 처리합니다
    return word + (type === '은는' ? '은' : type === '이가' ? '이' : '을')
  }

  const hasJongseong = (last - 0xac00) % 28 > 0

  if (type === '은는') return word + (hasJongseong ? '은' : '는')
  if (type === '이가') return word + (hasJongseong ? '이' : '가')
  return word + (hasJongseong ? '을' : '를')
}

/** 단어는 빼고 조사만 돌려줍니다. {examParticle} 같은 변수에 사용합니다. */
export function getParticle(word: string, type: ParticleType): string {
  return attachParticle(word, type).slice(word.length)
}

export interface RenderVars {
  name?: string | null
  [key: string]: unknown
}

/**
 * 문장 조각의 변수를 치환합니다 (README 치환 함수).
 *
 * 이름이 없는 경우 호명 부분을 제거합니다. "{name}님은" 같이 조사가 붙은
 * 형태를 먼저 지워야 "님은"이 남지 않습니다.
 */
export function render(template: string, vars: RenderVars = {}): string {
  let t = template

  if (vars.name) {
    t = t.replace(/\{name\}님/g, `${vars.name}님`)
  } else {
    t = t
      .replace(/\{name\}님은\s*/g, '')
      .replace(/\{name\}님에게\s*/g, '')
      .replace(/\{name\}님과\s*/g, '')
      .replace(/\{name\}님의\s*/g, '')
      .replace(/\{name\}님이\s*/g, '')
      .replace(/\{name\}님도\s*/g, '')
      .replace(/\{name\}님을\s*/g, '')
      .replace(/\{name\}님께\s*/g, '')
      .replace(/\{name\}님\s*/g, '')
  }

  for (const [k, v] of Object.entries(vars)) {
    if (k === 'name') continue
    if (v === undefined || v === null) continue
    t = t.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
  }

  return t.replace(/\s+/g, ' ').trim()
}
