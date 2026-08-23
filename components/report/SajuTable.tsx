/** 명식 표 (PRD 8.3 섹션 1) */

import type { Saju } from '@/lib/saju/calculate'

export default function SajuTable({ saju }: { saju: Saju }) {
  const cols: { label: string; pillar: { name: string; hanja: string } | null }[] = [
    { label: '년주', pillar: saju.year },
    { label: '월주', pillar: saju.month },
    { label: '일주', pillar: saju.day },
    { label: '시주', pillar: saju.hour },
  ]

  return (
    <div>
      <div
        className="grid grid-cols-4 overflow-hidden text-center"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-button)',
        }}
      >
        {cols.map((c, i) => (
          <div
            key={c.label}
            className="py-3"
            style={{ borderLeft: i === 0 ? undefined : '1px solid var(--border)' }}
          >
            <p className="text-label" style={{ color: 'var(--text-sub)' }}>
              {c.label}
            </p>
            {c.pillar ? (
              <>
                <p className="mt-1 text-card-title">{c.pillar.name}</p>
                <p className="text-label" style={{ color: 'var(--text-sub)' }}>
                  {c.pillar.hanja}
                </p>
              </>
            ) : (
              <p className="mt-1 text-body" style={{ color: 'var(--text-sub)' }}>
                —
              </p>
            )}
          </div>
        ))}
      </div>

      {!saju.hasBirthTime && (
        <p className="mt-2 text-label" style={{ color: 'var(--text-sub)' }}>
          태어난 시간을 입력하지 않아 세 기둥으로 계산했습니다.
        </p>
      )}
    </div>
  )
}
