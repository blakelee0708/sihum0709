/**
 * 링크 공유 썸네일 (PRD 21.12 og-image)
 *
 * 한글 텍스트를 생성형 AI로 이미지에 넣으면 글자가 깨지므로,
 * 캐릭터만 배치하고 텍스트는 코드로 합성합니다.
 * PRD가 허용한 next/og 동적 생성 방식이라 이미지 파일을 따로 두지 않습니다.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = '시험 보는 날, 내 기운은 어떨까? · 시험사주'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const [bold, regular, character] = await Promise.all([
    readFile(join(process.cwd(), 'app/fonts/Pretendard-Bold-subset.woff')),
    readFile(join(process.cwd(), 'app/fonts/Pretendard-Regular-subset.woff')),
    readFile(join(process.cwd(), 'public/character/hero.png')),
  ])

  const characterSrc = `data:image/png;base64,${character.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          padding: '0 80px',
          background: 'linear-gradient(135deg, #E8F0FF 0%, #FFFFFF 100%)',
          fontFamily: 'Pretendard',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={characterSrc} alt="" width={380} height={380} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: '#1A1D26',
              lineHeight: 1.3,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>시험 보는 날,</span>
            <span>내 기운은 어떨까?</span>
          </div>
          <div style={{ fontSize: 34, color: '#4470DF', fontWeight: 700 }}>
            시험사주
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Pretendard', data: bold, weight: 700, style: 'normal' },
        { name: 'Pretendard', data: regular, weight: 400, style: 'normal' },
      ],
    }
  )
}
