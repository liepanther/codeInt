import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  STREAM_OPTIONS, 
  submitInternshipApplication, 
  InternshipApplication 
} from "@/lib/internship-applications";
import { ArrowLeft, Check, Loader2, Copy } from "lucide-react";

export const Route = createFileRoute("/apply")({
  component: ApplyPage,
});

export function ApplyPage() {
  const navigate = useNavigate();

  // Form state
  const [stream, setStream] = useState("C++ Programming");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [degreeBranch, setDegreeBranch] = useState("B.Tech Computer Science");
  const [yearOfStudy, setYearOfStudy] = useState("3rd Year");
  const [resumeUrl, setResumeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<InternshipApplication | null>(null);
  const [copied, setCopied] = useState(false);

  // Read URL query parameter for pre-selected stream if any
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const streamParam = params.get("stream");
      if (streamParam) {
        const found = STREAM_OPTIONS.find(
          (s) => s.id === streamParam || s.name.toLowerCase().includes(streamParam.toLowerCase())
        );
        if (found) setStream(found.name);
      }
    }
  }, []);

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) return toast.error("Please enter your full name");
    if (!email.trim() || !email.includes("@")) return toast.error("Please enter a valid email address");
    if (!phone.trim()) return toast.error("Please enter your contact phone number");
    if (!university.trim()) return toast.error("Please enter your college or university name");

    setLoading(true);

    try {
      const res = await submitInternshipApplication({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        university: university.trim(),
        degree_branch: degreeBranch.trim(),
        year_of_study: yearOfStudy,
        stream: stream,
        mode: "Remote",
        duration: "1 Month",
        earliest_start_date: new Date().toISOString().split("T")[0],
        resume_url: resumeUrl.trim() || undefined,
      });

      setLoading(false);

      if (res.success) {
        setSubmittedApp(res.application);
        toast.success("Application submitted successfully!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    } catch (err: any) {
      setLoading(false);
      toast.error(err?.message || "An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-slate-900">
      <SiteHeader />

      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        {submittedApp ? (
          /* =========================================================================
             CLEAN SUBMISSION RECEIPT
             ========================================================================= */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-left">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </span>
              <span className="text-xs font-semibold text-emerald-800">
                Application Submitted
              </span>
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              Thank you, {submittedApp.full_name}
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Your application for the <strong className="text-slate-900">{submittedApp.stream}</strong> internship has been received.
            </p>

            <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Reference ID</span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  {submittedApp.ref_code}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopyCode(submittedApp.ref_code)}
                className="h-8 text-xs font-medium border-slate-200"
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="mt-5 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
              Our team will review your application and send the official offer letter to your email.
            </div>

            <div className="mt-6 flex gap-3">
              <Button asChild className="rounded-xl bg-slate-900 hover:bg-black text-white text-xs h-9 px-4">
                <Link to="/">Back to Home</Link>
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setSubmittedApp(null);
                  setFullName("");
                  setPhone("");
                  setResumeUrl("");
                }}
                className="rounded-xl border-slate-200 text-xs h-9 px-4 text-slate-700"
              >
                Submit Another
              </Button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             CLEAN, MINIMAL APPLICATION FORM
             ========================================================================= */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs text-left">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Apply for Internship
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                1-Month Virtual Internship Program by codeInt
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Internship Stream
                </Label>
                <Select value={stream} onValueChange={setStream}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm focus:ring-1 focus:ring-slate-900 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STREAM_OPTIONS.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Full Name
                </Label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-10 rounded-xl border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Email Address
                  </Label>
                  <Input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-10 rounded-xl border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-slate-900"
                  />
                </div>

                <div>
                  <Label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Phone / WhatsApp
                  </Label>
                  <Input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-10 rounded-xl border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-xs font-medium text-slate-700 mb-1.5">
                  College / University
                </Label>
                <Input
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. NIT Karnataka, VIT, IIT..."
                  className="h-10 rounded-xl border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Degree &amp; Branch
                  </Label>
                  <Input
                    value={degreeBranch}
                    onChange={(e) => setDegreeBranch(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="h-10 rounded-xl border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-slate-900"
                  />
                </div>

                <div>
                  <Label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Year of Study
                  </Label>
                  <Select value={yearOfStudy} onValueChange={setYearOfStudy}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm focus:ring-1 focus:ring-slate-900 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="Final Year">Final Year</SelectItem>
                      <SelectItem value="Graduate">Recent Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Resume / LinkedIn / GitHub <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or github.com/..."
                  className="h-10 rounded-xl border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-slate-900"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-900 text-white hover:bg-black font-semibold h-11 text-sm transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
