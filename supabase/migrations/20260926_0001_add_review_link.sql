-- Add review_link column to store_settings for Google Review link

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS review_link TEXT NOT NULL DEFAULT 'https://g.page/r/Ccpknn3jk8O6ECA/review';

-- Update the Dhanyas Boutique record with the review link
UPDATE public.store_settings
SET review_link = 'https://g.page/r/Ccpknn3jk8O6ECA/review'
WHERE id = 1;
