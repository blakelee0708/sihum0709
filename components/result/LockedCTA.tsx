'use client'

/**
 * 전체 잠금 목록과 결제 유도 CTA (PRD 3.4, 14.9)
 *
 * 무료 카드 뒤에 제목과 한 줄 설명으로 나열합니다. 이 목록이 상품 설명
 * 역할을 합니다. 필기 9개, 면접 10개입니다.
 *
 * 실기와 오디션은 1차 출시에서 유료 상품이 없으므로 준비 중 안내와
 * 알림 받기를 노출합니다 (PRD 8.2).
 */

import { MotionLink, useTap } from '@/components/motion/Pressable'
import { Lock } from 'lucide-react'

import type { ExamType } from '@/lib/saju/constants'
import { track } from '@/lib/analytics'
import WaitlistForm from './WaitlistForm'

interface LockedItem {
  title: string
  desc: string
}

interface LockedSpec {
  heading: string
  items: LockedItem[]
}

const LOCKED: Record<'필기' | '면접', LockedSpec> = {
  필기: {
    heading: '유료 리포트에서만 볼 수 있어요',
    items: [
      { title: '잠재력 발휘 지수', desc: '실력 대비 몇 퍼센트가 나오는 날인지' },
      { title: '내 사주가 말하는 시험 패턴', desc: '십신으로 본 반복되는 패턴' },
      { title: '놓치기 쉬운 3가지', desc: '사주에서 나오는 취약점' },
      { title: '시험 전날 상세 타임라인', desc: '18시부터 취침까지 시간 단위로' },
      { title: '남은 기간 어떻게 쓸까', desc: '남은 날짜를 어떻게 배분할지' },
      { title: '좌석과 방위', desc: '어느 자리에 앉아야 하는지' },
      { title: '이 기간 피해야 할 것', desc: '먹는 것, 만나는 사람, 하지 말 것' },
      { title: '2026년 시험운 캘린더', desc: '올해 어느 달이 유리한지' },
      { title: '내 사주로 본 시험 전략', desc: '어떤 시험을 봐도 반복되는 패턴' },
    ],
  },
  면접: {
    // 기업명 입력이 결제 트리거임을 헤더에서 명확히 합니다 (PRD 3.4)
    heading: '실제 면접 보는 기업을 알려주시면',
    items: [
      { title: '기업 설립일로 본 궁합', desc: '기업 사주와 내 사주의 관계' },
      { title: '이 직무와 나', desc: '직무 성격과 오행이 맞는 지점' },
      { title: '들어올 가능성이 높은 질문', desc: '약한 오행에서 역산한 질문 유형' },
      { title: '잠재력 발휘 지수', desc: '실력 대비 몇 퍼센트가 나오는 날인지' },
      { title: '내 사주가 말하는 면접 패턴', desc: '십신으로 본 반복되는 패턴' },
      { title: '내가 조심해야 할 3가지', desc: '사주에서 나오는 취약점' },
      { title: '복장과 소지품', desc: '어떤 색을 어디에 넣어야 하는지' },
      { title: '면접 전날 상세 타임라인', desc: '저녁부터 취침까지 시간 단위로' },
      { title: '2026년 면접운 캘린더', desc: '올해 어느 달이 유리한지' },
      { title: '내 사주로 본 면접 전략', desc: '어떤 면접을 봐도 반복되는 패턴' },
    ],
  },
}

export const PRICE = 3900

interface Props {
  examType: ExamType
  /** 결제 흐름 진입 경로 */
  href: string
  /** 시험명. 알림 신청과 계측에 함께 남깁니다 */
  examName: string
  /** 강한 오행. 유형별 결제율 산출용 (PRD 22.12) */
  strongElement?: string
  /** D-day 구간. 구간별 결제율 산출용 (PRD 22.12) */
  ddayRange?: string
}

export default function LockedCTA({
  examType,
  href,
  examName,
  strongElement,
  ddayRange,
}: Props) {
  // 훅은 아래 조건부 return보다 먼저 불러야 합니다
  const tap = useTap()

  if (examType === '실기' || examType === '오디션') {
    return (
      <section className="px-screen pt-section">
        <div
          className="p-card text-center"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <p className="text-body">실기와 오디션 상세 리포트는 준비 중입니다.</p>
          <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
            준비되면 메일로 알려드릴게요.
          </p>

          <WaitlistForm
            reason="practical"
            examName={examName}
            examType={examType}
          />
        </div>
      </section>
    )
  }

  const spec = LOCKED[examType]

  return (
    <section className="px-screen pt-section">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
        <h2 className="text-label" style={{ color: 'var(--text-sub)' }}>
          {spec.heading}
        </h2>
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>

      <div
        className="mt-3 p-card"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <ul className="space-y-3">
          {spec.items.map((item) => (
            <li key={item.title} className="flex items-start gap-2">
              <Lock
                size={16}
                aria-hidden
                className="mt-1 shrink-0"
                style={{ color: 'var(--primary)' }}
              />
              <div>
                <p className="text-body font-semibold">{item.title}</p>
                <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <MotionLink
          whileTap={tap}
          href={href}
          onClick={() =>
            track('paid_cta_click', {
              examType,
              strongElement,
              ddayRange,
              priceShown: PRICE,
            })
          }
          className="mt-5 flex min-h-[52px] w-full items-center justify-center text-body font-semibold text-white"
          style={{
            background: 'var(--button)',
            borderRadius: 'var(--radius-button)',
            boxShadow: 'var(--shadow-button)',
          }}
        >
          {PRICE.toLocaleString()}원으로 전체 보기
        </MotionLink>
      </div>
    </section>
  )
}
