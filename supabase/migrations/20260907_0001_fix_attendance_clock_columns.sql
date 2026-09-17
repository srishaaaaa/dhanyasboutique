-- Fix the staff attendance clock columns. Migration 0001 (new_modules)
-- created public.attendance with a column named check_in_time and no
-- clock-out column at all, but both StaffPunch.tsx (the public self-punch
-- page) and Attendance.tsx (the admin view) read/write clock_in and
-- clock_out — a naming mismatch that has never worked, since PostgREST
-- errors with "Could not find the 'clock_in' column of 'attendance' in the
-- schema cache" on every Punch In attempt. Rename the existing column
-- (preserving any punch-in history already recorded) and add the missing
-- clock_out column.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'check_in_time'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'clock_in'
  ) THEN
    ALTER TABLE public.attendance RENAME COLUMN check_in_time TO clock_in;
  END IF;
END;
$$;

ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS clock_in TIMESTAMPTZ;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS clock_out TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
