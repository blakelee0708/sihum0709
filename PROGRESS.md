# 시험사주 개발 진행 상황

작업 시작 2026-08-24 · Phase 0 ~ Phase 6 연속 진행

---

## 아침에 볼 것

작업이 끝나면 이 섹션을 채웁니다. (진행 중)

---

## 진행 로그

### Phase 0 초기화 — 완료

- Next.js 15 (App Router) + TypeScript + Tailwind 스캐폴딩
- PRD 16장 폴더 구조 전체 생성
- Pretendard를 next/font/local로 self-host (400/500/600/700 4종, `app/fonts/`)
- PRD 21.2 색상 토큰 + 21.4 레이아웃 토큰 → `styles/tokens.css`
- PRD 21.3 타이포 + 21.2 색상 → `tailwind.config.ts`
- 설치: lucide-react, framer-motion, html-to-image, @tanstack/react-table, recharts, date-fns
  (추가: @supabase/ssr, @supabase/supabase-js, vitest, pretendard, sharp)
- Supabase 클라이언트 `lib/supabase/client.ts`, `server.ts`, `config.ts`
  - 키가 비어 있으면 `isSupabaseConfigured=false`로 목업 모드 분기 (규칙 1)
- `.env.example` 작성
- 루트 JSON 3개 → `lib/content/` 이동
- `vercel.json` 리전 icn1 (PRD 15장)

#### 이미지 정리 (PRD 21.12 매핑)

원본 `image/` 파일명이 PRD와 달라 아래처럼 매핑했습니다.

| 원본 | → PRD 파일명 | 처리 |
|---|---|---|
| `image/chr-01.png` | `public/character/char-01.png` | 1024x1024 contain, 투명 유지 |
| `image/chr-02.png` | `public/character/char-02.png` | 원본이 1024x1536 세로라 contain으로 정사각 변환 |
| `image/chr-03.png` | `public/character/char-03.png` | 1024x1024 |
| `image/chr-04.png` | `public/character/char-04.png` | 1024x1024 |
| `image/chr-05.png` | `public/character/char-05.png` | 1024x1024 |
| `image/hero.png` | `public/character/hero.png` | 원본이 447x558로 작아 업스케일 |

원본 표정이 PRD 7.2 단계와 정확히 일치합니다 (chr-01 = 주먹 파이팅, chr-03 = 중립, chr-05 = 만세 + 초승달 눈 + 반짝임).

없던 파일 처리 — **단색 SVG 플레이스홀더 대신 실제 크롭으로 생성했습니다.** PRD 21.12가 "char-profile 크롭"으로 명시하고 있어, 빈 원형보다 규격을 충족하는 실물이 낫다고 판단했습니다.

| 파일 | 생성 방법 |
|---|---|
| `public/character/char-profile.png` | char-03에서 얼굴 영역 크롭 → 512x512 (뿔 포함, 원형 크롭 전제) |
| `public/icon-512.png` | char-profile 그대로, 투명 배경 |
| `public/apple-icon.png` | char-profile 180x180 + 배경 #E8F0FF (iOS 투명 대응) |
| `og-image.png` | **미생성.** PRD 21.12가 next/og 동적 생성을 허용하므로 Phase 4에서 처리 |

#### 검증

- `npx tsc --noEmit` 통과 (0건)
- `npm run build` 성공
