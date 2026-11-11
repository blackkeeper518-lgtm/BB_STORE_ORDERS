create table public."🏴‍☠️SIRIUS_xXx_CRASH" (
  case_id text not null,
  branch text not null default ''::text,
  carrier_employee text not null default ''::text,
  area text not null default ''::text,
  updated_at timestamp with time zone not null default now(),
  constraint bb_delivery_case_notes_pkey primary key (case_id)
) TABLESPACE pg_default;