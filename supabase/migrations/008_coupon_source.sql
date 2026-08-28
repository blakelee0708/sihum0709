-- 457deep 쿠폰 연동과 유입 기록 (FIX_4 [5])
--
-- Supabase 대시보드 SQL 편집기에 그대로 붙여넣으면 됩니다.
-- 여러 번 실행해도 안전합니다.

-- 어디서 발급한 쿠폰인지, 그쪽 사용자 누구에게 나갔는지 (FIX_4 [5]-1)
alter table coupons add column if not exists source text;
alter table coupons add column if not exists external_user_id text;

-- 같은 사람에게 두 번 발급하지 않습니다. 발급 API가 기존 코드를 찾을 때도
-- 이 인덱스를 씁니다. source가 다르면 같은 id여도 별개로 봅니다.
create unique index if not exists idx_coupons_external
  on coupons(source, external_user_id)
  where external_user_id is not null;

-- 어디서 들어온 사용자인지 (FIX_4 [5]-3)
-- '457deep', 'organic', 'share' 등. 나중에 코호트 분석에 씁니다.
alter table profiles add column if not exists source text;
create index if not exists idx_profiles_source on profiles(source);
