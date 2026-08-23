'use client'

/**
 * 홈 로그인 상태 개인화 블록 (PRD 14.5)
 *
 * 오늘의 운이 매일 바뀌므로 이 블록이 재방문 요인이 됩니다.
 * 입력을 다시 할 필요가 없어집니다.
 *
 * 비로그인이거나 조회 기록이 없으면 아무것도 그리지 않고,
 * 홈은 랜딩만 보여줍니다.
 */

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { CHARACTER_NAME } from '@/lib/content/characters'
import { getCharacter } from '@/lib/content/characters'

export interface HomeQuery {
  queryId: string
  examName: string
  examType: string
  dday: number
  todayScore: number
}

export interface HomeSummary {
  name: string | null
  queries: HomeQuery[]
}

function formatToday(): string {
  const d = new Date()
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function UserBlock() {
  const [summary, setSummary] = useState<HomeSummary | null>(null)

  useEffect(() => {
    let alive = true

    fetch('/api/home')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: HomeSummary | null) => {
        if (alive && data && data.queries.length > 0) setSummary(data)
      })
      .catch(() => {
        // 비로그인이거나 Supabase 미설정 상태입니다. 랜딩만 보여줍니다
      })

    return () => {
      alive = false
    }
  }, [])

  if (!summary) return null

  const [first, ...rest] = summary.queries
  const character = getCharacter(first.todayScore)

  return (
    <section className="px-screen pt-4">
      <p className="text-headline">
        {summary.name ? `안녕하세요, ${summary.name}님` : '안녕하세요'}
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
        <div className="flex items-center gap-3">
          <Image
            src={character.file}
            alt={character.alt}
            width={64}
            height={64}
            className="h-16 w-16 object-contain"
          />
          <div>
            <p className="text-card-title">
              {first.examType === '면접' ? '면접' : '시험'}까지 {first.dday}일
              <br />
              남았어요!
            </p>
          </div>
        </div>

        <p className="mt-3 text-body">{first.examName}</p>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-body" style={{ color: 'var(--text-sub)' }}>
            오늘의 운
          </span>
          <span className="flex items-center gap-3">
            <strong className="text-score" style={{ color: 'var(--score-mid)' }}>
              {first.todayScore}
            </strong>
            <Link
              href={`/result?q=${first.queryId}`}
              className="text-label"
              style={{ color: 'var(--primary)' }}
            >
              보러가기
            </Link>
          </span>
        </div>
      </div>

      {rest.map((q) => (
        <Link
          key={q.queryId}
          href={`/result?q=${q.queryId}`}
          className="mt-card-gap block p-card"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <p className="text-card-title">{q.examName}</p>
          <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
            D-{q.dday} · 오늘의 운 {q.todayScore}
          </p>
        </Link>
      ))}

      <p className="sr-only">{CHARACTER_NAME}가 안내하는 오늘의 운입니다.</p>
    </section>
  )
}
