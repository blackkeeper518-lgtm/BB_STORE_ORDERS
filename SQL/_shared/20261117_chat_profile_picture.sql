-- Store the real Messenger profile picture URL emitted by ST_CHAT.
-- The URL comes from Meta's User Profile API and may expire; n8n refreshes it on later syncs.
alter table public."Cust_Chat⭐BINARY_xXx_STAR"
  add column if not exists profile_picture_url text null;

alter table public."Pg_Chat⭐BINARY_xXx_STAR"
  add column if not exists profile_picture_url text null;
