-- Migration: invoices storage bucket policies
-- The bucket itself is NOT created here — INSERT INTO storage.buckets from
-- the SQL Editor is silently rejected on current Supabase projects (no error
-- surfaces, the row just never lands; bucket creation needs the Storage API,
-- which the SQL Editor role can't write to directly). Create it from
-- Dashboard -> Storage -> New bucket: name "invoices", Public. These
-- policies are safe to run regardless — inert until the bucket exists, and
-- take effect automatically once it's created.

DROP POLICY IF EXISTS invoices_public_read ON storage.objects;
CREATE POLICY invoices_public_read ON storage.objects FOR SELECT TO public USING (bucket_id = 'invoices');

DROP POLICY IF EXISTS invoices_portal_upload ON storage.objects;
CREATE POLICY invoices_portal_upload ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'invoices');

DROP POLICY IF EXISTS invoices_portal_update ON storage.objects;
CREATE POLICY invoices_portal_update ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'invoices') WITH CHECK (bucket_id = 'invoices');
