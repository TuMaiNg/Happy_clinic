-- Add optional columns used by PaymentModel if they don't exist yet
-- Run this manually in your MySQL/MariaDB instance

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER transaction_id,
  ADD COLUMN IF NOT EXISTS order_code VARCHAR(64) NULL AFTER notes,
  ADD COLUMN IF NOT EXISTS gateway VARCHAR(32) NULL AFTER order_code,
  ADD COLUMN IF NOT EXISTS meta JSON NULL AFTER gateway;

-- Helpful index for lookups by order_code (non-unique to avoid conflicts on existing data)
CREATE INDEX IF NOT EXISTS idx_payments_order_code ON payments(order_code);

