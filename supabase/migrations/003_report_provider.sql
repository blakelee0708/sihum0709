-- 리포트에 AI provider와 model 기록 (원가 검증용)
--
-- Sonnet 5는 새 토크나이저를 쓰므로 같은 한글 텍스트가 이전 모델보다
-- 최대 1.35배 많은 토큰으로 계산됩니다. PRD 8.12의 원가 추정치는 하한으로
-- 보고, 실제 사용량을 여기 쌓아 나중에 검증합니다.
--
-- input_tokens, output_tokens, generation_ms는 001_init.sql에 이미 있습니다.

alter table reports add column if not exists provider text;
alter table reports add column if not exists model text;

-- 모델별 원가 비교에 씁니다 (PRD 22.13)
create index if not exists idx_reports_model on reports(model, created_at desc);
