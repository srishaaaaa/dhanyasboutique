-- Storage buckets this app needs — and why they can't be created from here.
--
-- INSERT INTO storage.buckets from the SQL Editor is silently rejected on
-- current Supabase projects: no error surfaces (a wrapped DO block with
-- EXCEPTION WHEN OTHERS never caught anything either — confirmed by
-- directly querying `SELECT * FROM storage.buckets` afterward and finding
-- the rows never landed), but the bucket never actually gets created.
-- Bucket creation is a privileged operation that goes through the Storage
-- API, not a plain table write the SQL Editor's role can perform. This
-- isn't new: 'product-images' and 'avatars' were never created by SQL
-- anywhere in this migration's history either — always assumed to already
-- exist.
--
-- Create all 4 from Dashboard -> Storage -> New bucket:
--
--   product-images   Public
--   invoices         Public
--   avatars          Public
--   receipts         Private
--
-- Once they exist, the policies below take effect automatically — they're
-- safe to run before or after bucket creation, since a storage.objects
-- policy is just a rule keyed on a bucket_id string, not a foreign key to
-- an existing bucket row.

-- product-images and avatars never had storage.objects policies defined
-- anywhere in the migration history either (invoices and receipts already
-- have theirs, from earlier migrations). product-images is written from the
-- admin/POS side, which authenticates via portal login, not Supabase Auth —
-- so it needs anon write access, matching every other "portal_manage"
-- policy in this schema.
DROP POLICY IF EXISTS product_images_public_read ON storage.objects;
CREATE POLICY product_images_public_read ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS product_images_portal_write ON storage.objects;
CREATE POLICY product_images_portal_write ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS avatars_own_write ON storage.objects;
CREATE POLICY avatars_own_write ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

NOTIFY pgrst, 'reload schema';
