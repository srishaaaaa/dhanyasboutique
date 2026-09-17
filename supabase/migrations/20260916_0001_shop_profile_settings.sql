-- Shop / Company profile settings.
--
-- Extends the EXISTING public.store_settings singleton (id = 1) with the few
-- columns it was missing so the Store Settings screen can manage all 10 shop
-- details from one source of truth. No new settings table, no duplicate shop
-- record, no changes to customers, orders, invoices or products.

-- 1. Missing shop-profile columns (additive only).
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS business_type  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shop_contact   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_id   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url       TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS card_color     TEXT NOT NULL DEFAULT '#8F1402';

-- store_settings.email is NOT NULL; the Store Settings form allows it to be
-- cleared, so an empty string must be acceptable.
ALTER TABLE public.store_settings ALTER COLUMN email SET DEFAULT '';

-- 2. Current shop information for SRI SAKTHI PUGAZH TEX.
--    Only the shop-profile row (id = 1) is touched. Existing non-empty values
--    for the newer columns are preserved; the identity fields are set to the
--    details supplied by the shop owner.
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
  '#8F1402'
)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  owner_name    = EXCLUDED.owner_name,
  phone         = EXCLUDED.phone,
  address       = EXCLUDED.address,
  -- email is left blank rather than inheriting the previous brand's address;
  -- the owner can fill it in from Store Settings.
  email         = '',
  business_type = EXCLUDED.business_type,
  shop_contact  = EXCLUDED.shop_contact,
  instagram_id  = EXCLUDED.instagram_id,
  -- never clobber an already-uploaded logo or an already-chosen card colour
  logo_url      = COALESCE(NULLIF(public.store_settings.logo_url, ''), EXCLUDED.logo_url),
  card_color    = COALESCE(NULLIF(public.store_settings.card_color, ''), EXCLUDED.card_color),
  updated_at    = NOW();

-- 3. Saree catalogue.
--    Reuses the EXISTING public.categories / public.products architecture —
--    no new product system. Only adds the saree categories so the existing
--    product/catalogue screens can hold saree stock.
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

-- 4. Logo storage reuses the existing public 'product-images' bucket
--    (see src/lib/storage.ts) under a branding/ prefix — no new bucket.
