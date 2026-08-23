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

/**
 * 연결어미. ㄴ/ㄹ 받침으로 끝나지만 뒤 명사를 꾸미지 않습니다.
 * "정리하면 {name}님은 ..." 은 호명을 지워도 문장이 성립합니다.
 */
const CONNECTIVE_ENDINGS = ['면', '서', '도', '만', '니', '며', '든', '나']

/** 뒤에 오는 명사를 꾸미는 관형어인지 판정합니다 (얕은, 강한, 가는 ...) */
export function isAdnominal(word: string): boolean {
  if (CONNECTIVE_ENDINGS.some((e) => word.endsWith(e))) return false

  const last = word[word.length - 1]
  if (last === '은' || last === '는' || last === '을' || last === '를') return true

  const code = last.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return false

  // 종성이 ㄴ(4) 또는 ㄹ(8)이면 관형형으로 봅니다 (강한, 오는, 볼)
  const jongseong = (code - 0xac00) % 28
  return jongseong === 4 || jongseong === 8
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
    // 관형어 뒤의 호명은 그냥 지우면 문장이 끊깁니다.
    //
    //   "금 기운이 얕은 {name}님은 선택지를 ..."
    //     → 지우기만 하면 "금 기운이 얕은 선택지를 ..." 가 됩니다
    //     → "금 기운이 얕은 분은 선택지를 ..." 로 둡니다
    //
    // 조각 파일은 원본이라 건드리지 않고 치환 단계에서 처리합니다.
    t = t.replace(/(\S+)(\s+)\{name\}님/g, (whole, prev: string, gap: string) =>
      isAdnominal(prev) ? `${prev}${gap}분` : whole
    )

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
    const value = String(v)

    // 조각에 조사가 붙어 있는 경우 치환된 값의 받침에 맞춰 다시 고릅니다.
    //
    // 조각 원문에는 "{exam}은", "{startTime}는"처럼 조사가 고정되어 있는데,
    // 시험명과 시각은 사용자 입력이라 받침이 달라집니다.
    // ("9급 공채은", "오후 2시 30분는"이 나옵니다)
    // 조각 파일은 원본이므로 건드리지 않고 여기서 맞춥니다.
    t = t.replace(
      new RegExp(`\\{${k}\\}([은는이가을를])`, 'g'),
      (_m, particle: string) => value + fixParticle(value, particle)
    )

    t = t.replace(new RegExp(`\\{${k}\\}`, 'g'), value)
  }

  return t.replace(/\s+/g, ' ').trim()
}

const PARTICLE_PAIRS: Record<string, ParticleType> = {
  은: '은는',
  는: '은는',
  이: '이가',
  가: '이가',
  을: '을를',
  를: '을를',
}

/** 조각에 적힌 조사를 실제 값의 받침에 맞는 조사로 바꿉니다 */
export function fixParticle(word: string, written: string): string {
  const type = PARTICLE_PAIRS[written]
  if (!type) return written
  return getParticle(word, type)
}
