-- Rebrand to Dhanyas Boutique: shop profile, deep-purple colour theme, and a
-- real saree catalogue pulled from https://dhanyasboutique.com/ in place of
-- the generic starter placeholders seeded earlier. Only the shop-profile row
-- (id = 1) and the named product/category rows below are touched — customers,
-- orders, invoices and every other table are untouched.

BEGIN;

-- 1. Shop profile shown across invoices, receipts and the app header.
INSERT INTO public.store_settings (
  id, name, owner_name, phone, email, address,
  business_type, shop_contact, instagram_id, logo_url, card_color
)
VALUES (
  1,
  'Dhanyas Boutique',
  'Ananthi M',
  '80980 89591',
  'dhanyasboutique2015@gmail.com',
  'Kasthoribhai Road, AGM Apartment, Kumbakonam - 612001',
  'SAREE WHOLESALE & RETAIL',
  '80980 89591',
  '@ananthinathan84',
  '',
  '#31042F'
)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  owner_name    = EXCLUDED.owner_name,
  phone         = EXCLUDED.phone,
  email         = EXCLUDED.email,
  address       = EXCLUDED.address,
  business_type = EXCLUDED.business_type,
  shop_contact  = EXCLUDED.shop_contact,
  instagram_id  = EXCLUDED.instagram_id,
  -- never clobber an already-uploaded logo; the bundled public/logo.png is
  -- used when this is blank
  logo_url      = COALESCE(NULLIF(public.store_settings.logo_url, ''), EXCLUDED.logo_url),
  card_color    = EXCLUDED.card_color,
  updated_at    = NOW();

-- 2. Retire the generic starter-catalogue placeholders (3 sample items x 16
-- saree categories, seeded before real product data was available) now that
-- the real catalogue below replaces them. Matches by exact name only, so any
-- of these already edited from the Inventory screen keeps its new name and
-- is left alone.
UPDATE public.products
SET is_active = FALSE, updated_at = NOW()
WHERE LOWER(BTRIM(name)) IN (
  'traditional kanchipuram silk saree', 'temple border kanchipuram silk saree', 'bridal kanchipuram silk saree',
  'plain soft silk saree', 'zari border soft silk saree', 'printed soft silk saree',
  'pure banarasi silk saree', 'banarasi katan silk saree', 'banarasi georgette saree',
  'handloom cotton saree', 'chettinad cotton saree', 'printed cotton saree',
  'mysore silk saree', 'tussar silk saree', 'art silk saree',
  'pure linen saree', 'printed linen saree', 'linen by linen saree',
  'plain organza saree', 'floral organza saree', 'embellished organza saree',
  'plain chiffon saree', 'printed chiffon saree', 'georgette chiffon saree',
  'plain georgette saree', 'printed georgette saree', 'embroidered georgette saree',
  'designer net saree', 'designer party wear saree', 'designer bridal saree',
  'bridal banarasi saree', 'red bridal silk saree', 'maroon bridal kanchipuram saree',
  'net party wear saree', 'sequin party wear saree', 'shimmer party wear saree',
  'fancy printed saree', 'fancy net saree', 'fancy embellished saree',
  'floral printed saree', 'abstract printed saree', 'digital printed saree',
  'thread embroidered saree', 'zari embroidered saree', 'stone embroidered saree',
  'traditional cotton saree', 'traditional handloom saree', 'traditional silk saree'
);

-- 3. Real Dhanyas Boutique merchandising categories not already covered by
-- the existing fabric categories (Silk / Banarasi / Cotton Sarees, reused
-- below for the matching real products).
INSERT INTO public.categories (name_en, name_ta, is_active, sort_order)
VALUES
  ('Banarasi Mashru Silk Sarees',  '', TRUE, 20),
  ('Banarasi Raw Silk Sarees',     '', TRUE, 21),
  ('Maheshwari Silk Cotton Sarees','', TRUE, 22),
  ('Lehengas',                     '', TRUE, 23),
  ('Salwar Kameez Sets',           '', TRUE, 24),
  ('Trending Sarees',              '', TRUE, 25),
  ('Couple Combo Sets',            '', TRUE, 26),
  ('Bridal Silk Sarees',           '', TRUE, 27),
  ('Celebrity Collections',        '', TRUE, 28),
  ('Kalyani Cotton Sarees',        '', TRUE, 29),
  ('Kanjeevaram Soft Silk Sarees', '', TRUE, 30),
  ('Banarasi Tissue Silk Sarees',  '', TRUE, 31)
ON CONFLICT (name_en) DO UPDATE SET
  is_active  = TRUE,
  updated_at = NOW();

-- 4. Real catalogue (name, category, sale price, MRP, description). Pulled
-- from the live site on 2026-09-19; every item showed as Sold Out there, so
-- stock starts at 0 — enter real counts from the Inventory screen as stock
-- arrives, rather than risk overselling on a stale placeholder number.
WITH catalog(category_name, product_name, price, mrp, description, sort_order) AS (
  VALUES
    -- Silk Sarees
    ('Silk Sarees', 'Graceful Grandeur: Mysore Silk Elegance with Two-Tone Padding Border', 899, 899,
      'Heavy Mysore silk saree with a two-tone padding border. Available in Green, Chocolate Brown, Navy Blue, Peacock Blue and more.', 2001),
    ('Silk Sarees', 'Actress Trisha Inspired Soft Silk Saree with Floral Design & Rich Pallu', 1999, 2799,
      'Soft silk saree with a floral design and a rich pallu.', 2002),
    -- Banarasi Sarees
    ('Banarasi Sarees', 'Premium Banarasi Katan Silk Saree - Elegant Vintage Shades', 1599, 2999,
      'Banarasi soft Katan silk saree in Orange, vintage shades.', 2101),
    ('Banarasi Sarees', 'Blue Banarasi Kathan Gorgette Silk Saree', 1699, 3599,
      'Banarasi soft silk Kathan Gorgette saree in Royal Blue. Includes a free tassel.', 2102),
    ('Banarasi Sarees', 'Royal Elegance in Brown & Pink Banarasi Semi Katan Silk', 1799, 2999,
      'Banarasi Semi Katan silk saree in Brown & Pink.', 2103),
    ('Banarasi Sarees', 'Yellow Banarasi Kathan Dupion Silk Saree', 2299, 4999,
      'Handwoven Banarasi Kathan Dupion silk saree in Yellow.', 2104),
    ('Banarasi Sarees', 'Traditional Coffee Brown Kathan Silk Elegance', 1699, 2799,
      'Kathan silk saree in Coffee Brown.', 2105),
    -- Cotton Sarees
    ('Cotton Sarees', 'Nayanthara Maroon Handloom Saree with Gold Zari Pallu', 1199, 1999,
      'Khadi handloom saree in Maroon with a gold zari pallu.', 2201),
    ('Cotton Sarees', 'Traditional Kalamkari Print Cotton Saree', 799, 1299,
      'Pure cotton saree with a Kalamkari-inspired print in Brown and Yellow.', 2202),
    ('Cotton Sarees', 'Rashmika Mandanna Inspired Mul Cotton Sequins Saree - Light Peach', 1299, 2499,
      'Mul cotton saree with sequins embellishment in Light Peach.', 2203),
    ('Cotton Sarees', 'Mustard Gold Kalamkari Heritage Saree', 1199, 2399,
      'Kalamkari cotton saree with a rich temple design in Mustard Gold.', 2204),
    -- Banarasi Mashru Silk Sarees
    ('Banarasi Mashru Silk Sarees', 'Purple Color Banarasi Mashru Silk Saree', 6799, 9999,
      'Banarasi Mashru silk saree in Purple.', 2301),
    ('Banarasi Mashru Silk Sarees', 'Green Color Banarasi Mashru Silk Saree', 6799, 9999,
      'Banarasi Mashru silk saree in Green.', 2302),
    -- Banarasi Raw Silk Sarees
    ('Banarasi Raw Silk Sarees', 'Royal Purple Semi Raw Mango Soft Silk Saree with Zari Weaving Border', 3499, 5999,
      'Semi raw Mango soft silk saree with a zari weaving border in Royal Purple.', 2401),
    ('Banarasi Raw Silk Sarees', 'Berry Pink Semi Raw Mango Soft Silk Saree with Zari Weaving Border', 3499, 5999,
      'Semi raw Mango soft silk saree with a zari weaving border in Berry Pink.', 2402),
    ('Banarasi Raw Silk Sarees', 'Pastel Green Semi Raw Mango Soft Silk Saree with Zari Weaving Border', 3499, 5999,
      'Semi raw Mango soft silk saree with a zari weaving border in Pastel Green.', 2403),
    ('Banarasi Raw Silk Sarees', 'Silver Banarasi Raw Silk Saree', 3499, 5999,
      'Banarasi soft raw Mango silk saree in Silver.', 2404),
    ('Banarasi Raw Silk Sarees', 'Beige Banarasi Raw Silk Saree', 3499, 5999,
      'Banarasi soft raw Mango silk saree in Beige.', 2405),
    ('Banarasi Raw Silk Sarees', 'Sky Blue Banarasi Raw Silk Saree', 3499, 5999,
      'Banarasi soft raw Mango silk saree in Sky Blue.', 2406),
    -- Maheshwari Silk Cotton Sarees
    ('Maheshwari Silk Cotton Sarees', 'Lavender Mist Elegance - Maheshwari Silk Cotton Saree', 1499, 1999,
      'Lightweight, comfortable Maheshwari silk-cotton blend saree in Lavender.', 2501),
    ('Maheshwari Silk Cotton Sarees', 'Royal Purple & Bottle Green Maheshwari Silk Cotton Soft Saree', 1499, 1999,
      'Silk-cotton blend saree in Royal Purple & Bottle Green.', 2502),
    ('Maheshwari Silk Cotton Sarees', 'Aqua Teal Maheshwari Silk Cotton Soft Saree', 1499, 1999,
      'Silk-cotton blend saree in Aqua Teal.', 2503),
    ('Maheshwari Silk Cotton Sarees', 'Starstruck Blue - Nayanthara Inspired Saree', 1499, 1999,
      'Silk-cotton blend saree in Blue.', 2504),
    ('Maheshwari Silk Cotton Sarees', 'Antique Gold Olive Maheshwari Silk Cotton Soft Saree', 1499, 1999,
      'Silk-cotton blend saree in Antique Gold & Olive.', 2505),
    ('Maheshwari Silk Cotton Sarees', 'Plum Purple Maheshwari Silk Cotton Soft Saree', 1499, 1999,
      'Silk-cotton blend saree in Plum Purple.', 2506),
    ('Maheshwari Silk Cotton Sarees', 'Soft & Graceful Bottle Green Maheshwari Silk Cotton Saree', 1499, 1999,
      'Silk-cotton blend saree in Bottle Green.', 2507),
    ('Maheshwari Silk Cotton Sarees', 'Elegant Aqua Blue Maheshwari Silk Cotton Soft Saree', 1499, 1999,
      'Silk-cotton blend saree in Aqua Blue.', 2508),
    ('Maheshwari Silk Cotton Sarees', 'Golden Mustard Maheshwari Silk Cotton Soft Saree', 1499, 1999,
      'Silk-cotton blend saree in Golden Mustard.', 2509)
), resolved AS (
  SELECT c.id AS category_id, c.name_en AS category_name, catalog.product_name, catalog.price,
         catalog.mrp, catalog.description, catalog.sort_order
  FROM catalog
  JOIN public.categories c ON LOWER(c.name_en) = LOWER(catalog.category_name)
)
INSERT INTO public.products (
  name, category, category_id, price, purchase_price, mrp, unit_type, unit_label,
  unit, base_quantity, stock_quantity, opening_stock, stock, stock_unit,
  allow_decimal_quantity, predefined_options, description, is_active, sort_order
)
SELECT
  resolved.product_name,
  resolved.category_name,
  resolved.category_id,
  resolved.price,
  0,
  resolved.mrp,
  'unit',
  'piece',
  'piece',
  1,
  0,
  0,
  0,
  'piece',
  FALSE,
  '[]'::JSONB,
  resolved.description,
  TRUE,
  resolved.sort_order
FROM resolved
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products p
  WHERE LOWER(BTRIM(p.name)) = LOWER(BTRIM(resolved.product_name))
);

NOTIFY pgrst, 'reload schema';

COMMIT;
