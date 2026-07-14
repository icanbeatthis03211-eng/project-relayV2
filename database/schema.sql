-- Project Relay — Supabase Schema (전체 DDL)
-- Supabase 대시보드 → SQL Editor 에서 이 파일 내용을 전체 복사하여 실행하세요.
-- 프로젝트: lkjxzrrkzpdtbdcmqhjo (Project Relay 전용 신규 프로젝트)
--
-- 포함 내용:
--   1) feedbacks         : 사용자가 저장한 원본 피드백
--   2) checklist_status  : 태그별 체크리스트 완료 상태
--   3) shared_cards      : 익명 공유 카드 (학습 라이브러리)
--   4) assignments        : 업로드한 과제 파일
--   5) storage 버킷(assignments) 및 정책

create extension if not exists "pgcrypto";

-- ---------- 1) feedbacks ----------
create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  project_type text not null,
  feedback_source text not null,
  original_feedback text not null,
  summary text,
  tag text not null,
  action_item text,
  is_shareable boolean not null default false,
  created_at timestamptz not null default now()
);

-- 여러 역량 태그를 한 피드백에 함께 저장하기 위한 배열 컬럼입니다.
-- (기존 tag 컬럼은 하위 호환 및 "대표 태그" 용도로 계속 사용합니다.)
alter table public.feedbacks add column if not exists tags text[] not null default '{}';

create index if not exists feedbacks_user_id_idx on public.feedbacks (user_id);
create index if not exists feedbacks_tag_idx on public.feedbacks (tag);

alter table public.feedbacks enable row level security;

drop policy if exists "feedbacks_select_all" on public.feedbacks;
create policy "feedbacks_select_all" on public.feedbacks
  for select using (true);

drop policy if exists "feedbacks_insert_all" on public.feedbacks;
create policy "feedbacks_insert_all" on public.feedbacks
  for insert with check (true);

drop policy if exists "feedbacks_update_all" on public.feedbacks;
create policy "feedbacks_update_all" on public.feedbacks
  for update using (true) with check (true);

drop policy if exists "feedbacks_delete_all" on public.feedbacks;
create policy "feedbacks_delete_all" on public.feedbacks
  for delete using (true);

-- ---------- 2) checklist_status ----------
create table if not exists public.checklist_status (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  tag text not null,
  is_checked boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, tag)
);

create index if not exists checklist_status_user_id_idx on public.checklist_status (user_id);

alter table public.checklist_status enable row level security;

drop policy if exists "checklist_status_select_all" on public.checklist_status;
create policy "checklist_status_select_all" on public.checklist_status
  for select using (true);

drop policy if exists "checklist_status_insert_all" on public.checklist_status;
create policy "checklist_status_insert_all" on public.checklist_status
  for insert with check (true);

drop policy if exists "checklist_status_update_all" on public.checklist_status;
create policy "checklist_status_update_all" on public.checklist_status
  for update using (true) with check (true);

drop policy if exists "checklist_status_delete_all" on public.checklist_status;
create policy "checklist_status_delete_all" on public.checklist_status
  for delete using (true);

-- ---------- 3) shared_cards ----------
create table if not exists public.shared_cards (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid references public.feedbacks (id) on delete set null,
  project_type text not null,
  generalized_feedback text not null,
  tag text not null,
  action_item text not null,
  created_at timestamptz not null default now()
);

-- 이미 만들어진 테이블에도 안전하게 추가되도록 별도 alter 문으로 둡니다.
-- (카드를 누가 공유했는지 저장해서, "내가 공유한 카드"만 정확히 구분하고
--  공유 취소할 수 있게 하기 위한 컬럼입니다.)
alter table public.shared_cards add column if not exists user_id text;
alter table public.shared_cards add column if not exists tags text[] not null default '{}';

create index if not exists shared_cards_project_type_idx on public.shared_cards (project_type);
create index if not exists shared_cards_tag_idx on public.shared_cards (tag);
create index if not exists shared_cards_user_id_idx on public.shared_cards (user_id);

alter table public.shared_cards enable row level security;

drop policy if exists "shared_cards_select_all" on public.shared_cards;
create policy "shared_cards_select_all" on public.shared_cards
  for select using (true);

drop policy if exists "shared_cards_insert_all" on public.shared_cards;
create policy "shared_cards_insert_all" on public.shared_cards
  for insert with check (true);

drop policy if exists "shared_cards_update_all" on public.shared_cards;
create policy "shared_cards_update_all" on public.shared_cards
  for update using (true) with check (true);

drop policy if exists "shared_cards_delete_all" on public.shared_cards;
create policy "shared_cards_delete_all" on public.shared_cards
  for delete using (true);

-- ---------- 4) assignments ----------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  project_type text not null,
  title text not null,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists assignments_user_id_idx on public.assignments (user_id);

alter table public.assignments enable row level security;

drop policy if exists "assignments_select_all" on public.assignments;
create policy "assignments_select_all" on public.assignments
  for select using (true);

drop policy if exists "assignments_insert_all" on public.assignments;
create policy "assignments_insert_all" on public.assignments
  for insert with check (true);

drop policy if exists "assignments_delete_all" on public.assignments;
create policy "assignments_delete_all" on public.assignments
  for delete using (true);

-- ---------- 5) storage 버킷(assignments) ----------
-- 과제 파일을 보관할 공개 버킷입니다. 인증이 없는 서비스라 편의상 공개로 두었으니,
-- 민감한 파일은 올리지 않도록 안내가 필요합니다.
insert into storage.buckets (id, name, public)
values ('assignments', 'assignments', true)
on conflict (id) do nothing;

drop policy if exists "assignments_storage_select_all" on storage.objects;
create policy "assignments_storage_select_all" on storage.objects
  for select using (bucket_id = 'assignments');

drop policy if exists "assignments_storage_insert_all" on storage.objects;
create policy "assignments_storage_insert_all" on storage.objects
  for insert with check (bucket_id = 'assignments');

drop policy if exists "assignments_storage_delete_all" on storage.objects;
create policy "assignments_storage_delete_all" on storage.objects
  for delete using (bucket_id = 'assignments');
