-- Columns used by the n8n LINE normalizer.
alter table public.line_messages
  add column if not exists channel text,
  add column if not exists source text,
  add column if not exists oa_id text,
  add column if not exists conversation_id text,
  add column if not exists event_id text,
  add column if not exists event_type text,
  add column if not exists event_timestamp bigint,
  add column if not exists line_user_id text,
  add column if not exists user_id text,
  add column if not exists source_type text,
  add column if not exists group_id text,
  add column if not exists room_id text,
  add column if not exists line_message_id text,
  add column if not exists message_id text,
  add column if not exists message_type text,
  add column if not exists message_text text,
  add column if not exists text text,
  add column if not exists direction text,
  add column if not exists speaker text,
  add column if not exists reply_token text,
  add column if not exists display_name text,
  add column if not exists profile_picture_url text,
  add column if not exists raw_event jsonb,
  add column if not exists raw_payload jsonb,
  add column if not exists is_message_event boolean,
  add column if not exists created_at timestamptz default now();

create index if not exists line_messages_line_user_idx
  on public.line_messages (line_user_id);
create index if not exists line_messages_destination_idx
  on public.line_messages (destination);
create index if not exists line_messages_conversation_idx
  on public.line_messages (conversation_id);

-- Ask PostgREST to reload its schema cache immediately.
notify pgrst, 'reload schema';
