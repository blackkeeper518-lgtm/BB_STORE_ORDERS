-- Preserve canonical customer/page message fields through tracking routing.
-- Idempotent migration: safe to apply once or rerun.

alter table public."🗝️HERMES_ARCHIVE"
  add column if not exists customer_message_text text null,
  add column if not exists page_message_text text null;

alter table public."🌀SINGULARITY_xXx_EXCHANGE"
  add column if not exists customer_message_text text null,
  add column if not exists page_message_text text null;

alter table public."💀THANATOS_xXx_DEATH_NOTE"
  add column if not exists customer_message_text text null,
  add column if not exists page_message_text text null;
