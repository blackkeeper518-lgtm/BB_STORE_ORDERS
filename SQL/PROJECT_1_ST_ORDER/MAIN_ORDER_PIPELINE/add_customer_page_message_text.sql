-- Preserve canonical customer/page message fields through tracking routing.
-- Also persist the route/audit fields emitted by node 2 and node 3.
-- Idempotent migration: safe to apply once or rerun.

alter table public."🗝️HERMES_ARCHIVE"
  add column if not exists customer_message_text text null,
  add column if not exists page_message_text text null,
  add column if not exists node2_route_signal text null,
  add column if not exists node2_tracking_request_48h boolean null,
  add column if not exists node2_tracking_request_detected boolean null,
  add column if not exists node2_tracking_request_event text null,
  add column if not exists node2_tracking_request_route_hint text null,
  add column if not exists node3_route_signal text null,
  add column if not exists node3_tracking_request_48h boolean null,
  add column if not exists node3_tracking_request_detected boolean null,
  add column if not exists node3_tracking_request_event text null,
  add column if not exists node3_tracking_request_route_hint text null,
  add column if not exists tracking_duplicate_blocked boolean null,
  add column if not exists tracking_evidence_fields jsonb null,
  add column if not exists tracking_marker_found boolean null,
  add column if not exists tracking_numbers_found_before jsonb null,
  add column if not exists tracking_request_detected boolean null;

alter table public."🌀SINGULARITY_xXx_EXCHANGE"
  add column if not exists customer_message_text text null,
  add column if not exists page_message_text text null,
  add column if not exists node2_route_signal text null,
  add column if not exists node2_tracking_request_48h boolean null,
  add column if not exists node2_tracking_request_detected boolean null,
  add column if not exists node2_tracking_request_event text null,
  add column if not exists node2_tracking_request_route_hint text null,
  add column if not exists node3_route_signal text null,
  add column if not exists node3_tracking_request_48h boolean null,
  add column if not exists node3_tracking_request_detected boolean null,
  add column if not exists node3_tracking_request_event text null,
  add column if not exists node3_tracking_request_route_hint text null,
  add column if not exists tracking_duplicate_blocked boolean null,
  add column if not exists tracking_evidence_fields jsonb null,
  add column if not exists tracking_marker_found boolean null,
  add column if not exists tracking_numbers_found_before jsonb null,
  add column if not exists tracking_request_detected boolean null;

alter table public."💀THANATOS_xXx_DEATH_NOTE"
  add column if not exists customer_message_text text null,
  add column if not exists page_message_text text null,
  add column if not exists node2_route_signal text null,
  add column if not exists node2_tracking_request_48h boolean null,
  add column if not exists node2_tracking_request_detected boolean null,
  add column if not exists node2_tracking_request_event text null,
  add column if not exists node2_tracking_request_route_hint text null,
  add column if not exists node3_route_signal text null,
  add column if not exists node3_tracking_request_48h boolean null,
  add column if not exists node3_tracking_request_detected boolean null,
  add column if not exists node3_tracking_request_event text null,
  add column if not exists node3_tracking_request_route_hint text null,
  add column if not exists tracking_duplicate_blocked boolean null,
  add column if not exists tracking_evidence_fields jsonb null,
  add column if not exists tracking_marker_found boolean null,
  add column if not exists tracking_numbers_found_before jsonb null,
  add column if not exists tracking_request_detected boolean null;
