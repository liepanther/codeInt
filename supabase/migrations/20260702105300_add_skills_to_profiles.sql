-- Add skills column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';
