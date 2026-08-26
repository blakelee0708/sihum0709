-- 생성 시작 시각 (PRD 14.12)
--
-- Supabase 대시보드 SQL 편집기에 그대로 붙여넣으면 됩니다.
-- 이미 적용됐어도 다시 실행할 수 있습니다.

-- 리포트 생성은 결제 직후 서버가 끝까지 수행하고, 클라이언트는 상태만
-- 확인합니다. 사용자가 브라우저를 닫아도 생성이 끝나 저장됩니다.
--
-- 그런데 서버가 중간에 죽으면 status가 pending인 채로 남습니다. 화면에서는
-- 영원히 "만들고 있어요"가 됩니다. 시작 시각을 남겨 두면 10분이 지난
-- pending을 좀비로 판별해 재시도 버튼을 띄울 수 있습니다.
alter table reports add column if not exists started_at timestamptz;

-- 기존 행은 생성 시각을 시작 시각으로 봅니다.
-- (이 서비스는 아직 운영 전이라 대상이 없지만, 컬럼이 비어 있으면
--  좀비 판별이 안 되므로 채워 둡니다.)
update reports set started_at = created_at where started_at is null;

-- 대기 중인 리포트를 훑을 때 씁니다 (마이페이지, 관리자 화면)
create index if not exists idx_reports_pending
  on reports(status, started_at);
