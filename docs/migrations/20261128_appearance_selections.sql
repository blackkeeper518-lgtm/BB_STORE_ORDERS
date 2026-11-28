-- Appearance architecture: persist applied room selections without touching business data.
-- Existing theme/frame rows are preserved. Draft/preview remains client-local.

alter table public.app_customization_selections
  drop constraint if exists app_customization_selections_asset_type_check;

alter table public.app_customization_selections
  add constraint app_customization_selections_asset_type_check
  check (asset_type in ('theme','frame','sound','image','background','atmosphere','card_style','other'));

create unique index if not exists app_customization_selection_unique
  on public.app_customization_selections (app_key, scope_key, asset_type);

alter table public.app_customization_selections enable row level security;

drop policy if exists app_customization_selections_secret_write
  on public.app_customization_selections;
drop policy if exists app_customization_selections_public_read
  on public.app_customization_selections;
drop policy if exists app_customization_selections_service_role_write
  on public.app_customization_selections;
drop policy if exists app_customization_selections_service_role_access
  on public.app_customization_selections;

create policy app_customization_selections_service_role_access
  on public.app_customization_selections
  for all
  to service_role
  using (true)
  with check (true);
