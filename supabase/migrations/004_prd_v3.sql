-- PRD v3 반영 (13.1)
--
-- Supabase 대시보드 SQL 편집기에 그대로 붙여넣으면 됩니다.
-- 이미 적용된 항목이 있어도 다시 실행할 수 있게 if not exists를 붙였습니다.

-- ── queries ────────────────────────────────────────────────

-- 사용자 원본 입력 (PRD 10.3)
--
-- exam_name에는 정규화한 값이 들어갑니다. 같은 시험을 사람마다 다르게
-- 입력하므로 관리자 화면에서 집계하려면 표기를 맞춰야 하는데, 원본을
-- 버리면 무엇을 어떻게 고쳤는지 확인할 수 없어 따로 남깁니다.
-- 프리셋 버튼으로 고른 경우에는 null입니다.
alter table queries add column if not exists exam_name_raw text;

-- 대학교 시험 기간 (PRD 10.4)
--
-- 하루 / 2~3일 / 4~7일 / 일주일 이상.
-- hasExamPeriod가 true인 대분류(대학교 시험)에서만 값이 들어갑니다.
-- 어느 날 시험을 보는지는 묻지 않고 첫날을 기준으로 계산합니다.
alter table queries add column if not exists exam_period text;

-- ── reports ────────────────────────────────────────────────

-- 생성된 본문 글자 수 (PRD 8.3, 8.4)
--
-- PRD 8.3의 목표는 필기 6,900자 이상인데 섹션 확대 전 실측이 3,069자였습니다.
-- 프롬프트에 섹션별 최소 글자 수를 넣고 서버에서 검증하도록 바꾼 뒤,
-- 실제 분량이 어떻게 분포하는지 보려고 남깁니다.
--
-- 출력 원가를 정하는 것은 max_tokens가 아니라 모델이 실제로 쓰는 분량이므로
-- 이 값이 output_tokens와 함께 원가의 근거가 됩니다 (PRD 8.13).
alter table reports add column if not exists total_chars int;

-- 분량 분포 확인용 (PRD 22.13)
create index if not exists idx_reports_total_chars
  on reports(report_type, total_chars);

-- ── exam_type 제약 ─────────────────────────────────────────

-- 시험 방식이 4분류가 됐습니다 (PRD 10.2). 001_init.sql에는 CHECK 제약을
-- 걸지 않았으므로 새로 만들 것은 없습니다. 나중에 제약을 추가한다면
-- 오디션을 반드시 포함하십시오.
--
--   alter table queries add constraint queries_exam_type_check
--     check (exam_type in ('필기', '면접', '실기', '오디션'));
--
-- 지금 거는 것은 권하지 않습니다. 값이 코드에서만 들어오고, 방식이 더
-- 늘어나면 마이그레이션이 한 번 더 필요합니다.
