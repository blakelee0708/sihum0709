/**
 * 랜딩 푸터 (FIX_5 [6])
 *
 * 결제 PG 심사에 필요한 표기 자리입니다. 상호·대표자·사업자등록번호·
 * 통신판매업 신고번호를 쇼핑몰 화면에서 확인할 수 있어야 합니다.
 *
 * 값은 lib/content/company.ts 한 곳에 있습니다. 심사 전에 그 파일의
 * ○○○를 실제 값으로 바꾸면 됩니다.
 *
 * 오락 목적 고지(PRD 18.4)도 여기서 함께 보여줍니다. 랜딩에서는 별도
 * Disclaimer 대신 이 푸터가 그 역할을 합니다.
 */

import Link from 'next/link'

import { companyLine, mailOrderLine } from '@/lib/content/company'

/**
 * 고지 문구.
 *
 * lib/content/assemble.ts의 DISCLAIMER와 같은 내용이지만 "이 서비스는"이
 * 빠진 참고 시안 문구를 그대로 씁니다. 확정된 문구라 바꾸지 않습니다
 * (FIX_5 [8]). 결과·리포트 화면은 지금처럼 DISCLAIMER를 씁니다.
 */
const LANDING_DISCLAIMER =
  '사주 명리 해석에 기반한 참고 자료이며 시험 결과를 예측하거나 보장하지 않습니다.'

const LINK: React.CSSProperties = {
  color: 'var(--ink)',
  fontWeight: 600,
  textDecoration: 'none',
}

export default function LandingFooter() {
  return (
    <footer
      style={{
        marginTop: 44,
        padding: '20px 22px 0',
        borderTop: '1px solid rgba(30, 60, 140, 0.10)',
      }}
    >
      <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--ink)' }}>
        <Link href="/terms" style={LINK}>
          이용약관
        </Link>
        {' · '}
        <Link href="/privacy" style={LINK}>
          개인정보처리방침
        </Link>
      </p>

      <p
        style={{
          margin: 0,
          fontSize: 11,
          lineHeight: 1.7,
          color: 'var(--ink-sub)',
        }}
      >
        {companyLine()}
        <br />
        {mailOrderLine()}
        <br />
        {LANDING_DISCLAIMER}
      </p>
    </footer>
  )
}
