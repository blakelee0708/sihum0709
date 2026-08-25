/**
 * 개인정보 처리방침 (PRD 13.3, 14.3)
 *
 * 생년월일과 출생시간은 민감한 정보이므로 수집 항목과 보관 기간을 기재합니다.
 */

import type { Metadata } from 'next'

import SubHeader from '@/components/layout/SubHeader'

export const metadata: Metadata = { title: '개인정보 처리방침 · 시험사주' }

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-md pb-10">
      <SubHeader title="개인정보 처리방침" />

      <div className="space-y-5 px-screen pt-4 text-body">
        <section>
          <h2 className="text-card-title">1. 수집하는 항목</h2>
          <ul className="mt-2 space-y-1" style={{ color: 'var(--text-sub)' }}>
            <li>· 필수 — 생년월일, 시험 정보(시험명, 날짜, 방식)</li>
            <li>· 선택 — 태어난 시간, 이름, 시험 시작 시간, 직무명</li>
            <li>· 로그인 시 — 이메일, 소셜 계정 프로필 이름</li>
            <li>· 결제 시 — 결제 수단 종류, 거래번호 (카드번호는 수집하지 않습니다)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-card-title">2. 이용 목적</h2>
          <p className="mt-2" style={{ color: 'var(--text-sub)' }}>
            사주 계산과 결과 제공, 결제 처리와 리포트 저장, 문의 응대에만 사용합니다.
          </p>
        </section>

        <section>
          <h2 className="text-card-title">3. 비로그인 이용자의 처리</h2>
          <p className="mt-2" style={{ color: 'var(--text-sub)' }}>
            로그인하지 않고 무료 결과만 보시는 경우, 입력하신 내용은 브라우저 세션에만
            보관되며 서버에 저장하지 않습니다. 브라우저를 닫으면 사라집니다.
          </p>
        </section>

        <section>
          <h2 className="text-card-title">4. 서비스 개선을 위한 이용 기록</h2>
          <p className="mt-2" style={{ color: 'var(--text-sub)' }}>
            어느 단계에서 이탈하는지, 어떤 시험 방식을 많이 고르는지를 파악하기 위해
            화면 이동 기록을 남깁니다. 생년월일, 태어난 시간, 이름, 이메일, 시험명은
            기록하지 않으며, 브라우저가 만든 임시 식별자로만 구분합니다. 이 식별자는
            브라우저를 닫으면 사라집니다.
          </p>
          <p className="mt-2" style={{ color: 'var(--text-sub)' }}>
            외부 분석 서비스를 사용하지 않으며, 이 기록은 서비스 서버 밖으로 나가지
            않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-card-title">5. 보관 기간</h2>
          <ul className="mt-2 space-y-1" style={{ color: 'var(--text-sub)' }}>
            <li>· 회원 정보와 조회 기록 — 탈퇴 시 즉시 삭제</li>
            <li>· 결제 이력 — 전자상거래법에 따라 5년간 보관 (이용자 식별 정보 제거)</li>
            <li>· 문의 내역 — 처리 완료 후 3년</li>
          </ul>
        </section>

        <section>
          <h2 className="text-card-title">6. 이용자의 권리</h2>
          <p className="mt-2" style={{ color: 'var(--text-sub)' }}>
            마이페이지에서 언제든 정보를 열람, 수정, 삭제할 수 있습니다. 회원 탈퇴 시
            결제 이력을 제외한 모든 데이터가 삭제되며 복구할 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="text-card-title">7. 처리 위탁</h2>
          <p className="mt-2" style={{ color: 'var(--text-sub)' }}>
            데이터 보관과 인증은 Supabase, 서비스 운영은 Vercel에 위탁합니다. 유료
            리포트 생성 과정에서 계산된 사주 값과 시험 정보가 Anthropic API로 전달되며,
            이름과 이메일 등 직접 식별 정보는 전달하지 않습니다.
          </p>
        </section>

        <p className="text-label" style={{ color: 'var(--text-sub)' }}>
          이 방침은 서비스 정식 출시 전 초안이며, 사업자 등록과 개인정보 보호책임자
          지정 후 최종본으로 갱신됩니다.
        </p>
      </div>
    </main>
  )
}
