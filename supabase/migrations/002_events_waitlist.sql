-- 검증 지표 계측(PRD 19장)과 알림 신청(PRD 8.2, 12.7) 테이블
--
-- 001_init.sql 과 마찬가지로 여러 번 실행해도 안전합니다.

-- ─────────────────────────────────────────────
-- 1. 이벤트 로그 (PRD 19장 검증 지표)
--
-- 개인정보를 담지 않습니다. 생년월일, 이름, 이메일은 기록하지 않고
-- "어느 단계에서 이탈했는지" 수준만 남깁니다.
--
-- session_id는 브라우저가 만든 임의 문자열이며 sessionStorage에만 있습니다.
-- 브라우저를 닫으면 사라지고 사람과 연결되지 않습니다.
-- ─────────────────────────────────────────────

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  user_id uuid,                             -- 로그인 상태면 기록, 아니면 null
  name text not null,                       -- 이벤트 이름 (lib/analytics.ts 참조)
  props jsonb,                              -- 부가 정보. 개인정보는 넣지 않습니다
  created_at timestamptz default now()
);

create index if not exists idx_events_name_created on events(name, created_at desc);
create index if not exists idx_events_session on events(session_id, created_at);

-- ─────────────────────────────────────────────
-- 2. 알림 신청 (PRD 8.2 실기 준비 중, 12.7 결제 의사 측정)
--
-- 실기 사용자와 결제 전 이탈자의 이메일을 받습니다.
-- 상품이 열리면 이 목록으로 안내합니다.
-- ─────────────────────────────────────────────

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  reason text not null,                     -- practical / price 등 신청 맥락
  exam_name text,
  exam_type text,
  price_shown int,                          -- PRD 12.8 가격 테스트용
  created_at timestamptz default now()
);

create index if not exists idx_waitlist_reason on waitlist(reason, created_at desc);
create unique index if not exists idx_waitlist_email_reason on waitlist(email, reason);

-- ─────────────────────────────────────────────
-- 3. RLS
--
-- 두 테이블 모두 클라이언트에서 직접 접근하지 않습니다.
-- 정책을 만들지 않으므로 anon / authenticated 키로는 읽기도 쓰기도 안 되고,
-- service_role 키를 쓰는 서버 라우트만 다룹니다 (PRD 13.2와 같은 방식).
-- ─────────────────────────────────────────────

alter table events enable row level security;
alter table waitlist enable row level security;
