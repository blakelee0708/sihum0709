/** 화면 전환 중 표시. 빈 화면 대신 한 줄을 둡니다 */

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md items-center justify-center">
      <p className="text-body" style={{ color: 'var(--text-sub)' }}>
        불러오는 중이에요
      </p>
    </main>
  )
}
