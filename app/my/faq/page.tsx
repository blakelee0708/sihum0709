/**
 * 자주 묻는 질문 (PRD 14.17)
 *
 * 문의를 줄이는 장치입니다.
 * 마지막 항목(사주 계산 기준)이 중요합니다. 자시 처리와 경도 보정 방식을
 * 밝혀두면 다른 만세력과 결과가 다르다는 문의를 미리 줄일 수 있습니다.
 */

import type { Metadata } from 'next'

import SubHeader from '@/components/layout/SubHeader'

export const metadata: Metadata = { title: '자주 묻는 질문 · 시험사주' }

const FAQ: { q: string; a: string[] }[] = [
  {
    q: '결제했는데 리포트가 안 보여요',
    a: [
      '리포트 생성에 실패한 경우 결과 화면에 다시 시도하기 버튼이 나옵니다. 추가 과금 없이 다시 만들어 드립니다.',
      '버튼이 보이지 않거나 세 번 시도해도 안 되면 문의하기로 알려주시기 바랍니다.',
    ],
  },
  {
    q: '태어난 시간을 모르면 결과가 부정확한가요?',
    a: [
      '태어난 시간을 모르셔도 년주, 월주, 일주 세 기둥으로 결과가 나옵니다. 강한 오행과 약한 오행도 정상적으로 산출됩니다.',
      '다만 시주가 빠지면 오행 분포가 조금 달라집니다. 나중에 시간을 알게 되시면 내 정보 수정에서 입력하실 수 있습니다.',
    ],
  },
  {
    q: '환불이 되나요?',
    a: [
      '리포트 생성에 실패했거나, 중복 결제되었거나, 서비스 오류로 열람이 안 되는 경우 환불해 드립니다.',
      '리포트를 정상적으로 열람하신 경우에는 디지털 콘텐츠 청약철회 제한에 따라 환불이 어렵습니다.',
    ],
  },
  {
    q: '같은 시험을 다시 볼 수 있나요?',
    a: [
      '결제하신 리포트는 계정에 영구 저장되며 재열람 횟수에 제한이 없습니다. 마이페이지에서 언제든 다시 보실 수 있습니다.',
    ],
  },
  {
    q: '결과가 매일 바뀌는 이유가 뭔가요?',
    a: [
      '오늘의 운은 그날의 일진과 사용자 사주의 관계로 계산합니다. 날짜가 바뀌면 일진이 바뀌므로 값도 달라집니다.',
      '시험 당일 운은 시험 날짜로 계산하므로 바뀌지 않습니다.',
    ],
  },
  {
    q: '사주 계산은 어떤 기준인가요?',
    a: [
      '절기를 기준으로 월주를 정하고, 한국 표준시와 실제 경도 차이를 반영해 출생 시각에서 30분을 조정합니다. 밤 11시 이후 출생은 당일 기준으로 계산합니다. 서머타임 시행 기간에는 1시간을 추가 조정합니다.',
      '계산 방식에 따라 다른 곳과 결과가 다를 수 있습니다.',
    ],
  },
]

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-md pb-10">
      <SubHeader title="자주 묻는 질문" />

      <div className="space-y-card-gap px-screen pt-4">
        {FAQ.map((item) => (
          <details
            key={item.q}
            className="p-card"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <summary className="cursor-pointer text-card-title">{item.q}</summary>
            <div className="mt-3 space-y-2">
              {item.a.map((p, i) => (
                <p key={i} className="text-body" style={{ color: 'var(--text-sub)' }}>
                  {p}
                </p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </main>
  )
}
