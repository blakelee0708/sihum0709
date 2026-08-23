/** 이용약관 (PRD 14.3) */

import type { Metadata } from 'next'

import SubHeader from '@/components/layout/SubHeader'

export const metadata: Metadata = { title: '이용약관 · 시험사주' }

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-md pb-10">
      <SubHeader title="이용약관" />

      <div className="space-y-5 px-screen pt-4 text-body">
        <section>
          <h2 className="text-card-title">제1조 (목적)</h2>
          <p className="mt-2" style={{ color: 'var(--text-sub)' }}>
            이 약관은 시험사주(이하 회사)가 제공하는 사주 기반 시험 대비 정보 서비스의
            이용 조건과 절차, 회사와 이용자의 권리와 의무를 정하는 것을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-card-title">제2조 (서비스의 성격)</h2>
          <p className="mt-2" style={{ color: 'var(--text-sub)' }}>
            본 서비스가 제공하는 모든 내용은 사주 명리 해석에 기반한 참고 자료이며,
            시험 결과를 예측하거나 보장하지 않습니다. 이용자는 이를 오락 및 참고
            목적으로만 이용하여야 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-card-title">제3조 (유료 서비스)</h2>
          <p className="mt-2" style={{ color: 'var(--text-sub)' }}>
            유료 리포트는 3,900원의 일회성 결제 상품입니다. 결제 후 이용자 계정에
            영구 저장되며 재열람 횟수에 제한이 없습니다.
          </p>
        </section>

        <section>
          <h2 className="text-card-title">제4조 (청약철회의 제한)</h2>
          <p className="mt-2" style={{ color: 'var(--text-sub)' }}>
            디지털 콘텐츠의 특성상 콘텐츠 제공이 시작되면 청약철회가 제한됩니다.
            다만 리포트 생성 실패, 중복 결제, 서비스 오류로 인한 열람 불가의 경우
            전액 환불해 드립니다.
          </p>
        </section>

        <section>
          <h2 className="text-card-title">제5조 (계정 해지)</h2>
          <p className="mt-2" style={{ color: 'var(--text-sub)' }}>
            이용자는 마이페이지에서 언제든 탈퇴할 수 있습니다. 탈퇴 시 저장된 결과와
            구매한 리포트가 삭제되며 복구할 수 없습니다. 다만 결제 이력은 관계 법령에
            따라 이용자 식별 정보를 제거한 상태로 5년간 보관합니다.
          </p>
        </section>

        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          이 약관은 서비스 정식 출시 전 초안이며, 사업자 등록과 통신판매업 신고 완료
          후 최종본으로 갱신됩니다.
        </p>
      </div>
    </main>
  )
}
