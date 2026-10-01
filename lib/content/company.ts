/**
 * 사업자 정보 (FIX_5 [6])
 *
 * 결제 PG 심사에 필요한 표기입니다. 전자상거래법상 상호·대표자·사업자등록번호·
 * 통신판매업 신고번호를 쇼핑몰 화면에서 확인할 수 있어야 합니다.
 *
 * 값을 화면에 흩어 두면 바꿀 때 한 곳이 꼭 남습니다. 여기 한 파일에서만
 * 고치면 되도록 모아 둡니다.
 *
 * ── 아직 채우지 않은 값 ──
 *
 * ○○○ 자리는 실제 사업자등록증의 값으로 바꿔 주십시오. 심사 전에 반드시
 * 채워야 합니다. 비워 두면 PG 심사에서 반려됩니다.
 */

export interface CompanyInfo {
  /** 상호 */
  name: string
  /** 대표자 */
  ceo: string
  /** 사업자등록번호 */
  businessNumber: string
  /** 통신판매업 신고번호 */
  mailOrderNumber: string
}

export const COMPANY: CompanyInfo = {
  name: '○○○',
  ceo: '○○○',
  businessNumber: '○○○-○○-○○○○○',
  mailOrderNumber: '○○○○-○○○○-○○○○',
}

/** 푸터 한 줄 — "상호 ○○○ · 대표 ○○○ · 사업자등록번호 …" */
export function companyLine(info: CompanyInfo = COMPANY): string {
  return `상호 ${info.name} · 대표 ${info.ceo} · 사업자등록번호 ${info.businessNumber}`
}

/** 통신판매업 신고 줄 */
export function mailOrderLine(info: CompanyInfo = COMPANY): string {
  return `통신판매업 신고 ${info.mailOrderNumber}`
}

/** 값이 아직 자리표시자인지. 출시 점검에서 씁니다 */
export function isPlaceholder(info: CompanyInfo = COMPANY): boolean {
  return Object.values(info).some((v) => v.includes('○'))
}
