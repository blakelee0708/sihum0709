/** 관리자 목록 카드 공통 껍데기 */

export default function AdminCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-card"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border)',
      }}
    >
      {children}
    </div>
  )
}

export function AdminEmpty({ message }: { message: string }) {
  return (
    <p
      className="p-card text-body"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        color: 'var(--text-sub)',
      }}
    >
      {message}
    </p>
  )
}
