-- Add education and experience history columns to profiles table as JSONB arrays
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_history JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_history JSONB NOT NULL DEFAULT '[]'::jsonb;
