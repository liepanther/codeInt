
-- Role enum
CREATE TYPE public.app_role AS ENUM ('student', 'recruiter', 'admin');
CREATE TYPE public.application_status AS ENUM ('applied', 'shortlisted', 'rejected', 'offered', 'hired');
CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'declined');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role app_role NOT NULL DEFAULT 'student',
  company_name TEXT,
  university TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User roles (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Trigger to auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role app_role;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');
  INSERT INTO public.profiles (id, email, full_name, role, company_name, university)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _role,
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'university'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Internships
CREATE TABLE public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  work_mode TEXT NOT NULL DEFAULT 'Remote',
  description TEXT NOT NULL,
  responsibilities TEXT,
  requirements TEXT,
  stipend TEXT,
  duration TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  deadline DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internships TO authenticated;
GRANT SELECT ON public.internships TO anon;
GRANT ALL ON public.internships TO service_role;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active internships public" ON public.internships FOR SELECT USING (is_active OR auth.uid() = recruiter_id);
CREATE POLICY "Recruiters create internships" ON public.internships FOR INSERT TO authenticated WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));
CREATE POLICY "Recruiters update own internships" ON public.internships FOR UPDATE TO authenticated USING (auth.uid() = recruiter_id) WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "Recruiters delete own internships" ON public.internships FOR DELETE TO authenticated USING (auth.uid() = recruiter_id);

-- Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  resume_url TEXT,
  status application_status NOT NULL DEFAULT 'applied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(internship_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own applications" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Recruiters see applications for their internships" ON public.applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.internships i WHERE i.id = internship_id AND i.recruiter_id = auth.uid()));
CREATE POLICY "Students apply" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(), 'student'));
CREATE POLICY "Students update own applications" ON public.applications FOR UPDATE TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Recruiters update applications for their internships" ON public.applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.internships i WHERE i.id = internship_id AND i.recruiter_id = auth.uid()));

-- Offer letters
CREATE TABLE public.offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_code TEXT NOT NULL UNIQUE DEFAULT ('OFR-' || upper(substr(md5(random()::text), 1, 10))),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  stipend TEXT,
  location TEXT,
  letter_body TEXT NOT NULL,
  status offer_status NOT NULL DEFAULT 'pending',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_letters TO authenticated;
GRANT SELECT ON public.offer_letters TO anon;
GRANT ALL ON public.offer_letters TO service_role;
ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Offers viewable by code (public)" ON public.offer_letters FOR SELECT USING (true);
CREATE POLICY "Recruiters issue offers" ON public.offer_letters FOR INSERT TO authenticated WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));
CREATE POLICY "Students respond to offers" ON public.offer_letters FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Recruiters update own offers" ON public.offer_letters FOR UPDATE TO authenticated USING (auth.uid() = recruiter_id);

-- Certificates
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_code TEXT NOT NULL UNIQUE DEFAULT ('CERT-' || upper(substr(md5(random()::text), 1, 12))),
  internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  performance TEXT,
  description TEXT,
  verification_hash TEXT NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT SELECT ON public.certificates TO anon;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certificates public for verification" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Recruiters issue certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));
CREATE POLICY "Recruiters update own certificates" ON public.certificates FOR UPDATE TO authenticated USING (auth.uid() = recruiter_id);
