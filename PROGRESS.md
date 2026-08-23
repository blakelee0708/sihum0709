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

### Phase 3 레이아웃과 대화형 입력 — 완료

- `components/layout/TabBar.tsx` — 탭 3개 + PRD 14.2 표시 규칙 (`shouldShowTabBar`)
- `components/layout/NoticeBanner.tsx` — 공지 배너 (PRD 14.5, 22.15)
- `components/landing/` — Hero, DiffCards, Preview, UserBlock (PRD 14.4, 14.5)
- `components/chat/` — ChatThread, BotBubble, UserBubble, OptionButtons,
  DatePickerWidget, TimePickerWidget, TextInputWidget
- `lib/content/chat-flow.ts` — 방식별 대화 흐름 분기, 답변 되돌리기, 결과 입력 변환
- `lib/motion.ts` — PRD 14.6 모션 값 그대로 (0.26s / 0.2s / delay 0.045 / ease [0.22,1,0.36,1])
- 자동 스크롤 + `visualViewport` 키보드 대응
- sessionStorage 저장·복원, 복원 시 모션 없이 즉시 표시

#### 브라우저 실동작 확인

`npm run dev`로 띄워 375x812에서 필기 흐름을 끝까지 진행했습니다.

- 대분류 → 시험명 → (방식 건너뜀) → 시험 날짜 → 시작 시간 → 생년월일 →
  태어난 시간 → 이름 → 완료까지 전 단계 정상
- `defaultType='필기'`이므로 방식 질문이 실제로 건너뛰어졌습니다 (PRD 14.7)
- 날짜 선택기 범위가 생년월일 1940-01-01~오늘, 시험일 오늘~2030-12-31로 제한됨
  (절기 테이블 범위와 일치)
- 새로고침 후 대화 21줄이 애니메이션 없이 즉시 복원됨
- 이전 답변("2026년 9월 12일") 탭 → 그 단계로 복귀하고 이후 답변이 초기화됨
- 콘솔 에러 없음

#### 검증

- `npx tsc --noEmit` 통과 (0건)
- `npm run build` 성공
- `npm test` 176건 통과

### Phase 4 무료 결과 — 완료

- `app/result/` — 대화에서 전환, `?q=`로 저장된 조회 열기
- 상단 요약 — 캐릭터(표정 5단계), 유형 뱃지, 말풍선, 점수 2개
- 카드 8개 (PRD 3.2, 3.4), 방식별 제목 변화 (PRD 3.3)
- `WeekFlowChart` — recharts 라인 차트 + 날짜별 라벨 표
- `MethodFitChart` — 방식 4종 막대, 지금 준비 중인 방식 강조
- `TypeModal` — 유형 설명 (PRD 7.5), 분포 표시는 초기 비활성
- 공유 이미지 2종 — `ShareCard` 1080x1920, `TypeShareCard` 1080x1080
- `LockedCTA` — 방식별 CTA (PRD 14.9), 실기는 준비 중 안내
- `app/opengraph-image.tsx` — next/og로 og-image 동적 생성 (PRD 21.12)
- 시작 시간 미입력 시 카드 8 대신 안내 (PRD 6.5)
- 태어난 시간 미입력 시 재입력 유도 (PRD 4.3.3)

#### 조각 원문을 건드리지 않고 고친 두 가지

조각 JSON은 원본이라 수정하지 않고, 치환 단계(`lib/saju/particle.ts`)에서 처리했습니다.

**1. 조사 고정 문제**

조각에 `{exam}은`(13회), `{exam}을`(2회), `{startTime}는`(15회)처럼 조사가
박혀 있습니다. 시험명과 시각은 사용자 입력이라 받침이 달라집니다.

- 고치기 전 `9급 공채은` / `오후 2시 30분는`
- 고친 뒤 `9급 공채는` / `오후 2시 30분은`

**2. 이름을 건너뛴 경우 문장이 끊기는 문제**

`강한 {name}님은`(20회), `얕은 {name}님은`(18회), `얕은 {name}님에게는`(2회) —
총 40건이 관형어 뒤에 호명이 옵니다. PRD 3.8의 render 함수대로 호명만 지우면
문장이 깨집니다.

- 고치기 전 `수 기운이 얕은 질문 의도를 놓치고`
- 고친 뒤 `수 기운이 얕은 분은 질문 의도를 놓치고`

연결어미 뒤(`정리하면 {name}님은`)는 기존대로 그냥 지웁니다.

#### 브라우저 실동작 확인

- 필기 결과: 카드 8개, 7일 흐름 차트, 방식 궁합 막대, 공유 카드 2종 렌더링 확인
- 면접 결과: 카드 2가 조각 4개(방식 특성 + 기업 규모 + 일의 성격 + 약오행),
  카드 8 대신 시작 시간 안내, 면접 전용 CTA 확인
- 이름·시작시간·태어난시간을 모두 건너뛴 조합에서도 문장이 자연스럽게 나옴

#### 검증

- `npx tsc --noEmit` 통과 (0건)
- `npm run build` 성공
- `npm test` 182건 통과

### Phase 5 인증과 마이페이지 — 완료

- `supabase/migrations/001_init.sql` — **대시보드에 통째로 붙여넣을 수 있는 단일 파일**
  - PRD 13.1 테이블 8개 + 인덱스 8개
  - PRD 13.2 RLS 정책 5개
  - coupons / search_logs / notices도 RLS를 켜고 정책을 만들지 않아
    service_role만 접근하도록 했습니다 (RLS를 끄면 anon 키로 열립니다)
  - 가입 시 profiles 자동 생성 트리거 (PRD 11.4 이름 우선순위 반영)
  - `delete_own_account()` 함수 — PRD 11.6 탈퇴 3단계를 트랜잭션으로 처리
- `middleware.ts` — 세션 갱신 + `/admin` 이메일 화이트리스트 (PRD 22.3)
- `app/login` — 이메일 매직링크는 실제 동작, 카카오/구글은 버튼과 흐름만
- `app/auth/callback` — 매직링크와 OAuth 리다이렉트 공용 처리
- `app/my` — 로그인/비로그인 분기 (PRD 14.13, 14.14)
- `app/my/profile` — 내 정보 수정, 태어난 시간 모름 → 입력 전환 (PRD 11.5)
- 회원 탈퇴 (PRD 11.6), 결제 내역 (PRD 14.15), 문의하기 (PRD 14.16),
  자주 묻는 질문 (PRD 14.17), 알림 설정
- `app/terms`, `app/privacy` — 초안
- `app/api/queries` — "내 결과 저장하기" 저장, 비로그인은 401 → 로그인 후 자동 저장
- `app/api/inquiry` — 문의 등록 + Slack 알림

#### 건너뛴 항목 (규칙 1)

| 항목 | 처리 |
|---|---|
| 카카오 OAuth 앱 등록 | 버튼과 `signInWithOAuth` 호출까지 구현, `talk_message` 스코프 포함. 코드에 TODO 주석 |
| 구글 OAuth 앱 등록 | 동일 |
| Supabase 스키마 적용 | SQL 파일만 작성. **원격 DB에 직접 적용하지 않았습니다** — 대시보드에서 직접 붙여넣겠다고 하셔서 그대로 두었습니다 |

`.env.local`이 없어 지금은 목업 모드로 동작합니다. 마이페이지는 비로그인 화면,
공지 배너와 홈 개인화 블록은 빈 응답, 문의는 접수만 받은 것처럼 응답합니다.

#### 검증

- `npx tsc --noEmit` 통과 (0건)
- `npm run build` 성공 (라우트 19개)
- `npm test` 182건 통과
- 브라우저에서 `/my`, `/my/faq`, `/my/inquiry`, `/my/settings`, `/terms`,
  `/privacy`, `/login` 200 확인. `/my/profile`, `/my/payments`는 미로그인이라
  의도대로 리다이렉트
