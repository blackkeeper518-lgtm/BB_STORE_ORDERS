-- Per-message text contract for the two source-of-truth chat tables.
-- Cust rows store customer_message_text; Pg rows store page_message_text.
-- Keep message_text for backwards compatibility with existing readers.

ALTER TABLE public."Cust_Chat⭐BINARY_xXx_STAR"
  ADD COLUMN IF NOT EXISTS customer_message_text text;

ALTER TABLE public."Pg_Chat⭐BINARY_xXx_STAR"
  ADD COLUMN IF NOT EXISTS page_message_text text;
