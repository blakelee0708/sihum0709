/**
 * 저장된 리포트를 평문으로 (FIX_4 [3]-6)
 *
 * 대화 프롬프트에 "이미 읽은 리포트"를 통째로 넣어야 같은 말을 반복하지
 * 않습니다. 화면은 섹션별 컴포넌트로 그리지만 프롬프트에는 글만 필요합니다.
 *
 * 화면과 같은 규칙으로 조립합니다. 조각이 앞, AI 생성분이 뒤이고
 * (PRD 8.18), 조각의 {name}을 채우고 메아리를 지웁니다. 화면과 다른 글을
 * 넣으면 "리포트에 없는 내용을 반복하지 마라"가 어긋납니다.
 */

import { fillFragment, stripFragmentEcho } from './fragment'
import type { SectionSpec } from './spec'

export interface StoredReportContent {
  sections: SectionSpec[]
  generated: Record<string, string>
  fragments?: {
    compatibility?: string
    position?: string
    shipsin?: string
    pattern?: string
  }
}

/** 섹션 앞에 붙는 조각. 화면(app/report/[id]/page.tsx)과 같은 규칙입니다 */
function leadFor(
  key: string,
  fragments: StoredReportContent['fragments']
): string | undefined {
  if (key === 'pattern') return fragments?.shipsin
  if (key === 'strategy') return fragments?.pattern
  if (key === 'compatibility') return fragments?.compatibility ?? fragments?.position
  return undefined
}

export function buildReportText(
  content: StoredReportContent,
  name: string | null
): string {
  const parts: string[] = []

  for (const section of content.sections) {
    const rawLead = leadFor(section.key, content.fragments)
    const lead = rawLead ? fillFragment(rawLead, name) : undefined
    const body = stripFragmentEcho(content.generated[section.key] ?? '', lead)

    const text = [lead, body].filter(Boolean).join('\n\n').trim()
    if (!text) continue

    parts.push(`## ${section.title}\n${text}`)
  }

  return parts.join('\n\n')
}
