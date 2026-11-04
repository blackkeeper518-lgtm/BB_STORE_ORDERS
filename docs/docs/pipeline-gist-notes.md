# Pipeline reference from user-provided Gist

Source: https://gist.github.com/blackkeeper518-lgtm/021d39c6cdc2b4bb0cf91a47e56e07f2
Raw source: https://gist.githubusercontent.com/blackkeeper518-lgtm/021d39c6cdc2b4bb0cf91a47e56e07f2/raw

## Pipeline 1: Main Order Pipeline

Core input/token table: `🌍GALACTIC_GATEWAY_TOKEN`

Order tables:
- `🗝️HERMES_ARCHIVE`: normal orders, white/blue lanes
- `🌀SINGULARITY_xXx_EXCHANGE`: claim/change orders, yellow/orange lanes
- `💀THANATOS_xXx_DEATH_NOTE`: black-lane bot review/order recall table

Order views:
- `🌌MULTIVERSE_xXx_NEXUS`: combines HERMES and SINGULARITY and joins product master
- `🛰️PIONEER_xXx_CAPSULE`: packing/send queue
- `🪐ANDROMEDA_xXx_SENT`: Telegram sent room; sent orders leave the queue view
- `🌟GENESIS_xXx_HISTORY`: terminal/history log

## Pipeline 2: Tracking & Messenger Pipeline

Core tables:
- `parcels`: single tracking-number storage table
- `🧿BB_xXx_ORDERCONTROL`: required order/customer bill data
- `page_tokens_vault`: page token store

Tracking views:
- `🔮SHADOW_xXx_RECALL`: ready tracking records
- `🦅ROGUE_xXx_SHIPPINGz`: tracking joined with order data
- `⛩️VOID_xXx_GATEWAYz`: final join with page tokens and send gateway
- `📓DEAD_xXx_NOTE`: sent tracking history

Rule: after sending, update `parcels.delivery_status = '🔥SENT'` and `sent_at`; sent records leave the active views.

## Cleanup interpretation

Keep active application code, n8n workflows/scripts, SQL/schema, and documentation that directly implement or verify the two pipelines above. Candidate duplicates are nested copies in `n8n/`, `tools/`, and `BB_STORE_ORDERS-991354f7609c5bb1c551993b14f71382603fe9cc/`; most files are byte-identical to root equivalents. Do not delete database data or SQL migration/reference files merely because they are historical until the user confirms the exact deletion set.
