-- Project Relay — Supabase Schema (전체 DDL)
-- Supabase 대시보드 → SQL Editor 에서 이 파일 내용을 전체 복사하여 실행하세요.
-- 프로젝트: lkjxzrrkzpdtbdcmqhjo (Project Relay 전용 신규 프로젝트)
--
-- 포함 내용:
--   1) feedbacks         : 사용자가 저장한 원본 피드백
--   2) checklist_status  : 태그별 체크리스트 완료 상태
--   3) shared_cards      : 익명 공유 카드 (학습 라이브러리)

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

create index if not exists shared_cards_project_type_idx on public.shared_cards (project_type);
create index if not exists shared_cards_tag_idx on public.shared_cards (tag);

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
