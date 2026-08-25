/**
 * 회원 관리 (PRD 22.9)
 *
 * 상세에서 해당 사용자의 조회 이력, 결제 이력, 문의 이력을 함께 표시합니다.
 * 관리자에 의한 삭제는 자발적 탈퇴와 동일하게 처리합니다 (PRD 11.6).
 */

import ActionButton from '@/components/admin/ActionButton'
import AdminCard, { AdminEmpty } from '@/components/admin/AdminCard'
import { adminDb } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

interface ProfileRow {
  id: string
  name: string | null
  birth_date: string | null
  created_at: string
}

function fmt(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const keyword = (q ?? '').trim()

  const db = adminDb()

  // auth.users에 이메일이 있으므로 관리자 API로 함께 가져옵니다
  const { data: authList } = await db.auth.admin.listUsers({ page: 1, perPage: 200 })
  const emailById = new Map((authList?.users ?? []).map((u) => [u.id, u.email ?? '']))
  const providerById = new Map(
    (authList?.users ?? []).map((u) => [u.id, (u.app_metadata?.provider as string) ?? 'email'])
  )

  let profileQuery = db
    .from('profiles')
    .select('id, name, birth_date, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (keyword) {
    // 이메일 검색은 auth 쪽에서 걸러 id로 좁힙니다
    const matchedIds = [...emailById.entries()]
      .filter(([id, email]) => email.includes(keyword) || id.startsWith(keyword))
      .map(([id]) => id)

    if (matchedIds.length > 0) {
      profileQuery = profileQuery.in('id', matchedIds)
    } else {
      profileQuery = profileQuery.ilike('name', `%${keyword}%`)
    }
  }

  const { data: rows } = await profileQuery
  const profiles = (rows ?? []) as ProfileRow[]

  // 사용자별 조회/결제 건수
  const ids = profiles.map((p) => p.id)
  const [{ data: queries }, { data: payments }] = await Promise.all([
    ids.length
      ? db.from('queries').select('user_id').in('user_id', ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? db.from('payments').select('user_id, is_granted').in('user_id', ids)
      : Promise.resolve({ data: [] }),
  ])

  const queryCount = new Map<string, number>()
  for (const r of queries ?? []) {
    const id = r.user_id as string
    queryCount.set(id, (queryCount.get(id) ?? 0) + 1)
  }

  const payCount = new Map<string, number>()
  for (const r of payments ?? []) {
    if (r.is_granted) continue
    const id = r.user_id as string
    payCount.set(id, (payCount.get(id) ?? 0) + 1)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-headline">회원 관리</h1>

      <form method="get" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={keyword}
          placeholder="이메일 또는 이름"
          className="min-h-[36px] flex-1 px-3 text-label"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            color: 'var(--text)',
          }}
        />
        <button
          type="submit"
          className="min-h-[36px] px-4 text-label text-white"
          style={{ background: 'var(--button)', borderRadius: 'var(--radius-button)' }}
        >
          검색
        </button>
      </form>

      {profiles.length === 0 ? (
        <AdminEmpty message="해당하는 회원이 없습니다." />
      ) : (
        <ul className="space-y-card-gap">
          {profiles.map((p) => (
            <li key={p.id}>
              <AdminCard>
                <p className="text-body">{p.name ?? '이름 없음'}</p>
                <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                  {emailById.get(p.id) ?? p.id.slice(0, 8)}
                </p>
                <p className="mt-1 text-label" style={{ color: 'var(--text-sub)' }}>
                  {providerById.get(p.id) === 'kakao'
                    ? '카카오'
                    : providerById.get(p.id) === 'google'
                      ? '구글'
                      : '이메일'}{' '}
                  · {fmt(p.created_at)} 가입
                  {p.birth_date && ` · 생년월일 ${p.birth_date}`}
                </p>
                <p className="mt-1 text-body">
                  조회 {queryCount.get(p.id) ?? 0}회 · 결제 {payCount.get(p.id) ?? 0}건
                </p>

                <div className="mt-3">
                  <ActionButton
                    label="회원 삭제"
                    endpoint={`/api/admin/user/${p.id}`}
                    method="DELETE"
                    confirm="저장된 결과와 리포트가 모두 삭제되며 복구할 수 없습니다. 결제 이력은 식별 정보만 제거하고 보존됩니다."
                    variant="danger"
                  />
                </div>
              </AdminCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
