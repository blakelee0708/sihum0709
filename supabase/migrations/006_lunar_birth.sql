-- 음력 생년월일 원본 (FIX_3 [3]-2)
--
-- Supabase 대시보드 SQL 편집기에 그대로 붙여넣으면 됩니다.
-- 이미 적용됐어도 다시 실행할 수 있게 if not exists를 붙였습니다.

-- 사주 계산은 양력과 절기만 씁니다. birth_date에는 항상 양력이 들어갑니다.
-- 음력으로 입력한 사람은 입력 단계에서 변환한 값이 저장됩니다.
--
-- 그런데 원본을 버리면 나중에 문의가 왔을 때 확인할 방법이 없습니다.
-- "제 생일은 5월 15일인데 왜 5월 9일로 나오나요"라는 문의가 오면
-- 음력으로 입력했는지, 윤달이었는지를 봐야 답할 수 있습니다.
-- 변환기 버전이 바뀌었을 때 재계산할 근거도 됩니다.
alter table queries add column if not exists is_lunar boolean default false;
alter table queries add column if not exists is_leap_month boolean default false;
alter table queries add column if not exists lunar_date date;

-- 음력 입력 비율을 보려고 남깁니다. 비율이 낮으면 질문을 없애고,
-- 높으면 순서를 앞으로 당기는 판단에 씁니다.
create index if not exists idx_queries_is_lunar on queries(is_lunar);
