'use client'

/**
 * 무료 결과 공유 이미지 (PRD 9.1)
 *
 * 규격 1080 x 1920 (인스타그램 스토리).
 * 화면에는 540 x 960으로 그리고 pixelRatio 2로 캡처해 1080 x 1920을 만듭니다.
 *
 * 캐릭터가 1종이므로 사용자 간 구분은 배경색, 유형 뱃지, 한 줄 요약이 담당합니다.
 */

import { forwardRef } from 'react'

import { getShareGradient, type CharacterStage, type TypeBadge } from '@/lib/content/characters'

export interface ShareCardData {
  name?: string | null
  examName: string
  dday: number
  examDayScore: number
  luckyNumber: number
  luckyColor: string
  luckyDirection: string
  character: CharacterStage
  badge: TypeBadge
  /** 한 줄 요약 — 유형 성격 */
  summary: string
}

const ShareCard = forwardRef<HTMLDivElement, { data: ShareCardData }>(
  function ShareCard({ data }, ref) {
    return (
      <div
        ref={ref}
        style={{
          width: 540,
          height: 960,
          background: getShareGradient(data.badge.element),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '56px 40px',
          boxSizing: 'border-box',
          color: 'var(--text)',
          fontFamily: "'PretendardCapture', var(--font-pretendard), sans-serif",
        }}
      >
        {/*
          next/image를 쓰지 않습니다. 이 카드는 화면 밖(left: -9999px)에 있어
          lazy 로딩이 걸리면 이미지가 끝내 로드되지 않고, html-to-image가
          그 상태로 멈춥니다. 원본 PNG를 같은 도메인에서 바로 받습니다 (PRD 9.3).
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.character.file}
          alt=""
          width={280}
          height={280}
          loading="eager"
          decoding="sync"
          style={{ objectFit: 'contain' }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '14px 22px',
            backgroundColor: `${data.badge.color}1A`,
            border: `1px solid ${data.badge.color}`,
            borderRadius: 20,
            color: data.badge.color,
          }}
        >
          <span style={{ fontSize: 32 }}>{data.badge.icon}</span>
          <span style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
            {data.badge.name}
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 22, fontWeight: 600 }}>
            {data.name ? `${data.name} · ` : ''}
            {data.examName}
          </p>
          <p style={{ fontSize: 18, marginTop: 6, color: 'var(--text-sub)' }}>
            D-{data.dday}
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, color: 'var(--text-sub)' }}>시험 당일 운</p>
          <p style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.2 }}>
            {data.examDayScore}
          </p>
        </div>

        <p style={{ fontSize: 18, color: 'var(--text-sub)' }}>
          숫자 {data.luckyNumber} · 색 {data.luckyColor} · 방위 {data.luckyDirection}
        </p>

        <p
          style={{
            fontSize: 20,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          &ldquo;{data.summary}&rdquo;
        </p>

        <p style={{ fontSize: 16, color: 'var(--text-sub)' }}>siheomsaju.com</p>
      </div>
    )
  }
)

export default ShareCard
