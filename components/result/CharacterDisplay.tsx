'use client'

/**
 * 상단 요약 — 캐릭터, 말풍선, 뱃지, 점수 3개 (PRD 7.6, 3.2, 8.7)
 *
 * 캐릭터는 왼쪽, 뱃지는 오른쪽에 배치합니다.
 * 말풍선은 캐릭터 상단에 CSS로 겹칩니다. 문구가 D-day에 따라 바뀌므로
 * 이미지에 넣지 않습니다.
 */

import Image from 'next/image'

import type { CharacterStage, TypeBadge } from '@/lib/content/characters'
import TypeBadgeView from './TypeBadge'
import ScorePair from './ScorePair'

interface Props {
  name?: string | null
  examName: string
  examType: string
  dday: number
  character: CharacterStage
  badge: TypeBadge
  speechBubble: string
  examDayScore: number
  todayScore: number
  /** PRD 8.7 잠재력 발휘 지수 */
  potentialScore: number
  /** 무료 결과에서는 숫자를 가립니다 (PRD 3.2) */
  potentialLocked?: boolean
  onBadgeClick: () => void
}

function formatToday(): string {
  const d = new Date()
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function CharacterDisplay({
  name,
  examName,
  examType,
  dday,
  character,
  badge,
  speechBubble,
  examDayScore,
  todayScore,
  potentialScore,
  potentialLocked = false,
  onBadgeClick,
}: Props) {
  return (
    <section className="px-screen pt-4">
      <p className="text-headline">
        {name ? `안녕하세요, ${name}님` : '안녕하세요'}
      </p>
      <p className="text-label" style={{ color: 'var(--text-sub)' }}>
        {formatToday()}
      </p>

      <div
        className="mt-3 p-card"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* 말풍선 — 캐릭터 위에 겹칩니다 */}
        <div
          className="relative z-10 mx-auto mb-[-8px] w-fit max-w-full px-3 py-2 text-chat"
          style={{
            background: 'var(--bg)',
            borderRadius: 'var(--radius-chip)',
            color: 'var(--text)',
          }}
        >
          {speechBubble}
        </div>

        <div className="flex items-center gap-3">
          <Image
            src={character.file}
            alt={character.alt}
            width={220}
            height={220}
            priority
            className="h-[140px] w-[140px] shrink-0 object-contain sm:h-[160px] sm:w-[160px]"
          />
          <div className="ml-auto">
            <TypeBadgeView badge={badge} onClick={onBadgeClick} />
          </div>
        </div>

        <div className="mt-2">
          <p className="text-body">{examName}</p>
          <p className="text-label" style={{ color: 'var(--text-sub)' }}>
            {examType} · {dday >= 0 ? `D-${dday}` : `D+${Math.abs(dday)}`}
          </p>
        </div>

        <ScorePair
          examDayScore={examDayScore}
          todayScore={todayScore}
          examType={examType}
          potentialScore={potentialScore}
          potentialLocked={potentialLocked}
        />
      </div>
    </section>
  )
}
