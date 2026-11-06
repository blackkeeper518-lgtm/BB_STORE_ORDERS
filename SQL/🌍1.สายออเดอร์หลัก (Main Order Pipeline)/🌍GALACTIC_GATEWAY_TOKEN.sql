create table public."🌍GALACTIC_GATEWAY_TOKEN" (
  page_id text not null,
  page_name text null,
  access_token text null,
  brand_name text null,
  app_identity text null,
  admin_name text null,
  "Sheets_name" text null,
  sheets_id text null,
  spread_sheets_id text null,
  status text null,
  warehouse text null,
  page_label text null,
  "assigned_Hashtag" text null,
  constraint facebook_page_token_map_pkey primary key (page_id)
) TABLESPACE pg_default;