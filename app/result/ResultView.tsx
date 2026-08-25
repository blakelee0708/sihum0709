'use client'

/**
 * 무료 결과 (PRD 3.2, 14.9)
 *
 * 로그인 없이 즉시 응답합니다. AI 호출도 검색 호출도 없고,
 * 문장 조각 조립과 계산만으로 만들어집니다.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, Share2, UserPlus } from 'lucide-react'

import CharacterDisplay from '@/components/result/CharacterDisplay'
import LockedCTA from '@/components/result/LockedCTA'
import MethodFitChart from '@/components/result/MethodFitChart'
import ResultCard from '@/components/result/ResultCard'
import ShareCard, { type ShareCardData } from '@/components/result/ShareCard'
import TypeModal from '@/components/result/TypeModal'
import TypeShareCard from '@/components/result/TypeShareCard'
import WeekFlowChart from '@/components/result/WeekFlowChart'
import Disclaimer from '@/components/layout/Disclaimer'

import {
  BIRTH_TIME_NOTICE,
  START_TIME_UNKNOWN_NOTICE,
  buildFreeResult,
  type FreeResult,
  type UserInput,
} from '@/lib/content/assemble'
import { SESSION_KEY, resetFrom, type Answers, toUserInput } from '@/lib/content/chat-flow'
import { captureNode } from '@/lib/share'
import { track } from '@/lib/analytics'

interface Props {
  /** 저장된 조회를 여는 경우 서버에서 넘겨받은 입력 */
  serverInput?: UserInput | null
  queryId?: string | null
}

export default function ResultView({ serverInput = null, queryId = null }: Props) {
  const router = useRouter()

  const [result, setResult] = useState<FreeResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    serverInput ? 'saved' : 'idle'
  )

  const shareRef = useRef<HTMLDivElement>(null)
  const typeShareRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (serverInput) {
      setResult(buildFreeResult(serverInput))
      return
    }

    // 대화에서 넘어온 경우 sessionStorage에서 읽습니다
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (!saved) {
        setNotFound(true)
        return
      }
      const parsed = JSON.parse(saved) as { answers?: Answers }
      if (!parsed.answers?.examDate || !parsed.answers?.birthDate) {
        setNotFound(true)
        return
      }
      setResult(buildFreeResult(toUserInput(parsed.answers)))
    } catch {
      setNotFound(true)
    }
  }, [serverInput])

  // 결과 도달 — 입력 완주율과 방식별 분포의 기준점입니다
  useEffect(() => {
    if (!result) return
    track('result_viewed', {
      examType: result.input.examType,
      strongElement: result.profile.strong,
      ddayRange: result.ddayRange,
    })
  }, [result])

  // 로그인 후 ?save=1 로 돌아온 경우 바로 저장합니다
  useEffect(() => {
    if (!result || saveState !== 'idle') return
    if (typeof window === 'undefined') return
    if (!new URLSearchParams(window.location.search).has('save')) return

    setSaveState('saving')
    fetch('/api/queries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.input),
    })
      .then((res) => setSaveState(res.ok ? 'saved' : 'idle'))
      .catch(() => setSaveState('idle'))
  }, [result, saveState])

  if (notFound) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-screen text-center">
        <p className="text-body">입력한 내용을 찾지 못했어요.</p>
        <Link
          href="/start"
          className="flex min-h-[48px] w-full items-center justify-center text-body font-semibold text-white"
          style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
        >
          다시 시작하기
        </Link>
      </main>
    )
  }

  if (!result) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md items-center justify-center">
        <p className="text-body" style={{ color: 'var(--text-sub)' }}>
          결과를 준비하고 있어요
        </p>
      </main>
    )
  }

  const shareData: ShareCardData = {
    name: result.input.name,
    examName: result.input.examName,
    dday: result.dday,
    examDayScore: result.examDayScore,
    luckyNumber: result.luckyNumber,
    luckyColor: result.luckyColor,
    luckyDirection: result.luckyDirection,
    character: result.character,
    badge: result.badge,
    summary: result.badge.trait,
  }

  async function handleShare() {
    if (!shareRef.current) return
    track('share_clicked', { examType: result!.input.examType })
    const { needsManualSave, dataUrl } = await captureNode(
      shareRef.current,
      `시험사주_${result!.input.name ?? '결과'}.png`
    )
    if (needsManualSave) setPreviewImage(dataUrl)
  }

  async function handleTypeShare() {
    if (!typeShareRef.current) return
    track('type_share_clicked', { strongElement: result!.badge.element })
    const { needsManualSave, dataUrl } = await captureNode(
      typeShareRef.current,
      `시험사주_${result!.badge.name}.png`
    )
    setModalOpen(false)
    if (needsManualSave) setPreviewImage(dataUrl)
  }

  /**
   * 내 결과 저장하기 (PRD 11.2)
   *
   * 로그인 상태면 바로 저장하고, 아니면 로그인 후 이 화면으로 돌아와 저장합니다.
   */
  async function handleSave() {
    if (!result) return
    track('save_clicked', { examType: result.input.examType })
    setSaveState('saving')

    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.input),
      })

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent('/result?save=1')}`)
        return
      }
      if (!res.ok) {
        setSaveState('idle')
        return
      }
      setSaveState('saved')
    } catch {
      setSaveState('idle')
    }
  }

  /** 시간 미입력 사용자를 태어난 시간 단계로 되돌립니다 (PRD 4.3.3) */
  function reenterBirthTime() {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      const parsed = saved ? (JSON.parse(saved) as { answers?: Answers }) : {}
      const answers = resetFrom(parsed.answers ?? {}, 'birthTime')
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ answers }))
    } catch {
      // 세션이 없으면 처음부터 시작합니다
    }
    router.push('/start')
  }

  // 면접은 기업명을 먼저 받고(PRD 14.10), 필기는 바로 결제로 갑니다
  const paidHref =
    result.input.examType === '면접'
      ? `/start/paid${queryId ? `?q=${queryId}` : ''}`
      : `/checkout${queryId ? `?q=${queryId}` : ''}`

  return (
    <main className="mx-auto max-w-md pb-6">
      <CharacterDisplay
        name={result.input.name}
        examName={result.input.examName}
        examType={result.input.examType}
        dday={result.dday}
        character={result.character}
        badge={result.badge}
        speechBubble={result.speechBubble}
        examDayScore={result.examDayScore}
        todayScore={result.todayScore}
        onBadgeClick={() => setModalOpen(true)}
      />

      <div className="mt-section space-y-card-gap px-screen">
        {result.cards.map((card) => {
          if (card.kind === 'weekFlow') {
            return (
              <ResultCard key={card.id} title={card.title}>
                <WeekFlowChart data={result.weekFlow} />
              </ResultCard>
            )
          }
          if (card.kind === 'methodFit') {
            return (
              <ResultCard key={card.id} title={card.title}>
                <MethodFitChart fit={result.methodFit} examType={result.input.examType} />
              </ResultCard>
            )
          }
          return (
            <ResultCard key={card.id} title={card.title} paragraphs={card.paragraphs} />
          )
        })}

        {/* 시작 시간을 모르면 카드 8 대신 안내를 둡니다 (PRD 6.5) */}
        {!result.startTime && (
          <div
            className="flex items-start gap-2 p-card"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <Clock size={18} aria-hidden style={{ color: 'var(--primary)' }} />
            <p className="text-body" style={{ color: 'var(--text-sub)' }}>
              {START_TIME_UNKNOWN_NOTICE[0]}
              <br />
              {START_TIME_UNKNOWN_NOTICE[1]}
            </p>
          </div>
        )}

        {/* 태어난 시간 미입력 안내 (PRD 4.3.3) */}
        {result.showBirthTimeNotice && (
          <div
            className="p-card"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <p className="text-body" style={{ color: 'var(--text-sub)' }}>
              {BIRTH_TIME_NOTICE}
            </p>
            <button
              type="button"
              onClick={reenterBirthTime}
              className="mt-3 min-h-[44px] w-full text-body"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                color: 'var(--primary)',
              }}
            >
              시간 입력하기
            </button>
          </div>
        )}
      </div>

      {/* 공유 / 저장 */}
      <section className="mt-section space-y-2 px-screen">
        <button
          type="button"
          onClick={handleShare}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 text-body font-semibold"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            color: 'var(--text)',
          }}
        >
          <Share2 size={18} aria-hidden />
          친구에게 공유
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === 'saving' || saveState === 'saved'}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 text-body font-semibold disabled:opacity-60"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            color: 'var(--text)',
          }}
        >
          <UserPlus size={18} aria-hidden />
          {saveState === 'saved'
            ? '저장했어요'
            : saveState === 'saving'
              ? '저장하는 중'
              : '내 결과 저장하기'}
        </button>

        {saveState === 'saved' && (
          <Link
            href="/my"
            className="block text-center text-label"
            style={{ color: 'var(--primary)' }}
          >
            마이페이지에서 보기
          </Link>
        )}
      </section>

      <LockedCTA
        examType={result.input.examType}
        href={paidHref}
        examName={result.input.examName}
        strongElement={result.profile.strong}
        ddayRange={result.ddayRange}
      />

      <Disclaimer />

      {modalOpen && (
        <TypeModal
          badge={result.badge}
          description={result.typeDescription}
          onClose={() => setModalOpen(false)}
          onShare={handleTypeShare}
        />
      )}

      {/* iOS는 프로그래매틱 다운로드가 막혀 있어 이미지를 띄웁니다 (PRD 9.3) */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-6"
          style={{ background: 'rgba(26, 29, 38, 0.8)' }}
          onClick={() => setPreviewImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="공유 이미지"
            className="max-h-[70vh] w-auto"
            style={{ borderRadius: 12 }}
          />
          <p className="text-body text-white">길게 눌러 저장하세요</p>
        </div>
      )}

      {/* 캡처 전용 — 화면 밖에 그립니다 */}
      <div
        aria-hidden
        style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}
      >
        <ShareCard ref={shareRef} data={shareData} />
        <TypeShareCard ref={typeShareRef} badge={result.badge} />
      </div>
    </main>
  )
}
