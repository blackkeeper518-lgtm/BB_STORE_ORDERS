-- ROOM 04 · APP CUSTOMIZATION VAULT
-- Run this in the ROOM 04 Supabase project.
-- Existing tables are preserved; missing columns are added safely.

create extension if not exists pgcrypto;

-- 1) Chat frames -------------------------------------------------------------
create table if not exists public.app_chat_frames (
  id uuid primary key default gen_random_uuid(),
  frame_key text not null unique,
  name text not null,
  description text not null default '',
  base_frame_key text,
  border_color text,
  accent_color text,
  border_width numeric(6,2),
  glow numeric(6,2),
  animation text,
  custom_css text not null default '',
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_chat_frames
  add column if not exists base_frame_key text,
  add column if not exists border_color text,
  add column if not exists accent_color text,
  add column if not exists border_width numeric(6,2),
  add column if not exists glow numeric(6,2),
  add column if not exists animation text,
  add column if not exists custom_css text not null default '',
  add column if not exists is_enabled boolean not null default true,
  add column if not exists sort_order integer not null default 0,
  add column if not exists version integer not null default 1,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- 2) Themes ------------------------------------------------------------------
create table if not exists public.app_themes (
  id uuid primary key default gen_random_uuid(),
  theme_key text not null unique,
  name text not null,
  description text not null default '',
  background_color text not null default '#090611',
  surface_color text not null default '#151027',
  primary_color text not null default '#b879ff',
  accent_color text not null default '#00e5ff',
  border_style text not null default 'solid',
  button_style text not null default 'solid',
  radius numeric(6,2) not null default 16,
  glow numeric(6,2) not null default 12,
  motion_enabled boolean not null default true,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_themes
  add column if not exists description text not null default '',
  add column if not exists background_color text not null default '#090611',
  add column if not exists surface_color text not null default '#151027',
  add column if not exists primary_color text not null default '#b879ff',
  add column if not exists accent_color text not null default '#00e5ff',
  add column if not exists border_style text not null default 'solid',
  add column if not exists button_style text not null default 'solid',
  add column if not exists radius numeric(6,2) not null default 16,
  add column if not exists glow numeric(6,2) not null default 12,
  add column if not exists motion_enabled boolean not null default true,
  add column if not exists is_enabled boolean not null default true,
  add column if not exists sort_order integer not null default 0,
  add column if not exists version integer not null default 1,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- 3) Sounds ------------------------------------------------------------------
create table if not exists public.app_sounds (
  id uuid primary key default gen_random_uuid(),
  sound_key text not null unique,
  name text not null,
  description text not null default '',
  event_type text not null default 'custom',
  storage_bucket text,
  storage_path text,
  mime_type text,
  volume numeric(5,4) not null default 0.35,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_sounds
  add column if not exists description text not null default '',
  add column if not exists event_type text not null default 'custom',
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists volume numeric(5,4) not null default 0.35,
  add column if not exists is_enabled boolean not null default true,
  add column if not exists sort_order integer not null default 0,
  add column if not exists version integer not null default 1,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- 4) Current selections ------------------------------------------------------
-- One active value per app/scope/type. Examples:
--   app_key=ST_SINGTO_STORE, scope_key=global, asset_type=theme, asset_key=theme-005
--   app_key=ST_SINGTO_STORE, scope_key=line:Uxxxx, asset_type=frame, asset_key=f03
create table if not exists public.app_customization_selections (
  id uuid primary key default gen_random_uuid(),
  app_key text not null default 'ST_SINGTO_STORE',
  scope_key text not null default 'global',
  asset_type text not null check (asset_type in ('theme','frame','sound','image','background','other')),
  asset_key text not null,
  is_active boolean not null default true,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_customization_selection_unique unique (app_key, scope_key, asset_type)
);

create index if not exists app_chat_frames_enabled_order_idx
  on public.app_chat_frames (is_enabled, sort_order);
create index if not exists app_themes_enabled_order_idx
  on public.app_themes (is_enabled, sort_order);
create index if not exists app_sounds_enabled_event_order_idx
  on public.app_sounds (is_enabled, event_type, sort_order);
create index if not exists app_customization_selection_lookup_idx
  on public.app_customization_selections (app_key, scope_key, asset_type, is_active);

-- Shared updated_at trigger. Existing installations may already have this.
create or replace function public.touch_app_customization_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_chat_frames_touch_updated_at on public.app_chat_frames;
create trigger app_chat_frames_touch_updated_at
before update on public.app_chat_frames
for each row execute function public.touch_app_customization_updated_at();

drop trigger if exists app_themes_touch_updated_at on public.app_themes;
create trigger app_themes_touch_updated_at
before update on public.app_themes
for each row execute function public.touch_app_customization_updated_at();

drop trigger if exists app_sounds_touch_updated_at on public.app_sounds;
create trigger app_sounds_touch_updated_at
before update on public.app_sounds
for each row execute function public.touch_app_customization_updated_at();

drop trigger if exists app_customization_selections_touch_updated_at on public.app_customization_selections;
create trigger app_customization_selections_touch_updated_at
before update on public.app_customization_selections
for each row execute function public.touch_app_customization_updated_at();

-- Read access for the app. Keep write access restricted if the app writes via
-- a protected server route. The existing project policies are not overwritten.
alter table public.app_chat_frames enable row level security;
alter table public.app_themes enable row level security;
alter table public.app_sounds enable row level security;
alter table public.app_customization_selections enable row level security;

drop policy if exists app_chat_frames_public_read on public.app_chat_frames;
create policy app_chat_frames_public_read on public.app_chat_frames
for select to anon, authenticated using (is_enabled = true);

drop policy if exists app_themes_public_read on public.app_themes;
create policy app_themes_public_read on public.app_themes
for select to anon, authenticated using (is_enabled = true);

drop policy if exists app_sounds_public_read on public.app_sounds;
create policy app_sounds_public_read on public.app_sounds
for select to anon, authenticated using (is_enabled = true);

drop policy if exists app_customization_selections_public_read on public.app_customization_selections;
create policy app_customization_selections_public_read on public.app_customization_selections
for select to anon, authenticated using (is_active = true);

-- The current Secret Gallery uses the ROOM 04 anon/publishable key from the
-- browser. These policies make its add/edit/toggle buttons functional.
-- If the project later moves writes behind an authenticated server route,
-- remove these four public-write policies and grant writes only to that role.
drop policy if exists app_chat_frames_secret_write on public.app_chat_frames;
create policy app_chat_frames_secret_write on public.app_chat_frames
for all to anon, authenticated using (true) with check (true);

drop policy if exists app_themes_secret_write on public.app_themes;
create policy app_themes_secret_write on public.app_themes
for all to anon, authenticated using (true) with check (true);

drop policy if exists app_sounds_secret_write on public.app_sounds;
create policy app_sounds_secret_write on public.app_sounds
for all to anon, authenticated using (true) with check (true);

drop policy if exists app_customization_selections_secret_write on public.app_customization_selections;
create policy app_customization_selections_secret_write on public.app_customization_selections
for all to anon, authenticated using (true) with check (true);

notify pgrst, 'reload schema';
