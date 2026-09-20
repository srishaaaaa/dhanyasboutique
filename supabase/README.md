# Dhanyas Boutique Supabase setup

## Quickest path: one file

Run **`supabase/all_in_one_setup.sql`** in the Supabase SQL Editor (dashboard → SQL Editor → New query → paste the whole file → Run). It sets up everything in one go: schema, tables, RPC functions, store settings, and the Dhanyas Boutique saree catalogue — plus a few bug fixes (payment method whitelist, a missing `invoice_pdf_url` column, and RLS policies that would otherwise block the admin dashboard) that weren't captured in any individual migration file.

It's safe to re-run if something fails partway through — every statement is idempotent.

**One manual step this file can't do:** storage buckets. `INSERT INTO storage.buckets` from the SQL Editor is silently rejected by Supabase (no error, the row just never lands) — creating a bucket is a privileged Storage API operation. After running the file, go to **Dashboard → Storage → New bucket** and create:

| Bucket | Visibility |
| --- | --- |
| `product-images` | Public |
| `invoices` | Public |
| `avatars` | Public |
| `receipts` | Private |

The storage policies for all 4 are already set up by the SQL and activate automatically the moment each bucket exists — nothing else to run afterward.

After it runs, create the owner account in Supabase Authentication and set its `role` metadata to `admin` if customer login is enabled.

## Alternative: migrations one at a time

`all_in_one_setup.sql` is generated from the files in `supabase/migrations/`, run in filename order. If you'd rather apply them individually (e.g. to track which one introduces an issue), run them in that same filename order, ending with `20260920_0001_ensure_storage_buckets.sql`.

## Notes

The schema migration is idempotent. Invoice numbers are generated as sequential 8-digit values (see `20260722_0005_eight_digit_invoice_numbers.sql`) and displayed on-screen with an `INV` prefix; allocation happens under a locked database counter/sequence to prevent duplicates during concurrent billing.
