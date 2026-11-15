create table public."🌍GALACTIC_GATEWAY_TOKEN" (
  page_id text not null,
  page_name text null,
  access_token text null,
  brand_name text null,
  app_identity text null,
  admin_name text null,
  status text null,
  page_label text null,
  "assigned_Hashtag" text null,
  portal_key text null,
  constraint page_tokens_vault_pkey primary key (page_id)
) TABLESPACE pg_default;