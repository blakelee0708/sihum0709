/**
 * 리포트 섹션 (PRD 14.11, 21.12)
 *
 * 스크롤 리빌은 호출부가 아니라 여기에 넣습니다. 리포트 페이지가 섹션
 * 종류에 따라 분기해서 렌더하므로 한 갈래를 빠뜨리기 쉽습니다.
 */

import Reveal from '@/components/motion/Reveal'

interface Props {
  index: number
  title: string
  /**
   * 미리 쓴 조각 (PRD 8.18). AI 생성분보다 앞에 옵니다.
   * 순서를 바꾸면 사주 해석의 일관성이 무너집니다.
   */
  lead?: string
  body?: string
  highlight?: boolean
  children?: React.ReactNode
}

export default function ReportSection({
  index,
  title,
  lead,
  body,
  highlight,
  children,
}: Props) {
  return (
    <Reveal
      as="section"
      className="p-card"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        border: highlight ? '1px solid var(--primary)' : undefined,
      }}
    >
      <h2 className="text-card-title">
        {!highlight && (
          <span className="mr-1" style={{ color: 'var(--primary)' }}>
            {index}.
          </span>
        )}
        {title}
      </h2>

      {lead && <ReportBody body={lead} />}

      {body && <ReportBody body={body} />}

      {children && <div className="mt-3">{children}</div>}
    </Reveal>
  )
}

/**
 * 본문 문단.
 *
 * 명식과 캘린더는 그림이 먼저 오고 해설이 뒤에 붙으므로
 * 순서를 바꿔 쓸 수 있게 따로 빼 두었습니다.
 */
export function ReportBody({ body }: { body: string }) {
  return (
    <div className="mt-3 space-y-3">
      {body.split('\n\n').map((p, i) => (
        <p key={i} className="text-body">
          {p}
        </p>
      ))}
    </div>
  )
}
