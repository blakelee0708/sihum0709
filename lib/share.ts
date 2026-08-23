/**
 * 공유 이미지 생성 (PRD 9.3)
 *
 * 주의사항
 *   - 웹폰트는 next/font로 self-host해야 캡처 시 깨지지 않습니다 (Phase 0에서 처리)
 *   - 캐릭터 PNG는 같은 도메인에서 서빙해야 CORS 오류가 나지 않습니다
 *   - iOS 사파리는 프로그래매틱 다운로드가 동작하지 않으므로
 *     이미지를 표시하고 "길게 눌러 저장하세요"를 안내합니다
 */

import { toPng } from 'html-to-image'

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ 는 Mac으로 보고하므로 터치 지원 여부로 구분합니다
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/**
 * 캡처에 넣을 폰트 CSS.
 *
 * html-to-image에 맡기면 페이지에 걸린 Pretendard 4종(각 약 780KB)을 모두
 * base64로 SVG에 넣습니다. 데이터 URL이 4MB를 넘어가 느리고 잘 깨집니다.
 * 한글 subset 2종(각 약 350KB)만 직접 넣어 가볍게 만듭니다.
 */
let fontEmbedCSSCache: string | null = null

async function getFontEmbedCSS(): Promise<string> {
  if (fontEmbedCSSCache !== null) return fontEmbedCSSCache

  const weights: [number, string][] = [
    [400, '/fonts/Pretendard-Regular-subset.woff'],
    [700, '/fonts/Pretendard-Bold-subset.woff'],
  ]

  try {
    const faces = await Promise.all(
      weights.map(async ([weight, url]) => {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`font ${url} ${res.status}`)
        const buf = await res.arrayBuffer()
        const base64 = arrayBufferToBase64(buf)
        return [
          '@font-face{',
          "font-family:'PretendardCapture';",
          `font-weight:${weight};`,
          'font-style:normal;',
          `src:url(data:font/woff;base64,${base64}) format('woff');`,
          '}',
        ].join('')
      })
    )
    fontEmbedCSSCache = faces.join('')
  } catch {
    // 폰트를 못 받아도 캡처는 진행합니다. 기본 고딕으로 그려집니다
    fontEmbedCSSCache = ''
  }

  return fontEmbedCSSCache
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export interface ShareResult {
  dataUrl: string
  /** true면 다운로드가 되지 않아 화면에 띄우고 길게 눌러 저장하도록 안내해야 합니다 */
  needsManualSave: boolean
}

/**
 * 노드를 PNG로 캡처합니다.
 * 노드를 540 폭으로 그리고 pixelRatio 2를 쓰면 1080 폭이 나옵니다.
 */
export async function captureNode(
  node: HTMLElement,
  fileName: string
): Promise<ShareResult> {
  const fontEmbedCSS = await getFontEmbedCSS()

  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
    fontEmbedCSS,
  })

  if (isIOS()) {
    return { dataUrl, needsManualSave: true }
  }

  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  link.click()

  return { dataUrl, needsManualSave: false }
}
