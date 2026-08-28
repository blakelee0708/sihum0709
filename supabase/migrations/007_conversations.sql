-- 리포트 후 대화 (FIX_4 [3]-10)
--
-- Supabase 대시보드 SQL 편집기에 그대로 붙여넣으면 됩니다.
-- 여러 번 실행해도 안전합니다.
--
-- 유료 리포트를 읽은 뒤 합격이와 이어서 이야기하는 기능입니다.
-- 3,900원에 포함되며 별도 결제가 없습니다.
--
-- 제한은 턴 수가 아니라 누적 원가로 겁니다. 질문 길이에 따라 턴당 원가가
-- 크게 달라서 턴 수로 자르면 어떤 사용자는 손해를 보고 어떤 사용자는
-- 상한을 넘깁니다. total_cost가 그 판단 근거이고, 사용자에게는 숫자가 아니라
-- "합격이의 기운" 게이지로 보여줍니다.
--
-- 대화를 저장하는 이유는 재진입 때문입니다. 나갔다 들어와도 이어서
-- 이야기할 수 있어야 합니다.

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports on delete cascade,
  user_id uuid references auth.users on delete cascade,
  messages jsonb default '[]',
  total_cost numeric default 0,
  turn_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 리포트당 하나입니다. 재진입 시 같은 행을 이어 씁니다
create unique index if not exists idx_conversations_report on conversations(report_id);
create index if not exists idx_conversations_user on conversations(user_id);

-- 읽기만 사용자에게 열어 둡니다. 쓰기는 서버 라우트가 service_role로 합니다.
-- 원가와 턴 수를 클라이언트가 고칠 수 있으면 상한이 상한이 아닙니다.
alter table conversations enable row level security;

drop policy if exists "own conversations" on conversations;
create policy "own conversations" on conversations
  for select using (auth.uid() = user_id);

drop trigger if exists conversations_touch_updated_at on conversations;
create trigger conversations_touch_updated_at
  before update on conversations
  for each row execute function public.touch_updated_at();
