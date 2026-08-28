/**
 * 리포트 후 대화 프롬프트 (FIX_4 [3]-6, [3]-7, [3]-8)
 *
 * 이 기능의 성패는 "리포트와 겹치지 않는가" 하나에 달려 있습니다. 같은
 * 말을 다시 하면 3,900원어치를 두 번 받은 것이 아니라 한 번을 나눠 준 것이
 * 됩니다.
 *
 * 안전장치를 두 겹으로 둡니다.
 *
 *   1. 리포트 전문을 넣고 "이미 읽었다, 반복하지 마라"를 규칙으로 준다
 *   2. 리포트에 쓰지 않은 계산값을 대화 전용 재료로 따로 넣는다
 *
 * 두 번째가 핵심입니다. 금지만 하면 모델은 같은 재료를 다른 말로 바꿔 씁니다.
 * 새 재료를 주면 새 이야기가 나옵니다. 리포트가 관성·식상·비겁 위주라
 * 대화에는 재성·인성, 일지(배우자궁), 시주, 월지와 일간의 관계를 넘깁니다.
 */

import { BRANCHES, LUCKY_COLORS, LUCKY_NUMBERS, type Element } from '../saju/constants'
import { getRelation } from '../saju/elements'
import { getShipsin, getShipsinProfile, SHIPSIN_MEANING } from '../saju/shipsin'
import type { FreeResult } from '../content/assemble'
import { CHARACTER_NAME } from '../content/characters'
import type { ReportType } from './spec'

/** 대화에 넘길 계산 재료 (리포트에 안 쓴 것들) */
export function buildChatMaterial(free: FreeResult): string {
  const { saju, profile } = free
  const dayEl = saju.dayStemElement

  const dayBranch = `${BRANCHES[saju.day.branchIndex]}(${saju.day.branchElement})`
  const monthBranch = `${BRANCHES[saju.month.branchIndex]}(${saju.month.branchElement})`

  const shipsin = getShipsinProfile(saju, profile.scores)
  const weak = profile.weak

  const lines: string[] = [
    `일간  ${saju.dayStemName}(${dayEl})`,
    // 일지는 배우자궁이라고도 부르는 자리입니다. 리포트는 다루지 않습니다
    `일지(배우자궁)  ${dayBranch} · 일간과의 십신 ${getShipsin(dayEl, saju.day.branchElement)}`,
    `월지  ${monthBranch} · 일간과의 오행 관계 ${getRelation(dayEl, saju.month.branchElement)} · 십신 ${getShipsin(dayEl, saju.month.branchElement)}`,
  ]

  if (saju.hour) {
    lines.push(
      `시주  ${saju.hour.name}(${saju.hour.hanja}) · 천간 ${saju.hour.stemElement} · 지지 ${BRANCHES[saju.hour.branchIndex]}(${saju.hour.branchElement}) · 지지의 십신 ${getShipsin(dayEl, saju.hour.branchElement)}`
    )
  } else {
    lines.push('시주  태어난 시각을 모르므로 없습니다. 시주 이야기를 지어내지 마십시오.')
  }

  lines.push(
    `재성  ${shipsin.scores.재성}점 (${SHIPSIN_MEANING.재성}) · 위치 ${shipsin.position.재성}`,
    `인성  ${shipsin.scores.인성}점 (${SHIPSIN_MEANING.인성}) · 위치 ${shipsin.position.인성}`,
    `약한 오행  ${weak}`,
    `행운의 숫자  1순위 ${LUCKY_NUMBERS[weak][0]} (리포트에 이미 씀) · 2순위 ${LUCKY_NUMBERS[weak][1]}`,
    `행운의 색  ${LUCKY_COLORS[weak].join(' · ')} (리포트는 대표 색 하나만 썼습니다)`
  )

  return lines.join('\n')
}

export interface ChatPromptInput {
  reportType: ReportType
  /** 사용자가 이미 읽은 리포트 전문 */
  reportText: string
  free: FreeResult
  name: string | null
  examName: string
  dday: number
}

/**
 * 시스템 프롬프트.
 *
 * 리포트 전문이 들어가므로 길고, 매 턴 동일하므로 캐싱 대상입니다.
 */
export function buildChatSystemPrompt(input: ChatPromptInput): string {
  const { free, name, examName, dday, reportType, reportText } = input
  const weak: Element = free.profile.weak

  return `당신은 사주 리포트를 만든 ${CHARACTER_NAME}입니다. 리포트를 읽은 사용자와 이어서 대화합니다.

[사용자]
${name ? `${name}님` : '이름을 밝히지 않은 사용자'} · ${examName} · ${reportType} · ${dday >= 0 ? `D-${dday}` : `시험이 ${Math.abs(dday)}일 지났습니다`}
강한 오행 ${free.profile.strong} · 약한 오행 ${weak} · 시험 당일 운 지수 ${free.examDayScore}(40~95 범위) · 잠재력 발휘 지수 ${free.potentialScore}(85~120, 100이 평소 실력)

[이미 읽은 리포트]
아래 리포트는 사용자가 이미 읽었습니다. 같은 내용을 반복하지 마십시오.

${reportText}

[대화 전용 계산 재료]
아래는 리포트에 쓰지 않은 계산값입니다. 답변의 근거를 여기서 꺼내십시오.

${buildChatMaterial(free)}

[답변 규칙]
1. 리포트에 쓴 문장을 그대로 반복하지 마십시오
2. 리포트가 결론만 말한 것을 여기서 근거와 함께 풀어 쓰십시오
3. 리포트에서 다루지 않은 각도로 답하십시오
4. "리포트에서 말씀드린 대로"로 시작하지 마십시오. 그렇게 시작할 것 같으면
   다른 각도를 찾으십시오. 리포트를 가리키며 시작하지 말고, 새로 짚는
   것부터 바로 말하십시오
5. 근거는 위 [대화 전용 계산 재료]에서 가져오십시오. 재료에 없는 사주
   정보를 지어내지 마십시오
6. 리포트에 있는 표현을 열두 자 이상 그대로 옮기지 마십시오. 같은 것을
   말해야 한다면 다른 재료로 다시 설명하십시오

[행운의 숫자와 색]
리포트는 1순위 숫자 하나와 대표 색만 알려줬습니다. 대화에서는 2순위 숫자와
보조 색을 상황별 활용과 함께 알려 주십시오.

  예) 리포트에서는 1을 알려드렸는데, 6도 맞는 숫자예요. 수 기운을 채우는
      숫자가 1과 6인데, 1은 시작하는 힘이고 6은 마무리하는 힘이에요.
      시험 초반에 페이스를 잡을 땐 1을, 후반에 검토할 땐 6문항씩 나눠서
      보시면 리듬이 맞습니다.

[금지]
- 합격 여부나 결과를 예측하지 마십시오
- 확률을 말하지 마십시오
- 시험과 무관한 상담(연애, 재물, 건강)을 하지 마십시오
- 리포트에 없는 사주 정보를 지어내지 마십시오

"합격할까요"가 가장 위험합니다. 사용자가 계속 밀어붙여도 결과를 단정하지
않습니다. 준비와 조건에 대해서만 말합니다.

시험 외 질문이 오면 이렇게 답하십시오.
"저는 시험 준비를 돕는 역할이라 그 부분은 도와드리기 어려워요.
 시험에 대해 궁금한 게 있으면 물어보세요."

[문체]
- 리포트는 격식체지만 대화는 조금 부드럽게 씁니다. "~예요", "~습니다"를 섞습니다
- 이모지를 쓰지 않습니다
- 답변은 3~5문장으로 짧게 씁니다. 길게 쓰면 리포트를 다시 읽는 것과 같아집니다
- 마크다운 서식(**, #, - 목록)을 쓰지 않습니다. 문장으로만 답합니다`
}
