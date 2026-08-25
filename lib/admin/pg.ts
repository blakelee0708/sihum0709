/**
 * PG 취소 API (PRD 22.8)
 *
 * DB 상태 변경만으로는 실제 환불이 되지 않습니다. PG API를 호출해야 합니다.
 *
 * TODO: 사용자 확인 필요
 * 포트원 또는 토스페이먼츠 계약 후 실제 취소 API로 교체해야 합니다.
 * 지금은 더미 결제만 있으므로 성공으로 처리하고, 실제 결제 건은 막습니다.
 *
 * 부분 환불은 지원하지 않습니다. 3,900원 단일 상품이라 전액 취소만 있으면 됩니다.
 */

export interface CancelResult {
  ok: boolean
  /** 실패 시 관리자에게 보여줄 사유 */
  message?: string
  mock: boolean
}

export async function cancelPayment(
  paymentId: string | null,
  reason: string
): Promise<CancelResult> {
  // 더미 결제는 PG에 실제 거래가 없으므로 바로 성공 처리합니다
  if (!paymentId || paymentId.startsWith('MOCK-')) {
    return { ok: true, mock: true }
  }

  // 실제 PG 거래번호가 붙은 건은 아직 취소할 수단이 없습니다.
  // 모르고 DB만 바꿔 "환불했다"고 착각하는 상황을 막습니다.
  return {
    ok: false,
    mock: false,
    message:
      'PG 연동 전이라 실제 거래는 취소할 수 없습니다. PG 관리자 화면에서 직접 취소한 뒤 다시 처리해 주십시오.',
  }
}

void ((reason: string) => reason)
