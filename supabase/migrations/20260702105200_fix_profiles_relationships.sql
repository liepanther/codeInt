-- Fix foreign keys in applications to reference profiles(id) instead of auth.users(id)
ALTER TABLE public.applications 
  DROP CONSTRAINT IF EXISTS applications_student_id_fkey,
  ADD CONSTRAINT applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix foreign keys in internships to reference profiles(id) instead of auth.users(id)
ALTER TABLE public.internships 
  DROP CONSTRAINT IF EXISTS internships_recruiter_id_fkey,
  ADD CONSTRAINT internships_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix foreign keys in offer_letters to reference profiles(id) instead of auth.users(id)
ALTER TABLE public.offer_letters 
  DROP CONSTRAINT IF EXISTS offer_letters_student_id_fkey,
  ADD CONSTRAINT offer_letters_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS offer_letters_recruiter_id_fkey,
  ADD CONSTRAINT offer_letters_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix foreign keys in certificates to reference profiles(id) instead of auth.users(id)
ALTER TABLE public.certificates 
  DROP CONSTRAINT IF EXISTS certificates_student_id_fkey,
  ADD CONSTRAINT certificates_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS certificates_recruiter_id_fkey,
  ADD CONSTRAINT certificates_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
