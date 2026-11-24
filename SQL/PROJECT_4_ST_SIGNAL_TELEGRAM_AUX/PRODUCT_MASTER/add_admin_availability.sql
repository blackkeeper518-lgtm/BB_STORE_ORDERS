-- Run this in the ROOM 04 (Private Vault) Supabase SQL Editor before deploying the app change.
-- This separates the admin-facing availability toggle from physical stock quantity.
-- Existing rows remain NULL and continue to derive their display state from stock_status/stock_qty.

ALTER TABLE public."🛒product_master"
  ADD COLUMN IF NOT EXISTS admin_availability text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_master_admin_availability_check'
      AND conrelid = 'public."🛒product_master"'::regclass
  ) THEN
    ALTER TABLE public."🛒product_master"
      ADD CONSTRAINT product_master_admin_availability_check
      CHECK (admin_availability IS NULL OR admin_availability IN ('IN_STOCK', 'OUT_OF_STOCK'));
  END IF;
END
$$;

COMMENT ON COLUMN public."🛒product_master".admin_availability IS
  'Admin UI availability override; does not replace physical stock_qty or stock-triggered dynamic bill headers.';
