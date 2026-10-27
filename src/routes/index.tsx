import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Award, FileText, Download, Search, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AdminDashboard } from "./admin";
import { findStudentOffer, findStudentCertificate } from "@/lib/internship-applications";
import { downloadOfferLetterPDF, downloadCertificatePDF } from "@/lib/pdf";

export const Route = createFileRoute("/")({
  component: MainIndex,
});

function MainIndex() {
  const { user, profile, loading } = useAuth();
  const [isAdminSubdomain, setIsAdminSubdomain] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const searchParams = new URLSearchParams(window.location.search);
      const isSub = hostname.startsWith("admin.") || searchParams.get("subdomain") === "admin" || searchParams.get("admin") === "true";
      setIsAdminSubdomain(isSub);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isAdminSubdomain) {
    if (user && (profile?.role === "admin" || user?.email?.toLowerCase().startsWith("admin@") || user?.email?.toLowerCase().endsWith("@codeint.tech"))) {
      return <AdminDashboard />;
    }
    return <AdminAuthDirect />;
  }

  return <Landing />;
}

function AdminAuthDirect() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast.error(error.message);
      setSigningIn(false);
      return;
    }
    toast.success("Welcome back, Administrator.");
    setSigningIn(false);
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7] flex flex-col justify-center py-12 px-6">
      <div className="mx-auto w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="text-center mb-6">
          <Link to="/" className="text-3xl font-black tracking-tight text-slate-900">
            code<span className="text-[#EA580C]">Int</span>
          </Link>
          <h2 className="mt-4 text-xl font-bold font-sans text-slate-900">Admin Console Login</h2>
          <p className="text-xs text-slate-500 mt-1">Sign in with authorized administrator credentials.</p>
        </div>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase text-slate-700">Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="" className="rounded-xl mt-1 h-11 border-slate-200" />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase text-slate-700">Password</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="" className="rounded-xl mt-1 h-11 border-slate-200" />
          </div>
          <Button type="submit" disabled={signingIn} className="w-full bg-slate-900 text-white hover:bg-black rounded-xl h-11 font-bold mt-2">
            {signingIn ? "Authenticating..." : "Sign In to Admin"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Landing() {
  // Document Download Dialog state
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [docTab, setDocTab] = useState<"offer" | "certificate">("offer");
  const [query, setQuery] = useState("");
  const [foundOffer, setFoundOffer] = useState<any | null>(null);
  const [foundCert, setFoundCert] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return toast.error("Please enter a search term");

    setSearching(true);
    if (docTab === "offer") {
      const offer = await findStudentOffer(query);
      setSearching(false);
      if (!offer) {
        toast.error("No offer letter found for that search. Check spelling or reference code.");
        setFoundOffer(null);
      } else {
        setFoundOffer(offer);
        toast.success("Offer letter found!");
      }
    } else {
      const cert = await findStudentCertificate(query);
      setSearching(false);
      if (!cert) {
        toast.error("No certificate found for that search. Try searching by student name or certificate code.");
        setFoundCert(null);
      } else {
        setFoundCert(cert);
        toast.success("Certificate found!");
      }
    }
  };

  const handleDownloadOfferPDF = async () => {
    if (!foundOffer) return;
    setDownloading(true);
    try {
      await downloadOfferLetterPDF(foundOffer);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadCertPDF = async () => {
    if (!foundCert) return;
    setDownloading(true);
    try {
      await downloadCertificatePDF(foundCert);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader onOpenDownload={() => setDownloadModalOpen(true)} />

      {/* Hero Section */}
      <section className="bg-brand-yellow pt-12 pb-24 px-6 rounded-b-[3rem] relative z-10 -mt-[80px] pt-[80px]">
        <div className="mx-auto max-w-7xl pt-8 lg:pt-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-display font-medium text-brand-dark leading-[1.1] tracking-tight">
                Launch your<br />
                <span className="inline-flex items-center justify-center bg-brand-dark text-white rounded-full px-8 py-2 pb-3 mt-3 mb-2 leading-none relative">
                  Career
                  <svg className="absolute -top-4 -right-6 h-8 w-8 text-brand-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                </span>
                <br />Faster
              </h1>
            </div>
            
            <div className="lg:pl-8 flex flex-col items-start lg:mt-8">
              <p className="text-brand-dark/80 font-medium max-w-[360px] text-[15px] leading-relaxed mb-8">
                A modern platform for serious talent. Select your engineering stream, apply for our 1-month verified internship program, and download your official corporate documentation.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild className="rounded-full bg-brand-dark text-white hover:bg-black px-7 h-12 text-sm font-bold tracking-wide transition-all shadow-md">
                  <Link to="/apply">
                    Apply for Internship <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button 
                  onClick={() => setDownloadModalOpen(true)}
                  className="rounded-full bg-transparent border-2 border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white px-7 h-12 text-sm font-bold tracking-wide transition-all"
                >
                  Download Documents
                </Button>
              </div>
            </div>
          </div>
          
          {/* Hero Illustration */}
          <div className="mt-20 relative w-full max-w-5xl mx-auto flex justify-center">
             <img src="/hero_illustration.png" alt="Hero Illustration" className="w-full max-w-4xl object-contain drop-shadow-sm mix-blend-multiply" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto relative z-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/40 text-center">
          <Stat value="50k+" label="Active Students" />
          <Stat value="1k+" label="Top Companies" />
          <Stat value="1 Month" label="Standard Program" />
          <Stat value="10k+" label="Offers Sent" />
        </div>
      </section>

      {/* Descriptive Overview Section */}
      <section className="bg-brand-beige py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
           <div className="flex justify-center lg:justify-end pr-8 relative">
              <img src="/secondary_illustration.png" alt="Smart Education" className="w-full max-w-lg object-contain mix-blend-multiply" />
           </div>
           
           <div className="max-w-xl">
             <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-display font-medium text-brand-dark leading-[1.1] tracking-tight mb-8">
               Structured<br />
               <span className="relative inline-block mt-3 mb-3">
                 <span className="relative z-10 px-4">1-Month</span>
                 <span className="absolute inset-0 border-[3px] border-brand-yellow rounded-[100%] -rotate-3 z-0"></span>
               </span>
               {" "}Internship<br />
               Experience
             </h2>
             <p className="text-brand-dark/70 leading-relaxed text-[15px] font-medium max-w-md mb-6">
               Every internship is designed as a focused, 1-month practical sprint. Students gain hands-on technical skills, work through engineering assignments, and earn authenticated credentials.
             </p>
             <ul className="space-y-3 text-xs font-semibold text-brand-dark/80">
               <li className="flex items-center gap-2">
                 <span className="h-1.5 w-1.5 rounded-full bg-brand-dark" />
                 Streamlined admissions in C++, Java, CyberSecurity, Python & Web Development
               </li>
               <li className="flex items-center gap-2">
                 <span className="h-1.5 w-1.5 rounded-full bg-brand-dark" />
                 Official corporate offer letters issued upon administrator approval
               </li>
               <li className="flex items-center gap-2">
                 <span className="h-1.5 w-1.5 rounded-full bg-brand-dark" />
                 Cryptographically verifiable certificates for all graduating interns
               </li>
             </ul>
             <div className="mt-8">
               <Button asChild className="rounded-full bg-brand-dark text-white hover:bg-black px-7 h-12 text-sm font-bold shadow-sm">
                 <Link to="/apply">Get Started with Your Application →</Link>
               </Button>
             </div>
           </div>
        </div>
      </section>

      {/* Program Tracks Description */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Available Disciplines
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-display font-medium text-brand-dark tracking-tight">
            Engineering Tracks Offered
          </h2>
          <p className="mt-3 text-sm text-brand-dark/60">
            Choose from industry-standard specialization streams. All disciplines follow our intensive 1-month curriculum.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "C++ Programming",
              tag: "Systems & Algorithms",
              desc: "Object-oriented architecture, STL containers, pointers, memory management, and high-performance computing.",
            },
            {
              title: "Java Programming",
              tag: "Enterprise Backend",
              desc: "Core Java principles, multithreading, Spring Boot microservices, REST APIs, and database connectivity.",
            },
            {
              title: "CyberSecurity",
              tag: "Threat Defense",
              desc: "Network traffic inspection, ethical hacking methodology, vulnerability scanning, and OWASP top 10 defense.",
            },
            {
              title: "Python Programming",
              tag: "Automation & Scripting",
              desc: "Python programming, workflow automation, REST APIs with FastAPI, and web data scraping.",
            },
            {
              title: "Full Stack Web Development",
              tag: "Modern Web",
              desc: "Modern web applications with React, TypeScript, Node.js, Express, and database integration.",
            },
            {
              title: "Data Science & AI / ML",
              tag: "Analytics & Models",
              desc: "Data analysis with Pandas, exploratory data analysis, machine learning algorithms, and predictive modeling.",
            },
          ].map((track) => (
            <div key={track.title} className="rounded-3xl border border-brand-dark/10 bg-white p-7 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark/60 bg-brand-beige px-2.5 py-0.5 rounded-full border border-brand-dark/5">
                  {track.tag}
                </span>
                <h3 className="mt-3 text-xl font-bold font-display text-brand-dark">
                  {track.title}
                </h3>
                <p className="mt-2 text-xs text-brand-dark/70 leading-relaxed">
                  {track.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-dark/5 flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-dark/60">Tenure: 1 Month</span>
                <Link to="/apply" className="font-bold text-brand-dark hover:underline">
                  Apply Now →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          DOCUMENT DOWNLOAD MODAL (For Offer Letters & Certificates)
          ======================================================== */}
      <Dialog open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <DialogContent className="max-w-xl p-6 md:p-8 rounded-3xl bg-white border border-brand-dark/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-brand-dark">
              Student Document Portal
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <p className="text-xs text-brand-dark/60 mb-5">
              Look up and download your official corporate Offer Letter or verified Certificate of Completion.
            </p>

            <Tabs value={docTab} onValueChange={(v) => { setDocTab(v as any); setFoundOffer(null); setFoundCert(null); setQuery(""); }}>
              <TabsList className="grid w-full grid-cols-2 bg-brand-beige rounded-xl p-1 mb-5 border border-brand-dark/5">
                <TabsTrigger value="offer" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> Offer Letter
                </TabsTrigger>
                <TabsTrigger value="certificate" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
                  <Award className="h-3.5 w-3.5 mr-1.5" /> Certificate
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-dark/70">
                    {docTab === "offer" ? "Enter Your Email or Offer Reference Code" : "Enter Student Name or Certificate ID"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      required
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={docTab === "offer" ? "e.g. yourname@domain.com or OFR-INTN-..." : "e.g. Student Name or CERT-..."}
                      className="rounded-xl h-11 border-brand-dark/15 text-sm"
                    />
                    <Button type="submit" disabled={searching} className="rounded-xl bg-brand-dark text-white hover:bg-black font-bold h-11 px-5 shrink-0">
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
                      Search
                    </Button>
                  </div>
                </div>
              </form>

              {/* Offer Result */}
              {docTab === "offer" && foundOffer && (
                <div className="mt-5 rounded-2xl border border-brand-dark/10 bg-brand-beige/50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-brand-dark/10 pb-2">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-brand-dark/50">Candidate</div>
                      <div className="font-bold text-brand-dark text-base">{foundOffer.student_name}</div>
                    </div>
                    <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-brand-dark/10">
                      {foundOffer.offer_code}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-brand-dark/60 block">Position</span>
                      <span className="font-bold text-brand-dark">{foundOffer.position}</span>
                    </div>
                    <div>
                      <span className="text-brand-dark/60 block">Organization</span>
                      <span className="font-bold text-brand-dark">{foundOffer.company_name}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={handleDownloadOfferPDF}
                      disabled={downloading}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 shadow-sm"
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Preparing PDF...
                        </>
                      ) : (
                        <>
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Download Offer Letter (PDF)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Certificate Result */}
              {docTab === "certificate" && foundCert && (
                <div className="mt-5 rounded-2xl border border-brand-dark/10 bg-brand-beige/50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-brand-dark/10 pb-2">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-brand-dark/50">Student Name</div>
                      <div className="font-bold text-brand-dark text-base">{foundCert.student_name}</div>
                    </div>
                    <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-brand-dark/10">
                      {foundCert.cert_code}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-brand-dark/60 block">Designation</span>
                      <span className="font-bold text-brand-dark">{foundCert.position}</span>
                    </div>
                    <div>
                      <span className="text-brand-dark/60 block">Performance</span>
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {foundCert.performance || "Excellent"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={handleDownloadCertPDF}
                      disabled={downloading}
                      className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-10 px-5 shadow-sm"
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Preparing PDF...
                        </>
                      ) : (
                        <>
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Download Certificate (PDF)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4">
      <div className="font-display text-4xl font-bold tracking-tight text-brand-dark md:text-5xl">{value}</div>
      <div className="mt-1 text-xs font-medium text-brand-dark/60 uppercase tracking-wider">{label}</div>
    </div>
  );
}
