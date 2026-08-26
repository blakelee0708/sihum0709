/**
 * 조각 처리 (PRD 8.18)
 *
 * 섹션 2와 마지막 섹션은 미리 쓴 조각이 맨 앞에 그대로 실리고 AI 생성분이
 * 뒤에 붙습니다. 순서를 바꾸면 사주 해석의 일관성이 무너집니다.
 *
 * 이 구조에서 화면에 두 가지가 새어 나왔습니다. 목업 결제 경로로 완료된
 * 리포트를 실제로 열어 보고서야 나왔습니다. 타입 검사와 빌드는 통과합니다.
 *
 * 1. 자리표시자 노출
 *    paid-fragments.json의 조각에는 {name}님이 그대로 들어 있습니다.
 *    화면이 이것을 치환 없이 붙여 "{name}님은 어떤 시험을 봐도 이 패턴이
 *    반복됩니다"가 3,900원짜리 리포트에 찍혔습니다.
 *
 * 2. 조각 중복
 *    프롬프트가 "조각이 앞에 그대로 실리니 반복하지 말라"고 지시하는데도
 *    모델이 조각을 한 번 더 씁니다. 화면에서 같은 세 문단이 연달아 두 번
 *    나옵니다. 실측 8건 전부에서 그랬습니다.
 *
 *    이것은 분량 수치도 흐립니다. 마지막 섹션이 상한을 계속 넘긴 이유가
 *    여기 있었습니다. 조각 265자가 본문 글자 수에 얹혀 있었습니다.
 *
 *      strategy  594자  →  조각 265자를 빼면 329자
 *      pattern   626자  →  조각  82자를 빼면 544자
 *
 * 말로 시키는 대신 코드가 지웁니다. 모델에게 "반복하지 마라"는 지시는
 * 여덟 번 중 여덟 번 안 지켜졌습니다.
 */

/** 조각의 {name}님을 실제 이름으로 바꿉니다. 이름이 없으면 호명을 지웁니다 */
export function fillFragment(text: string, name?: string | null): string {
  if (name) return text.replace(/\{name\}님/g, `${name}님`)
  return text
    .replace(/\{name\}님의\s*/g, '')
    .replace(/\{name\}님에게\s*/g, '')
    .replace(/\{name\}님은\s*/g, '')
    .replace(/\{name\}님\s*/g, '')
    .trim()
}

/** 비교용 정규화. 공백과 문장부호 차이는 무시합니다 */
function normalize(text: string): string {
  return text.replace(/\s+/g, '')
}

/**
 * 본문 앞에 조각이 그대로 다시 쓰였으면 지웁니다.
 *
 * 문단 단위로 봅니다. 앞에서부터 조각 안에 통째로 들어 있는 문단이면
 * 메아리로 보고 버리고, 조각에 없는 문단을 만나면 멈춥니다.
 *
 * 짧은 문단은 우연히 겹칠 수 있어 15자 미만은 판단하지 않고 넘어갑니다.
 * 다만 그것만으로 본문 전체가 사라지지는 않게, 남는 것이 없으면 원본을
 * 그대로 돌려줍니다.
 */
export function stripFragmentEcho(body: string, fragment?: string | null): string {
  if (!fragment) return body

  const target = normalize(fragment)
  if (target.length < 15) return body

  const paragraphs = body.split(/\n{2,}/)
  let cut = 0

  for (const paragraph of paragraphs) {
    const p = normalize(paragraph)

    // 빈 문단은 그냥 넘깁니다
    if (p.length === 0) {
      cut += 1
      continue
    }
    // 짧은 문단은 우연한 일치일 수 있어 판단하지 않습니다.
    // 조각의 소제목 줄("빠른 흡수, 넓은 확장, 마무리 지연")이 여기 걸립니다.
    if (p.length < 15) {
      if (!target.includes(p)) break
      cut += 1
      continue
    }
    if (!target.includes(p)) break
    cut += 1
  }

  if (cut === 0) return body

  const rest = paragraphs.slice(cut).join('\n\n').trim()

  // 전부 메아리로 판정됐다면 판정이 틀린 것입니다. 본문을 버리지 않습니다.
  return rest.length > 0 ? rest : body
}
