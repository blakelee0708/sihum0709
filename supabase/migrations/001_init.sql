-- 시험사주 초기 스키마 (PRD 13.1 테이블, 13.2 RLS)
--
-- 사용법
--   Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여넣고 실행하시면 됩니다.
--   CLI를 쓰신다면 `supabase db push` 로도 적용됩니다.
--
-- 한 번만 실행하면 되고, 여러 번 실행해도 안전하도록 if not exists를 붙였습니다.

-- ─────────────────────────────────────────────
-- 1. 테이블 (PRD 13.1)
-- ─────────────────────────────────────────────

-- 사용자 프로필 (auth.users 확장)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  birth_date date,
  birth_time time,
  has_birth_time boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 조회 기록 (무료 결과 포함)
create table if not exists queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  session_id text,                          -- 비로그인 식별용

  exam_name text not null,
  exam_category text,
  exam_type text not null,                  -- 필기 / 면접 / 실기
  exam_date date not null,
  exam_start_time time,

  -- 면접 전용
  company_scale text,                       -- 기업 규모 6분류
  work_type text,                           -- 일의 성격 4분류
  job_title text,                           -- 자유 입력 직무명
  company_name text,                        -- 유료 결제 시 입력

  birth_date date not null,
  birth_time time,
  has_birth_time boolean default true,
  name text,

  -- 계산 결과 캐싱
  day_stem text,
  day_pillar_index int,
  strong_element text,
  weak_element text,
  exam_day_score int,

  created_at timestamptz default now()
);

-- 유료 리포트
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  query_id uuid references queries on delete cascade not null,
  report_type text not null,                -- 필기 / 면접
  dday_range text not null,                 -- normal / short / eve / dday

  content jsonb,                            -- 섹션별 생성 결과
  status text default 'pending',            -- pending / completed / failed / refunded
  error_message text,
  retry_count int default 0,

  -- 원가 추적
  input_tokens int,
  output_tokens int,
  generation_ms int,

  -- 무료 지급
  granted_by text,                          -- 관리자 이메일, 지급 건만

  created_at timestamptz default now()
);

-- 결제 이력 (탈퇴해도 보존, FK 없음)
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,                             -- 탈퇴 시 null 처리
  report_id uuid,
  payment_id text,                          -- PG 거래번호
  amount int not null,
  product_type text not null,               -- 필기 / 면접
  payment_method text,                      -- 카드 / 간편결제 / 휴대폰
  coupon_code text,
  is_granted boolean default false,         -- 관리자 무료 지급 여부
  paid_at timestamptz not null,
  refunded_at timestamptz,
  refund_reason text,
  refunded_by text,                         -- 처리한 관리자 이메일
  created_at timestamptz default now()
);

-- 쿠폰
create table if not exists coupons (
  code text primary key,
  discount_type text not null,              -- percent / amount
  discount_value int not null,
  max_uses int,
  used_count int default 0,
  valid_until timestamptz,
  memo text,                                -- 발급 목적
  created_by text,
  created_at timestamptz default now()
);

-- 문의
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  category text not null,                   -- 결제 / 리포트 / 계정 / 오류 / 기타
  content text not null,
  email text not null,
  status text default 'open',               -- open / answered / closed
  reply text,
  replied_at timestamptz,
  replied_by text,
  created_at timestamptz default now()
);

-- 검색 로그 (2차 확장 판단 근거)
create table if not exists search_logs (
  id uuid primary key default gen_random_uuid(),
  query_type text not null,                 -- company / exam
  keyword text not null,
  success boolean not null,
  created_at timestamptz default now()
);

-- 공지 배너
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  is_active boolean default false,
  created_by text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 2. 인덱스 (PRD 13.1)
-- ─────────────────────────────────────────────

create index if not exists idx_queries_user on queries(user_id);
create index if not exists idx_queries_created on queries(created_at desc);
create index if not exists idx_queries_exam on queries(exam_name, exam_date);
create index if not exists idx_reports_user on reports(user_id);
create index if not exists idx_reports_status on reports(status) where status != 'completed';
create index if not exists idx_payments_paid on payments(paid_at desc);
create index if not exists idx_inquiries_status on inquiries(status) where status = 'open';
create index if not exists idx_search_logs_keyword on search_logs(keyword, success);

-- ─────────────────────────────────────────────
-- 3. RLS (PRD 13.2)
--
-- coupons, search_logs, notices는 클라이언트에서 직접 접근하지 않습니다.
-- 서버 라우트에서 service_role 키로만 다룹니다.
-- ─────────────────────────────────────────────

alter table profiles enable row level security;
alter table queries enable row level security;
alter table reports enable row level security;
alter table payments enable row level security;
alter table inquiries enable row level security;

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles
  for all using (auth.uid() = id);

drop policy if exists "own queries" on queries;
create policy "own queries" on queries
  for all using (auth.uid() = user_id or user_id is null);

drop policy if exists "own reports" on reports;
create policy "own reports" on reports
  for select using (auth.uid() = user_id);

drop policy if exists "own payments" on payments;
create policy "own payments" on payments
  for select using (auth.uid() = user_id);

drop policy if exists "own inquiries" on inquiries;
create policy "own inquiries" on inquiries
  for all using (auth.uid() = user_id or user_id is null);

-- coupons, search_logs, notices도 RLS를 켜둡니다.
-- 정책을 만들지 않으므로 anon/authenticated 키로는 아무것도 읽거나 쓸 수 없고,
-- service_role 키만 접근합니다. RLS를 끄면 anon 키로 전부 열리므로 반드시 켭니다.
alter table coupons enable row level security;
alter table search_logs enable row level security;
alter table notices enable row level security;

-- ─────────────────────────────────────────────
-- 4. 가입 시 프로필 자동 생성
--
-- PRD 11.4 이름 우선순위: 입력 폼 > 카카오 닉네임/구글 이름 > 없음
-- 소셜 로그인 메타데이터에서 이름을 끌어옵니다.
-- ─────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- 5. updated_at 자동 갱신
-- ─────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on profiles;
create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────
-- 6. 회원 탈퇴 (PRD 11.6)
--
--   1. payments.user_id를 null로 변경 (결제 이력 보존, 전자상거래법 5년)
--   2. auth.users 삭제
--   3. profiles, queries, reports는 cascade로 삭제
--
-- 사용자가 자기 계정만 지울 수 있도록 security definer로 감쌉니다.
-- ─────────────────────────────────────────────

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;

  update public.payments set user_id = null where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
