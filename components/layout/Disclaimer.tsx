/** PRD 18.4 오락 목적 고지 — 무료 결과와 유료 리포트 하단에 고정 노출합니다 */

import { DISCLAIMER } from '@/lib/content/assemble'

export default function Disclaimer() {
  return (
    <p
      className="px-screen py-6 text-label"
      style={{ color: 'var(--text-sub)' }}
    >
      {DISCLAIMER}
    </p>
  )
}
