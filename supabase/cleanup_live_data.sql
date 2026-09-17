-- ============================================================
-- One-off cleanup: remove old-business data, keep only Sri Sakthi
-- Pugazh Tex (saree wholesale & retail).
--
-- Your live database still has leftover data from earlier
-- template runs of this app (a "Rice n' Rooster" fried-rice/chicken
-- menu, and before that a Sankaranarayanan tailoring price list) —
-- that's why the running app still shows a fried-rice/chicken
-- catalog and the wrong shop name/address/logo colour despite every
-- code-level fix. This script fixes the DATA to match the current
-- business.
--
-- Safe to run as-is in the Supabase SQL Editor:
--   - Wrapped in one transaction — if anything fails, nothing changes.
--   - Every statement is idempotent — safe to run more than once.
--   - Deleting old products does NOT touch past orders/invoices:
--     orders.order_items.product_id is ON DELETE SET NULL, so sale
--     history is preserved (order_items already stores its own
--     name/price snapshot at time of sale).
--   - Does NOT touch customers, orders, invoices, attendance, or
--     expenses — only store_settings, categories, and products.
-- ============================================================

BEGIN;

-- 1. Make sure store_settings has every shop-profile column the app
-- uses (additive only — no-op if already present).
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS business_type  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shop_contact   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_id   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url       TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS card_color     TEXT NOT NULL DEFAULT '#A00818';
ALTER TABLE public.store_settings ALTER COLUMN email SET DEFAULT '';

-- 2. Correct shop profile for Sri Sakthi Pugazh Tex (matches
-- src/lib/brand.ts DEFAULT_SHOP_PROFILE). Overwrites whatever an
-- earlier template run (different owner/address/menu) left behind.
-- card_color is set to the exact red sampled from the current logo.
INSERT INTO public.store_settings (
  id, name, owner_name, phone, email, address,
  business_type, shop_contact, instagram_id, logo_url, card_color
)
VALUES (
  1,
  'SRI SAKTHI PUGAZH TEX',
  'SHANMUGAPRIYA',
  '73586 70411',
  '',
  'NO. 185, LE SITHARAS SQUARE, MUDICHUR ROAD, NEXT TO HP PETROL PUMP, MUDICHUR, CHENNAI - 600048',
  'SAREE WHOLESALE & RETAIL',
  '73586 70411',
  '@srisakthipugazhtex',
  '',
  '#A00818'
)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  owner_name    = EXCLUDED.owner_name,
  phone         = EXCLUDED.phone,
  address       = EXCLUDED.address,
  email         = '',
  business_type = EXCLUDED.business_type,
  shop_contact  = EXCLUDED.shop_contact,
  instagram_id  = EXCLUDED.instagram_id,
  -- never clobber an already-uploaded logo
  logo_url      = COALESCE(NULLIF(public.store_settings.logo_url, ''), EXCLUDED.logo_url),
  card_color    = EXCLUDED.card_color,
  updated_at    = NOW();

-- 3. Delete every product from the old catalogs — the Rice n' Rooster
-- fried-rice/chicken-combo menu and the earlier tailoring/saree
-- placeholder price list. None of this belongs to the current
-- saree wholesale & retail business.
DELETE FROM public.products
WHERE category_id IN (
  SELECT id FROM public.categories
  WHERE name_en IN (
    'Fried Rice', 'Specialty Chicken Combos',
    'Tailoring', 'Saree', 'Salwar', 'Nighty',
    'Jewellery & Accessories', 'Posstore', 'Sarees, Salwar & Nighty'
  )
)
OR (
  category_id IS NULL AND category IN (
    'Fried Rice', 'Specialty Chicken Combos',
    'Tailoring', 'Saree', 'Salwar', 'Nighty',
    'Jewellery & Accessories', 'Posstore', 'Sarees, Salwar & Nighty'
  )
);

-- 4. Delete the old categories themselves.
DELETE FROM public.categories
WHERE name_en IN (
  'Fried Rice', 'Specialty Chicken Combos',
  'Tailoring', 'Saree', 'Salwar', 'Nighty',
  'Jewellery & Accessories', 'Posstore', 'Sarees, Salwar & Nighty'
);

-- 5. Install the real saree catalogue for this business (idempotent —
-- reactivates them if they already exist). Actual products/prices are
-- added from the Inventory screen since saree pricing varies per item.
INSERT INTO public.categories (name_en, name_ta, is_active, sort_order)
VALUES
  ('Kanchipuram Silk Sarees', '', TRUE, 1),
  ('Soft Silk Sarees',        '', TRUE, 2),
  ('Banarasi Sarees',         '', TRUE, 3),
  ('Cotton Sarees',           '', TRUE, 4),
  ('Silk Sarees',             '', TRUE, 5),
  ('Linen Sarees',            '', TRUE, 6),
  ('Organza Sarees',          '', TRUE, 7),
  ('Chiffon Sarees',          '', TRUE, 8),
  ('Georgette Sarees',        '', TRUE, 9),
  ('Designer Sarees',         '', TRUE, 10),
  ('Bridal Sarees',           '', TRUE, 11),
  ('Party Wear Sarees',       '', TRUE, 12),
  ('Fancy Sarees',            '', TRUE, 13),
  ('Printed Sarees',          '', TRUE, 14),
  ('Embroidered Sarees',      '', TRUE, 15),
  ('Traditional Sarees',      '', TRUE, 16)
ON CONFLICT (name_en) DO UPDATE SET
  is_active  = TRUE,
  updated_at = NOW();

-- 6. Reload PostgREST's schema cache so the API picks up the column
-- changes immediately instead of waiting for its next auto-refresh.
NOTIFY pgrst, 'reload schema';

COMMIT;
