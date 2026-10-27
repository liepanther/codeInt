import { supabase } from "@/integrations/supabase/client";

export interface StreamOption {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  skills: string[];
  color: string;
  gradient: string;
}

export const STREAM_OPTIONS: StreamOption[] = [
  {
    id: "cpp",
    name: "C++ Programming",
    badge: "Systems & DSA",
    tagline: "Object-oriented C++, Low-Level Memory Management, STL, Algorithms & System Architecture",
    skills: ["C++17/20", "OOP", "Data Structures", "Algorithms", "Pointers & Memory", "STL"],
    color: "#2563EB",
    gradient: "from-blue-600/15 via-blue-500/10 to-transparent",
  },
  {
    id: "java",
    name: "Java Programming",
    badge: "Enterprise & Backend",
    tagline: "Core Java, Multithreading, Spring Boot, RESTful Services & Enterprise Design Patterns",
    skills: ["Java 17/21", "Spring Boot", "OOP", "Hibernate / JPA", "REST APIs", "Microservices"],
    color: "#D97706",
    gradient: "from-amber-600/15 via-amber-500/10 to-transparent",
  },
  {
    id: "cybersecurity",
    name: "CyberSecurity",
    badge: "Security & Defense",
    tagline: "Ethical Hacking, Network Security, Vulnerability Scanning, Cryptography & Threat Mitigation",
    skills: ["Network Security", "Ethical Hacking", "Wireshark", "OWASP Top 10", "PenTesting", "Linux"],
    color: "#DC2626",
    gradient: "from-red-600/15 via-red-500/10 to-transparent",
  },
  {
    id: "python",
    name: "Python Programming",
    badge: "Automation & APIs",
    tagline: "Python Scripting, Web Scraping, FastAPI, Backend Automation & Data Processing",
    skills: ["Python 3", "FastAPI", "Automation", "AsyncIO", "Web Scraping", "Data Handling"],
    color: "#059669",
    gradient: "from-emerald-600/15 via-emerald-500/10 to-transparent",
  },
  {
    id: "web-dev",
    name: "Full Stack Web Development",
    badge: "React & Node.js",
    tagline: "Modern Web Apps with React, TypeScript, Node.js, Express & Database Integration",
    skills: ["React", "TypeScript", "Node.js", "Tailwind CSS", "PostgreSQL", "Next.js"],
    color: "#7C3AED",
    gradient: "from-purple-600/15 via-purple-500/10 to-transparent",
  },
  {
    id: "data-science",
    name: "Data Science & AI / ML",
    badge: "Analytics & ML",
    tagline: "Data Analysis, Pandas, Machine Learning Models, Visualization & Applied AI",
    skills: ["Python", "Pandas", "Scikit-Learn", "Data Viz", "ML Models", "Feature Eng"],
    color: "#0891B2",
    gradient: "from-cyan-600/15 via-cyan-500/10 to-transparent",
  },
  {
    id: "cloud-devops",
    name: "Cloud & DevOps",
    badge: "AWS & Containers",
    tagline: "Linux Systems, Docker Containers, AWS Services, CI/CD Workflows & Infrastructure",
    skills: ["AWS", "Docker", "Linux Shell", "CI/CD", "Git Actions", "Cloud Arch"],
    color: "#4F46E5",
    gradient: "from-indigo-600/15 via-indigo-500/10 to-transparent",
  },
  {
    id: "android",
    name: "Android App Development",
    badge: "Kotlin & Mobile",
    tagline: "Modern Native Android Development with Kotlin, Jetpack Compose & Clean Architecture",
    skills: ["Kotlin", "Jetpack Compose", "Android SDK", "MVVM", "Coroutines", "Firebase"],
    color: "#16A34A",
    gradient: "from-green-600/15 via-green-500/10 to-transparent",
  },
];

export interface InternshipApplication {
  id: string;
  ref_code: string;
  student_id?: string;
  full_name: string;
  email: string;
  phone: string;
  university: string;
  degree_branch: string;
  year_of_study: string;
  stream: string;
  mode: "Remote" | "Hybrid" | "In-Office";
  duration: string;
  earliest_start_date: string;
  resume_url?: string;
  github_portfolio?: string;
  cover_letter?: string;
  status: "applied" | "shortlisted" | "offered" | "hired" | "rejected";
  created_at: string;
  offer_letter?: any;
}

const APPS_STORAGE_KEY = "internly_stream_applications_v2";
const OFFERS_STORAGE_KEY = "internly_stream_offers_v2";
const CERTS_STORAGE_KEY = "internly_stream_certificates_v2";

export const SEED_CERTIFICATES: any[] = [];

const SEED_APPLICATIONS: InternshipApplication[] = [];

export function getStoredApplications(): InternshipApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredApplications(apps: InternshipApplication[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
  } catch (err) {
    console.error("Failed saving applications to storage:", err);
  }
}

export function getStoredOffers(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredOffers(offers: any[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
  } catch (err) {
    console.error("Failed saving offers to storage:", err);
  }
}

export function getStoredCertificates(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CERTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredCertificates(certs: any[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CERTS_STORAGE_KEY, JSON.stringify(certs));
  } catch (err) {
    console.error("Failed saving certificates to storage:", err);
  }
}

export async function submitInternshipApplication(
  data: Omit<InternshipApplication, "id" | "ref_code" | "created_at" | "status">
): Promise<{ success: boolean; application: InternshipApplication; error?: string }> {
  const streamCode = data.stream
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const refCode = `APP-2026-${streamCode}-${randomSuffix}`;
  let id = "app-" + Math.random().toString(36).slice(2, 11);

  // 1. Insert directly into Supabase applications table
  try {
    const { data: authData } = await supabase.auth.getSession();
    const user = authData?.session?.user;

    const { data: inserted, error: sbError } = await supabase
      .from("applications")
      .insert({
        ref_code: refCode,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        university: data.university,
        degree_branch: data.degree_branch,
        year_of_study: data.year_of_study,
        stream: data.stream,
        mode: data.mode || "Remote",
        duration: data.duration || "1 Month",
        earliest_start_date: data.earliest_start_date || new Date().toISOString().split("T")[0],
        resume_url: data.resume_url || null,
        github_portfolio: data.github_portfolio || null,
        cover_letter: data.cover_letter || null,
        student_id: user?.id || null,
        status: "applied",
      })
      .select()
      .maybeSingle();

    if (inserted && !sbError) {
      id = inserted.id;
    }
  } catch (err) {
    console.warn("Supabase background sync:", err);
  }

  const newApp: InternshipApplication = {
    ...data,
    id,
    ref_code: refCode,
    status: "applied",
    created_at: new Date().toISOString(),
  };

  // 2. Persist in local storage as well for instant UI response
  const current = getStoredApplications();
  const updated = [newApp, ...current];
  saveStoredApplications(updated);

  return { success: true, application: newApp };
}

export async function updateApplicationStatus(
  appId: string,
  newStatus: InternshipApplication["status"]
): Promise<boolean> {
  const current = getStoredApplications();
  const idx = current.findIndex((a) => a.id === appId);
  if (idx === -1) return false;

  current[idx] = { ...current[idx], status: newStatus };
  saveStoredApplications(current);

  // Sync with Supabase if applicable
  try {
    await supabase.from("applications").update({ status: newStatus }).eq("id", appId);
  } catch {}

  return true;
}

export interface GenerateOfferParams {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  candidateId?: string;
  stream: string;
  position: string;
  companyName: string;
  issueDate?: string;
  startDate: string;
  endDate: string;
  stipend: string;
  location: string;
  letterBody: string;
  adminId?: string;
}

export async function generateAndIssueOffer(params: GenerateOfferParams): Promise<{ success: boolean; offer: any; error?: string }> {
  const streamCode = params.stream.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const offerCode = `OFR-INTN-${streamCode}-${randNum}`;
  const offerId = "ofr-" + Math.random().toString(36).slice(2, 11);

  const offerRecord = {
    id: offerId,
    offer_code: offerCode,
    application_id: params.applicationId,
    student_id: params.candidateId || "MEMBER-" + randNum,
    student_name: params.candidateName,
    company_name: params.companyName || "codeInt",
    position: params.position || `${params.stream}`,
    start_date: params.startDate,
    end_date: params.endDate,
    stipend: params.stipend || "Performance Based Stipend",
    location: params.location || "Remote",
    letter_body: params.letterBody,
    signatory_name: "Sumit Kumar",
    signatory_title: "CEO & CTO",
    status: "pending",
    issued_at: params.issueDate ? new Date(params.issueDate).toISOString() : new Date().toISOString(),
    responded_at: null,
  };

  // 1. Update application status to 'offered'
  const currentApps = getStoredApplications();
  const appIndex = currentApps.findIndex((a) => a.id === params.applicationId);
  if (appIndex !== -1) {
    currentApps[appIndex] = {
      ...currentApps[appIndex],
      status: "offered",
      offer_letter: offerRecord,
    };
    saveStoredApplications(currentApps);
  }

  // 2. Save offer to storage
  const currentOffers = getStoredOffers();
  saveStoredOffers([offerRecord, ...currentOffers]);

  // 3. Sync to Supabase directly
  try {
    const { data: authData } = await supabase.auth.getSession();
    const user = authData?.session?.user;

    const { data: insertedOffer } = await supabase
      .from("offer_letters")
      .insert({
        offer_code: offerCode,
        student_name: params.candidateName,
        company_name: params.companyName || "codeInt",
        position: params.position || params.stream,
        start_date: params.startDate,
        end_date: params.endDate,
        stipend: params.stipend || "Performance Based Stipend",
        location: params.location || "Remote",
        letter_body: params.letterBody,
        status: "pending",
        issued_at: params.issueDate ? new Date(params.issueDate).toISOString() : new Date().toISOString(),
        recruiter_id: user?.id || null,
      })
      .select()
      .maybeSingle();

    if (insertedOffer) {
      offerRecord.id = insertedOffer.id;
    }
  } catch (err) {
    console.warn("Supabase offer letters sync:", err);
  }

  return { success: true, offer: offerRecord };
}

export interface GenerateCertificateParams {
  applicationId?: string;
  candidateName: string;
  candidateEmail?: string;
  candidateId?: string;
  stream?: string;
  position: string;
  companyName: string;
  issueDate?: string;
  startDate: string;
  endDate: string;
  performance?: string;
  description?: string;
}

export async function generateAndIssueCertificate(
  params: GenerateCertificateParams
): Promise<{ success: boolean; certificate: any; error?: string }> {
  const streamCode = (params.stream || params.position || "TECH")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const certCode = `CERT-2026-${streamCode}-${randNum}`;
  let certId = "cert-" + Math.random().toString(36).slice(2, 11);

  const certRecord = {
    id: certId,
    cert_code: certCode,
    application_id: params.applicationId,
    student_id: params.candidateId || "MEMBER-" + randNum,
    student_name: params.candidateName,
    company_name: params.companyName || "codeInt",
    position: params.position,
    start_date: params.startDate,
    end_date: params.endDate,
    performance: params.performance || "Outstanding",
    description:
      params.description ||
      `Successfully completed the 1-month virtual internship program in ${params.position} with exemplary technical performance, meeting all engineering milestones and deliverables.`,
    signatory_name: "Sumit Kumar",
    signatory_title: "CEO & CTO, codeInt",
    issued_at: params.issueDate ? new Date(params.issueDate).toISOString() : new Date().toISOString(),
    status: "verified",
  };

  // 1. If linked to an application, update status to 'hired'
  if (params.applicationId) {
    const currentApps = getStoredApplications();
    const appIndex = currentApps.findIndex((a) => a.id === params.applicationId);
    if (appIndex !== -1) {
      currentApps[appIndex] = {
        ...currentApps[appIndex],
        status: "hired",
      };
      saveStoredApplications(currentApps);
    }
  }

  // 2. Save certificate to storage
  const currentCerts = getStoredCertificates();
  saveStoredCertificates([certRecord, ...currentCerts]);

  // 3. Sync to Supabase directly
  try {
    const { data: authData } = await supabase.auth.getSession();
    const user = authData?.session?.user;

    const { data: insertedCert } = await supabase
      .from("certificates")
      .insert({
        cert_code: certCode,
        student_name: params.candidateName,
        company_name: params.companyName || "codeInt",
        position: params.position,
        start_date: params.startDate,
        end_date: params.endDate,
        performance: certRecord.performance,
        description: certRecord.description,
        signatory_name: certRecord.signatory_name,
        signatory_title: certRecord.signatory_title,
        issued_at: certRecord.issued_at,
        recruiter_id: user?.id || null,
      })
      .select()
      .maybeSingle();

    if (insertedCert) {
      certRecord.id = insertedCert.id;
    }
  } catch (err) {
    console.warn("Supabase certificate sync:", err);
  }

  return { success: true, certificate: certRecord };
}

export async function deleteStoredCertificate(certId: string): Promise<boolean> {
  try {
    const current = getStoredCertificates();
    const filtered = current.filter((c: any) => c.id !== certId && c.cert_code !== certId);
    saveStoredCertificates(filtered);

    await supabase.from("certificates").delete().or(`id.eq.${certId},cert_code.eq.${certId}`);
    return true;
  } catch {
    return false;
  }
}

export async function fetchAllApplications(): Promise<InternshipApplication[]> {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0 && !error) {
      return data as any[];
    }
  } catch (err) {
    console.warn("Supabase applications fetch fallback to local:", err);
  }
  return getStoredApplications();
}

export async function fetchAllOffers(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("offer_letters")
      .select("*")
      .order("issued_at", { ascending: false });

    if (data && data.length > 0 && !error) {
      return data;
    }
  } catch (err) {
    console.warn("Supabase offers fetch fallback to local:", err);
  }
  return getStoredOffers();
}

export async function fetchAllCertificates(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .order("issued_at", { ascending: false });

    if (data && data.length > 0 && !error) {
      return data;
    }
  } catch (err) {
    console.warn("Supabase certificates fetch fallback to local:", err);
  }
  return getStoredCertificates();
}

export async function findStudentOffer(query: string): Promise<any | null> {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // 1. Search local storage
  const localOffers = getStoredOffers();
  const localMatch = localOffers.find(
    (o) =>
      (o.offer_code && o.offer_code.toLowerCase() === q) ||
      (o.student_name && o.student_name.toLowerCase().includes(q)) ||
      (o.student_id && o.student_id.toLowerCase() === q)
  );
  if (localMatch) return localMatch;

  // Also check if an application with that email/ref_code has an offer
  const localApps = getStoredApplications();
  const appMatch = localApps.find(
    (a) =>
      a.offer_letter &&
      (a.email.toLowerCase() === q ||
        a.full_name.toLowerCase() === q ||
        a.ref_code.toLowerCase() === q)
  );
  if (appMatch?.offer_letter) return appMatch.offer_letter;

  // 2. Search Supabase offer_letters table
  try {
    const cleanQ = q.replace(/[^a-z0-9_-]/g, "");
    if (cleanQ) {
      const { data } = await supabase
        .from("offer_letters")
        .select("*")
        .or(`offer_code.eq.${cleanQ.toUpperCase()},id.eq.${cleanQ}`)
        .limit(1);

      if (data && data.length > 0) return data[0];
    }
  } catch (err) {
    console.warn("Supabase offer search error:", err);
  }

  return null;
}

export async function findStudentCertificate(query: string): Promise<any | null> {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // 1. Search local storage first
  const localCerts = getStoredCertificates();
  const localMatch = localCerts.find(
    (c: any) =>
      (c.cert_code && c.cert_code.toLowerCase() === q) ||
      (c.id && c.id.toLowerCase() === q)
  );
  if (localMatch) return localMatch;

  // 2. Search Supabase certificates table
  try {
    const cleanQ = q.replace(/[^a-z0-9_-]/g, "");
    if (cleanQ) {
      const { data } = await supabase
        .from("certificates")
        .select("*")
        .or(`cert_code.eq.${cleanQ.toUpperCase()},id.eq.${cleanQ}`)
        .limit(1);

      if (data && data.length > 0) return data[0];
    }
  } catch (err) {
    console.warn("Supabase certificate search error:", err);
  }

  return null;
}

