# BB STORE — Alien package

- client/src/pages/AlienRoom.tsx
- client/src/lib/canonical.ts
- n8n/SINGTO_V4_3_3_PRODUCT_PARSER.js
- sql/BB_ORDERS_FULL_REFERENCE_COLUMNS.sql

DEPLOYMENT_CAMP: BB
Order table: public.bb_orders
Customer History: normalized_chat_timeline
Product display: product_master.master_display_for_packer
Rule: MATCHED only with evidence + Master Display; otherwise REVIEW/RAW_MISSING, never drop orders.
