-- Adds 'reconciliation' (set-exact-count stock takes) as a first-class
-- inventory_logs.reason, alongside sale/restock/return/manual_adjustment/loss.
-- Until this migration is applied, the app logs reconciliation adjustments
-- as 'manual_adjustment' so it doesn't hit the old constraint.

ALTER TABLE public.inventory_logs DROP CONSTRAINT IF EXISTS inventory_logs_reason_check;

ALTER TABLE public.inventory_logs
  ADD CONSTRAINT inventory_logs_reason_check
  CHECK (reason IN ('sale', 'restock', 'return', 'manual_adjustment', 'loss', 'reconciliation'));
