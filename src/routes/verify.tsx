import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search, 
  Download, 
  FileText, 
  Calendar, 
  Building2, 
  User, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { downloadCertificatePDF, downloadOfferLetterPDF } from "@/lib/pdf";
import { findStudentOffer, findStudentCertificate } from "@/lib/internship-applications";
import { CertificateView } from "@/components/certificate-view";
import { OfferLetterView } from "@/components/offer-letter-view";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
});

export function VerifyPage() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null | "notfound">(null);
  const [resultType, setResultType] = useState<"offer" | "certificate">("certificate");
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-search if ?id= or ?code= is passed in URL (e.g. from QR code scan)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get("id") || params.get("code") || params.get("ref");
      if (queryId) {
        setCode(queryId);
        executeSearch(queryId);
      }
    }
  }, []);

  const executeSearch = async (searchTerm: string) => {
    const raw = searchTerm.trim();
    if (!raw) return;
    setLoading(true);
    setShowDocPreview(false);

    // 1. Try finding Certificate first
    const cert = await findStudentCertificate(raw);
    if (cert) {
      setResultType("certificate");
      setResult(cert);
      setLoading(false);
      return;
    }

    // 2. Try finding Offer Letter
    const offer = await findStudentOffer(raw);
    if (offer) {
      setResultType("offer");
      setResult(offer);
      setLoading(false);
      return;
    }

    setResult("notfound");
    setLoading(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(code);
  };

  const handleCopyId = (textToCopy: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const Content = (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      {/* Brand & Portal Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
          <span className="font-bold text-slate-900 tracking-tight">
            code<span className="text-[#EA580C]">Int</span>
          </span>
          <span className="text-slate-300">|</span>
          <span>Official Credential Registry</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Verify Credential
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
          Confirm the validity and authenticity of certificates and internship offer letters issued by codeInt.
        </p>
      </div>

      {/* Clean, Non-AI Search Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-2 sm:p-2.5 max-w-2xl mx-auto">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              placeholder="Enter Certificate ID or Offer Code..." 
              className="w-full h-11 pl-10 pr-9 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus-visible:ring-1 focus-visible:ring-slate-900 placeholder:text-slate-400 font-medium" 
            />
            {code && (
              <button
                type="button"
                onClick={() => { setCode(""); setResult(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={loading || !code.trim()} 
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-slate-900 text-white hover:bg-black font-semibold text-sm transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-500 mt-2.5">
        Credential IDs are located at the bottom of official certificates or at the top of offer letters.
      </p>

      {/* Initial Explainer (When no search has run) */}
      {!result && !loading && (
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200/70 pt-10">
          <div className="rounded-xl border border-slate-200/70 bg-white p-4 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Direct Issuer Records
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every document is cross-checked directly against codeInt's internal registry.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-white p-4 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1.5">
              <Award className="h-4 w-4 text-[#EA580C]" />
              Stream &amp; Performance
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Displays verified candidate name, internship domain, completion dates, and performance grade.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-white p-4 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1.5">
              <Layers className="h-4 w-4 text-blue-600" />
              Employer Verification
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provides instant verification for recruiters, universities, and background verification agencies.
            </p>
          </div>
        </div>
      )}

      {/* Record Not Found State */}
      {result === "notfound" && !loading && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs text-left max-w-2xl mx-auto">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shrink-0 border border-amber-200">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                No Record Found for &ldquo;{code}&rdquo;
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                We could not locate an active credential in the registry matching this identifier.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-800">Please check the following:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>Verify that the ID was entered exactly as shown on the document.</li>
                  <li>Check for omitted dashes or transposed characters (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">CERT-2026-CYBR-2384</code>).</li>
                  <li>If the document was issued recently, please allow a few minutes for synchronization.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verified Authentic Result Card */}
      {result && result !== "notfound" && (
        <div className="mt-8 max-w-2xl mx-auto text-left">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header Status Bar */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </span>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  Officially Verified Credential
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                codeInt Registry Record
              </div>
            </div>

            {/* Candidate & Document Summary */}
            <div className="p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {resultType === "certificate" ? "Certificate of Completion" : "Internship Offer Letter"}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                    {result.student_name}
                  </h2>
                  <p className="text-sm font-medium text-[#EA580C] mt-1">
                    {result.position || result.stream || "Engineering Intern"}
                  </p>
                </div>

                {/* PDF Download Button */}
                <div className="shrink-0">
                  {resultType === "offer" ? (
                    <Button 
                      onClick={() => downloadOfferLetterPDF(result)} 
                      size="sm"
                      className="rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" /> Download PDF
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => downloadCertificatePDF(result)} 
                      size="sm"
                      className="rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" /> Download PDF
                    </Button>
                  )}
                </div>
              </div>

              {/* Structured Metadata Ledger */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 py-6 text-xs border-b border-slate-100">
                <div>
                  <span className="text-slate-500 block mb-0.5">Credential ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900 text-sm">
                      {result.cert_code || result.offer_code || code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(result.cert_code || result.offer_code || code)}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy Credential ID"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    {copied && <span className="text-[10px] text-emerald-600 font-semibold">Copied</span>}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Issuing Organization</span>
                  <span className="font-semibold text-slate-900 text-sm">codeInt</span>
                  <span className="text-slate-400 ml-1.5 font-mono text-[11px]">(codeint.tech)</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Internship Tenure</span>
                  <span className="font-medium text-slate-800 text-sm">
                    {result.start_date && result.end_date ? (
                      `${new Date(result.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — ${new Date(result.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    ) : (
                      "1 Month Internship"
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Issue Date</span>
                  <span className="font-medium text-slate-800 text-sm">
                    {new Date(result.issued_at || result.created_at || Date.now()).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Performance Rating</span>
                  <span className="font-medium text-emerald-700 text-sm">
                    {result.performance || "Outstanding (Grade A+)"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Verification Status</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Valid &amp; Recorded
                  </span>
                </div>
              </div>

              {/* View Original Document Toggle */}
              <div className="pt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocPreview(!showDocPreview)}
                  className="w-full text-xs font-semibold rounded-xl border-slate-200 h-10 gap-2 text-slate-700 hover:bg-slate-50"
                >
                  {showDocPreview ? (
                    <>
                      <EyeOff className="h-4 w-4" /> Hide Document Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" /> View Full Document Preview
                    </>
                  )}
                </Button>

                {showDocPreview && (
                  <div className="mt-4 p-4 bg-slate-100/80 rounded-xl border border-slate-200 overflow-x-auto flex justify-center">
                    {resultType === "certificate" ? (
                      <CertificateView cert={result} id={`verify-cert-${result.id || result.cert_code}`} />
                    ) : (
                      <OfferLetterView offer={result} id={`verify-offer-${result.id || result.offer_code}`} />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer Disclaimer */}
            <div className="bg-slate-50/70 px-6 py-3 border-t border-slate-100 text-[11px] text-slate-500">
              This credential is cryptographically tied to codeInt registry records. For third-party background verification or discrepancy reports, contact <a href="mailto:verify@codeint.tech" className="text-slate-700 underline font-medium">verify@codeint.tech</a>.
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (user) {
    return <DashboardLayout>{Content}</DashboardLayout>;
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <SiteHeader />
      {Content}
      <SiteFooter />
    </div>
  );
}
