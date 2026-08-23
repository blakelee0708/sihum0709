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

### Phase 1 만세력 계산 코어 — 완료

- `scripts/gen-solarterms.py` 작성 후 실행 → `lib/saju/solarterms.json` (91년, 30.7KB)
  - skyfield 1.55에는 `almanac.solar_terms`가 없어, 태양 겉보기 황경 교차 시각을
    이분법으로 직접 찾도록 구현했습니다 (1초 이내 수렴)
  - 천체력 DE421은 스크립트 첫 실행 시 자동으로 내려받습니다 (17MB, `.gitignore` 처리)
- `lib/saju/constants.ts` — PRD 4.2, 5.1, 5.2 상수 전부
- `lib/saju/calculate.ts` — PRD 4.2 계산 순서 + 4.3 예외 3가지 + 4.4 기업 3기둥
- `lib/saju/elements.ts` — PRD 5.2~5.5
- `lib/saju/fortune.ts` — PRD 6.1~6.6
- `lib/saju/compatibility.ts` — PRD 6.7
- `lib/saju/particle.ts` — PRD 3.8 조사 처리 + README render
- `lib/saju/calculate.test.ts` — 검증 사례 10건, 기대값 TODO (규칙 3)
- `test/saju-output.md` — 10건 계산 결과 표 (`npm test` 실행 시 재생성)

#### 절기 계산 검증

생성된 값이 공표 만세력과 일치합니다.

| 연도 | 계산된 입춘 (KST) | 비고 |
|---|---|---|
| 2024 | 02-04 17:27 | 공표값 일치 |
| 2025 | 02-03 23:10 | 공표값 일치 (2월 3일인 해) |
| 1988 | 02-04 23:43 | 공표값 일치 |
| 2026 | **02-04 05:02** | PRD 예시는 05:46 |

일주 기준일도 독립 검증했습니다. PRD가 준 `1900-01-01 = 갑술(인덱스 10)`을 그대로
쓴 결과 `1936-02-12 = 갑자일`이 나오며, 이는 국내 만세력에서 널리 쓰는 기준일과
일치합니다. 두 앵커 모두 테스트로 고정해 두었습니다.

#### 검증

- `npx tsc --noEmit` 통과 (0건)
- `npm run build` 성공
- `npm test` 107건 통과

### Phase 2 콘텐츠 배치와 조립 — 완료

- `lib/content/chat-scripts.ts` — PRD 21.10 문구 27개 (공통 10 / 면접 6 / 유료 3 / 생성 중 8)
- `lib/content/characters.ts` — PRD 7.2 표정 5단계, 7.3 유형 뱃지 5종, 7.4 뱃지 스타일,
  9.1 공유 그라데이션
- `lib/content/fragments.ts` — 조각 JSON 로더 + 타입, 프리셋 시험 로더
- `lib/content/assemble.ts` — README 조립 규칙대로 카드별 조각 조립
  - 변수 치환 8종 (name, exam, jobPhrase, examDate, examParticle, startTime,
    branchName, branchHanja)
  - PRD 3.3 방식별 카드 제목 변화
  - PRD 3.7 변형 선택 `dayPillarIndex % 7`
  - PRD 6.5 시작 시간 미입력 시 카드 8 숨김
  - PRD 21.7 면접이면 말풍선의 "시험"을 "면접"으로 치환

#### 조각 개수 검증

`lib/content/assemble.test.ts`가 README 표와 실제 JSON을 대조합니다. 전부 일치했습니다.

- 무료 조각 **167개** (speechBubble 5 · dayStem 10 · methodIntro 21 ·
  workTypeByStrong 20 · startTimeByRelation 15 ...)
- 유료 조각 **10개**
- 프리셋 대분류 **8개**, 시험명 **52개**
- 대화 문구 **27개**

조립 결과에 미치환 변수(`{...}`)가 남지 않는지, 이름을 건너뛰었을 때 "님"이
남지 않는지, 같은 입력에 같은 결과가 나오는지(PRD 3.1 결정론)도 함께 검사합니다.

#### 검증

- `npx tsc --noEmit` 통과 (0건)
- `npm run build` 성공
- `npm test` 155건 통과
