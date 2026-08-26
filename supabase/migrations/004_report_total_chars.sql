-- 리포트 분량 기록 (PRD 8.3, 8.4)
--
-- PRD 8.3의 목표는 5,000자인데 실측이 2,813-3,069자로 60%에 그쳤습니다.
-- 프롬프트에 섹션별 최소 글자 수를 넣고 서버에서 검증하도록 바꾼 뒤,
-- 실제 분량이 어떻게 분포하는지 보려고 남깁니다.
--
-- 출력 원가를 정하는 것은 max_tokens가 아니라 모델이 실제로 쓰는 분량이므로
-- 이 값이 output_tokens와 함께 원가의 근거가 됩니다.

alter table reports add column if not exists total_chars int;

-- 분량 분포 확인용 (PRD 22.13)
create index if not exists idx_reports_total_chars
  on reports(report_type, total_chars);
