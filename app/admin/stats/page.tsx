/**
 * 지표 (PRD 22.12, 19장)
 *
 * events 테이블에 쌓인 이벤트로 검증 지표를 계산합니다.
 *
 * PRD 19장이 4번(CTA 클릭률)과 5번(결제 전환율)을 분리해서 보라고 한 이유는,
 * CTA 클릭이 낮으면 무료 결과 품질이나 문구 문제이고, CTA는 높은데 결제가
 * 낮으면 가격이나 결제 흐름 문제이기 때문입니다.
 */

import AdminCard, { AdminEmpty } from '@/components/admin/AdminCard'
import StatCard from '@/components/admin/StatCard'
import { adminDb } from '@/lib/admin/auth'
import { TYPE_BADGES } from '@/lib/content/characters'
import { ELEMENTS } from '@/lib/saju/constants'

export const dynamic = 'force-dynamic'

/** 대화 단계 순서. 단계별 이탈 지점을 보기 위한 것입니다 */
const STEP_ORDER = [
  ['category', '대분류'],
  ['examName', '시험명'],
  ['examType', '방식'],
  ['companyScale', '기업 규모'],
  ['workType', '일의 성격'],
  ['jobTitle', '직무명'],
  ['examDate', '시험 날짜'],
  ['startTime', '시작 시간'],
  ['birthDate', '생년월일'],
  ['birthTime', '태어난 시간'],
  ['name', '이름'],
] as const

interface EventRow {
  name: string
  props: Record<string, string | number> | null
  session_id: string | null
}

function pct(a: number, b: number): string {
  if (b === 0) return '—'
  return `${((a / b) * 100).toFixed(1)}%`
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const { days } = await searchParams
  const range = Number(days) > 0 ? Number(days) : 30

  const since = new Date()
  since.setDate(since.getDate() - range)

  const db = adminDb()

  const { data: rows } = await db
    .from('events')
    .select('name, props, session_id')
    .gte('created_at', since.toISOString())
    .limit(50000)

  const events = (rows ?? []) as EventRow[]

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-headline">지표</h1>
        <AdminEmpty message="아직 쌓인 이벤트가 없습니다. 사용자가 화면을 이용하면 여기에 나타납니다." />
      </div>
    )
  }

  const count = (name: string) => events.filter((e) => e.name === name).length

  /** 세션 단위 도달 수 — 같은 사람이 여러 번 눌러도 1로 셉니다 */
  const sessions = (name: string) =>
    new Set(events.filter((e) => e.name === name && e.session_id).map((e) => e.session_id)).size

  const landingClicks = sessions('landing_cta_click')
  const chatStarted = new Set(
    events
      .filter((e) => e.name === 'chat_step_answered' && e.props?.step === 'category')
      .map((e) => e.session_id)
  ).size
  const completed = sessions('chat_completed')
  const resultViews = sessions('result_viewed')
  const shares = sessions('share_clicked') + sessions('type_share_clicked')
  const saves = sessions('save_clicked')
  const ctaClicks = sessions('paid_cta_click')
  const checkoutViews = sessions('checkout_viewed')
  const paid = count('payment_completed')

  // 단계별 도달 (이탈 지점)
  const stepReach = STEP_ORDER.map(([key, label]) => ({
    key,
    label,
    n: new Set(
      events
        .filter((e) => e.name === 'chat_step_answered' && e.props?.step === key)
        .map((e) => e.session_id)
    ).size,
  })).filter((s) => s.n > 0)

  const maxStep = Math.max(...stepReach.map((s) => s.n), 1)

  // 방식별 분포 (PRD 19장 8번)
  const byType = new Map<string, number>()
  for (const e of events) {
    if (e.name !== 'result_viewed') continue
    const t = String(e.props?.examType ?? '미상')
    byType.set(t, (byType.get(t) ?? 0) + 1)
  }

  // 유형별 분포 (PRD 22.12 — 뱃지 모달의 "전체 이용자 중 N%")
  const byElement = new Map<string, number>()
  for (const e of events) {
    if (e.name !== 'result_viewed') continue
    const el = String(e.props?.strongElement ?? '')
    if (el) byElement.set(el, (byElement.get(el) ?? 0) + 1)
  }
  const elementTotal = [...byElement.values()].reduce((a, b) => a + b, 0)

  // D-day 구간별 결제율 (PRD 22.12)
  const ctaByRange = new Map<string, number>()
  const paidByRange = new Map<string, number>()
  for (const e of events) {
    const r = String(e.props?.ddayRange ?? '')
    if (!r) continue
    if (e.name === 'paid_cta_click') ctaByRange.set(r, (ctaByRange.get(r) ?? 0) + 1)
    if (e.name === 'payment_completed') paidByRange.set(r, (paidByRange.get(r) ?? 0) + 1)
  }

  const RANGE_LABEL: Record<string, string> = {
    D30plus: 'D-30 이상',
    'D30+': 'D-30 이상',
    'D8-29': 'D-8 ~ D-29',
    'D2-7': 'D-2 ~ D-7',
    D1: 'D-1',
    D0: '시험 당일',
  }

  return (
    <div className="space-y-section">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-headline">지표</h1>
        <nav className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <a
              key={d}
              href={`/admin/stats?days=${d}`}
              className="flex min-h-[36px] items-center px-3 text-label"
              style={{
                background: range === d ? 'var(--primary)' : 'var(--surface)',
                color: range === d ? '#fff' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
              }}
            >
              {d}일
            </a>
          ))}
        </nav>
      </div>

      <section>
        <h2 className="text-card-title">전환 흐름</h2>
        <div className="mt-3 grid grid-cols-2 gap-card-gap lg:grid-cols-4">
          <StatCard label="랜딩 → 시작" value={landingClicks} sub="시작하기 클릭" />
          <StatCard
            label="입력 완주율"
            value={pct(completed, chatStarted)}
            sub={`${completed} / ${chatStarted}`}
          />
          <StatCard
            label="CTA 클릭률"
            value={pct(ctaClicks, resultViews)}
            sub={`${ctaClicks} / ${resultViews}`}
          />
          <StatCard
            label="결제 전환율"
            value={pct(paid, ctaClicks)}
            sub={`${paid} / ${ctaClicks}`}
          />
        </div>
        <p className="mt-2 text-label" style={{ color: 'var(--text-sub)' }}>
          CTA 클릭이 낮으면 무료 결과 품질이나 문구 문제이고, CTA는 높은데 결제가 낮으면
          가격이나 결제 흐름 문제입니다.
        </p>
      </section>

      <section>
        <h2 className="text-card-title">그 밖의 행동</h2>
        <div className="mt-3 grid grid-cols-2 gap-card-gap lg:grid-cols-4">
          <StatCard label="결과 도달" value={resultViews} />
          <StatCard label="공유 클릭률" value={pct(shares, resultViews)} sub={`${shares}회`} />
          <StatCard label="결과 저장" value={saves} />
          <StatCard label="결제 화면 도달" value={checkoutViews} />
        </div>
      </section>

      <section>
        <h2 className="text-card-title">단계별 이탈 지점</h2>
        <div className="mt-3">
          <AdminCard>
            <ul className="space-y-2">
              {stepReach.map((s) => (
                <li key={s.key} className="flex items-center gap-3">
                  <span
                    className="w-20 shrink-0 text-label"
                    style={{ color: 'var(--text-sub)' }}
                  >
                    {s.label}
                  </span>
                  <span
                    className="h-3 shrink-0"
                    style={{
                      width: `${(s.n / maxStep) * 55}%`,
                      background: 'var(--primary)',
                      borderRadius: 4,
                    }}
                  />
                  <span className="text-label">
                    {s.n} ({pct(s.n, maxStep)})
                  </span>
                </li>
              ))}
            </ul>
          </AdminCard>
        </div>
      </section>

      <section>
        <h2 className="text-card-title">방식별 분포</h2>
        <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
          실기 유료 상품 개발 여부를 판단하는 근거입니다.
        </p>
        <div className="mt-3">
          <AdminCard>
            {byType.size === 0 ? (
              <p className="text-body" style={{ color: 'var(--text-sub)' }}>
                아직 없습니다.
              </p>
            ) : (
              <ul className="space-y-1">
                {[...byType].map(([k, v]) => (
                  <li key={k} className="text-body">
                    {k} {v}건 ({pct(v, resultViews)})
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      </section>

      <section>
        <h2 className="text-card-title">유형별 분포</h2>
        <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
          뱃지 모달의 &ldquo;전체 이용자 중 N%&rdquo; 표시에 쓸 값입니다.
          `lib/content/characters.ts`의 `TYPE_DISTRIBUTION`에 넣고
          `SHOW_TYPE_DISTRIBUTION`을 켜면 화면에 나타납니다.
        </p>
        <div className="mt-3">
          <AdminCard>
            {elementTotal === 0 ? (
              <p className="text-body" style={{ color: 'var(--text-sub)' }}>
                아직 없습니다.
              </p>
            ) : (
              <ul className="space-y-1">
                {ELEMENTS.map((el) => {
                  const n = byElement.get(el) ?? 0
                  return (
                    <li key={el} className="text-body">
                      <span style={{ color: TYPE_BADGES[el].color }}>
                        {TYPE_BADGES[el].name}
                      </span>{' '}
                      ({el}) {n}건 · {Math.round((n / elementTotal) * 100)}%
                    </li>
                  )
                })}
              </ul>
            )}
          </AdminCard>
        </div>
      </section>

      <section>
        <h2 className="text-card-title">D-day 구간별 결제율</h2>
        <div className="mt-3">
          <AdminCard>
            {ctaByRange.size === 0 ? (
              <p className="text-body" style={{ color: 'var(--text-sub)' }}>
                아직 없습니다.
              </p>
            ) : (
              <ul className="space-y-1">
                {[...ctaByRange].map(([r, cta]) => (
                  <li key={r} className="text-body">
                    {RANGE_LABEL[r] ?? r} · CTA {cta}회 · 결제 {paidByRange.get(r) ?? 0}건 (
                    {pct(paidByRange.get(r) ?? 0, cta)})
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      </section>
    </div>
  )
}
