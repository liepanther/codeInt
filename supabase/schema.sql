-- ============================================================================
-- codeInt (codeint.tech) - Complete Fresh Database Schema & Security
-- Run this in your fresh Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Enums
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'recruiter', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM ('applied', 'shortlisted', 'offered', 'hired', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'student',
  company_name TEXT,
  university TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 5. Role Helper Functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = _user_id AND (
      lower(email) LIKE 'admin@%' OR lower(email) LIKE '%@codeint.tech'
    )
  );
$$;

-- 6. Internships Table
CREATE TABLE IF NOT EXISTS public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT 'codeInt',
  description TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Remote',
  work_mode TEXT NOT NULL DEFAULT 'Remote',
  duration TEXT NOT NULL DEFAULT '1 Month',
  stipend TEXT DEFAULT 'Performance Based Stipend',
  requirements TEXT,
  responsibilities TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Applications Table (Supports both guest applicants and registered students)
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT NOT NULL UNIQUE DEFAULT ('APP-2026-' || upper(substr(md5(random()::text), 1, 8))),
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  university TEXT NOT NULL,
  degree_branch TEXT NOT NULL,
  year_of_study TEXT NOT NULL DEFAULT '3rd Year',
  stream TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'Remote',
  duration TEXT NOT NULL DEFAULT '1 Month',
  earliest_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  resume_url TEXT,
  github_portfolio TEXT,
  cover_letter TEXT,
  status public.application_status NOT NULL DEFAULT 'applied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Offer Letters Table
CREATE TABLE IF NOT EXISTS public.offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_code TEXT NOT NULL UNIQUE DEFAULT ('OFR-' || upper(substr(md5(random()::text), 1, 10))),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recruiter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT 'codeInt',
  position TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  stipend TEXT DEFAULT 'Performance Based Stipend',
  location TEXT DEFAULT 'Remote',
  letter_body TEXT NOT NULL,
  signatory_name TEXT NOT NULL DEFAULT 'Sumit Kumar',
  signatory_title TEXT NOT NULL DEFAULT 'CEO & CTO',
  status public.offer_status NOT NULL DEFAULT 'pending',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- 9. Certificates Table (Publicly verifiable via /verify and QR code)
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_code TEXT NOT NULL UNIQUE DEFAULT ('CERT-2026-' || upper(substr(md5(random()::text), 1, 10))),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recruiter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT 'codeInt',
  position TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  performance TEXT DEFAULT 'Outstanding',
  description TEXT,
  signatory_name TEXT NOT NULL DEFAULT 'Sumit Kumar',
  signatory_title TEXT NOT NULL DEFAULT 'CEO & CTO, codeInt',
  verification_hash TEXT NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internships TO authenticated;
GRANT SELECT ON public.internships TO anon;
GRANT ALL ON public.internships TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT SELECT, INSERT ON public.applications TO anon;
GRANT ALL ON public.applications TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_letters TO authenticated;
GRANT SELECT ON public.offer_letters TO anon;
GRANT ALL ON public.offer_letters TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT SELECT ON public.certificates TO anon;
GRANT ALL ON public.certificates TO service_role;

-- --- Profiles Policies ---
CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins full manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- --- Internships Policies ---
CREATE POLICY "Public view active internships" ON public.internships FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage internships" ON public.internships FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR recruiter_id = auth.uid());

-- --- Applications Policies ---
-- 1. Anyone (even guests) can submit an application via public /apply form
CREATE POLICY "Public submit applications" ON public.applications FOR INSERT WITH CHECK (true);
-- 2. Students can see their own applications
CREATE POLICY "Students see own applications" ON public.applications FOR SELECT USING (
  auth.uid() = student_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR public.is_admin(auth.uid())
);
-- 3. Admins can view and update all applications
CREATE POLICY "Admins manage applications" ON public.applications FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- --- Offer Letters Policies ---
-- 1. Public can verify/view offer letters by code
CREATE POLICY "Public view offer letters" ON public.offer_letters FOR SELECT USING (true);
-- 2. Admins can create and update offer letters
CREATE POLICY "Admins manage offer letters" ON public.offer_letters FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- --- Certificates Policies ---
-- 1. Anyone can verify certificates by code (for /verify and QR scans)
CREATE POLICY "Public verify certificates" ON public.certificates FOR SELECT USING (true);
-- 2. Admins can create, edit, and delete certificates
CREATE POLICY "Admins manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================================================
-- 11. AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role public.app_role := 'student';
BEGIN
  -- Automatically grant admin role to codeInt admins
  IF lower(new.email) LIKE 'admin@%' OR lower(new.email) LIKE '%@codeint.tech' THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN lower(EXCLUDED.email) LIKE 'admin@%' OR lower(EXCLUDED.email) LIKE '%@codeint.tech' THEN 'admin' ELSE profiles.role END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 12. INITIAL SEED DATA FOR CODEINT
-- ============================================================================

-- Seed standard internship streams so applications link cleanly
INSERT INTO public.internships (title, company, description, location, work_mode, duration, skills, is_active)
VALUES
  ('CyberSecurity Virtual Internship', 'codeInt', 'Ethical Hacking, Network Security, Vulnerability Scanning, Cryptography & Threat Mitigation', 'Remote', 'Remote', '1 Month', ARRAY['Network Security', 'Wireshark', 'PenTesting', 'OWASP Top 10', 'Linux'], true),
  ('Java Programming Virtual Internship', 'codeInt', 'Core Java, Multithreading, Spring Boot, RESTful Services & Enterprise Design Patterns', 'Remote', 'Remote', '1 Month', ARRAY['Java 17/21', 'Spring Boot', 'Hibernate', 'REST APIs', 'Microservices'], true),
  ('C++ Programming Virtual Internship', 'codeInt', 'Object-oriented C++, Low-Level Memory Management, STL, Algorithms & System Architecture', 'Remote', 'Remote', '1 Month', ARRAY['C++17/20', 'OOP', 'Data Structures', 'Algorithms', 'STL'], true),
  ('Full Stack Web Development Virtual Internship', 'codeInt', 'Modern Web Apps with React, TypeScript, Node.js, Express & Database Integration', 'Remote', 'Remote', '1 Month', ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'], true),
  ('Python Programming Virtual Internship', 'codeInt', 'Python Scripting, Web Scraping, FastAPI, Backend Automation & Data Processing', 'Remote', 'Remote', '1 Month', ARRAY['Python 3', 'FastAPI', 'Automation', 'AsyncIO'], true),
  ('Data Science & AI / ML Virtual Internship', 'codeInt', 'Data Analysis, Pandas, Machine Learning Models, Visualization & Applied AI', 'Remote', 'Remote', '1 Month', ARRAY['Python', 'Pandas', 'Scikit-Learn', 'ML Models'], true),
  ('Cloud & DevOps Virtual Internship', 'codeInt', 'Linux Systems, Docker Containers, AWS Services, CI/CD Workflows & Infrastructure', 'Remote', 'Remote', '1 Month', ARRAY['AWS', 'Docker', 'Linux Shell', 'CI/CD'], true),
  ('Android App Development Virtual Internship', 'codeInt', 'Modern Native Android Development with Kotlin, Jetpack Compose & Clean Architecture', 'Remote', 'Remote', '1 Month', ARRAY['Kotlin', 'Jetpack Compose', 'Android SDK', 'Coroutines'], true)
ON CONFLICT DO NOTHING;
