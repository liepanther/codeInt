import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/auth-gate";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { 
  Users, 
  Briefcase, 
  Building, 
  Search, 
  Edit2, 
  Trash2, 
  ShieldAlert, 
  FileText, 
  Send, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye, 
  Sparkles, 
  Calendar, 
  GraduationCap, 
  Phone, 
  Mail, 
  Award,
  Code2,
  Check,
  Filter,
  Copy,
  Plus
} from "lucide-react";
import { 
  STREAM_OPTIONS, 
  InternshipApplication, 
  getStoredApplications, 
  updateApplicationStatus, 
  generateAndIssueOffer, 
  getStoredOffers,
  getStoredCertificates,
  generateAndIssueCertificate,
  deleteStoredCertificate,
  fetchAllApplications,
  fetchAllOffers,
  fetchAllCertificates
} from "@/lib/internship-applications";
import { OfferLetterView } from "@/components/offer-letter-view";
import { CertificateView } from "@/components/certificate-view";
import { downloadOfferLetterPDF, downloadCertificatePDF } from "@/lib/pdf";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AuthGate requireRole="admin">
      <AdminDashboard />
    </AuthGate>
  ),
});

export function AdminDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"applications" | "offers" | "certificates" | "recruiters">("applications");

  // Applications State
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchApp, setSearchApp] = useState("");

  // Viewing application modal
  const [viewingApp, setViewingApp] = useState<InternshipApplication | null>(null);

  // Offer letter generation modal
  const [offeringApp, setOfferingApp] = useState<InternshipApplication | null>(null);
  const [previewOffer, setPreviewOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    position: "",
    company_name: "codeInt",
    issue_date: new Date().toISOString().split("T")[0],
    start_date: "",
    end_date: "",
    stipend: "Performance Based Stipend",
    location: "Remote",
    letter_body: `We are confident that this virtual internship will be a valuable experience for you, we look forward to working with you and helping you achieve your career goals.`,
  });
  const [issuingOffer, setIssuingOffer] = useState(false);

  // Offers state
  const [issuedOffers, setIssuedOffers] = useState<any[]>([]);
  const [viewingOffer, setViewingOffer] = useState<any | null>(null);
  const [downloadingOfferId, setDownloadingOfferId] = useState<string | null>(null);

  // Certificates State
  const [certificates, setCertificates] = useState<any[]>([]);
  const [searchCert, setSearchCert] = useState("");
  const [certifyingApp, setCertifyingApp] = useState<any | null>(null);
  const [previewCert, setPreviewCert] = useState(false);
  const [certForm, setCertForm] = useState({
    candidate_name: "",
    position: "",
    company_name: "codeInt",
    issue_date: new Date().toISOString().split("T")[0],
    start_date: "",
    end_date: "",
    performance: "Outstanding",
    description: `Successfully completed all required engineering assignments, demonstrated exceptional technical competence, and consistently contributed to real-world software modules.`,
  });
  const [issuingCert, setIssuingCert] = useState(false);
  const [viewingCert, setViewingCert] = useState<any | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  // Recruiter Management State
  const [recruiterSearch, setRecruiterSearch] = useState("");
  const [editingRecruiter, setEditingRecruiter] = useState<any | null>(null);
  const [newCompany, setNewCompany] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);

  // Load applications, offers, and certificates from Supabase (with fallback to local storage)
  const loadData = async () => {
    const [apps, offers, certs] = await Promise.all([
      fetchAllApplications(),
      fetchAllOffers(),
      fetchAllCertificates()
    ]);
    setApplications(apps);
    setIssuedOffers(offers);
    setCertificates(certs);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch recruiter profiles and their associated internships
  const { data: recruiters = [], isLoading: loadingRecruiters } = useQuery({
    queryKey: ["admin-recruiters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, internships(id, title, is_active)")
        .eq("role", "recruiter")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Open Offer Generator for Application
  const handleOpenOfferModal = (app: InternshipApplication) => {
    const today = new Date().toISOString().split("T")[0];
    const defaultStart = app.earliest_start_date || today;
    const startDateObj = new Date(defaultStart);
    const endDateObj = new Date(startDateObj);
    // All internships are 1 month
    endDateObj.setMonth(endDateObj.getMonth() + 1);

    setOfferForm({
      position: app.stream,
      company_name: "codeInt",
      issue_date: today,
      start_date: defaultStart,
      end_date: endDateObj.toISOString().split("T")[0],
      stipend: "Performance Based Stipend",
      location: "Remote",
      letter_body: `We are confident that this virtual internship will be a valuable experience for you, we look forward to working with you and helping you achieve your career goals.`,
    });
    setPreviewOffer(false);
    setOfferingApp(app);
  };

  // Submit Offer Letter
  const handleIssueOffer = async () => {
    if (!offeringApp) return;
    if (!offerForm.start_date || !offerForm.end_date) {
      return toast.error("Please specify both start and end dates.");
    }

    setIssuingOffer(true);
    try {
      const res = await generateAndIssueOffer({
        applicationId: offeringApp.id,
        candidateName: offeringApp.full_name,
        candidateEmail: offeringApp.email,
        candidateId: offeringApp.student_id,
        stream: offeringApp.stream,
        position: offerForm.position,
        companyName: offerForm.company_name,
        issueDate: offerForm.issue_date,
        startDate: offerForm.start_date,
        endDate: offerForm.end_date,
        stipend: offerForm.stipend,
        location: offerForm.location,
        letterBody: offerForm.letter_body,
      });

      setIssuingOffer(false);

      if (res.success) {
        toast.success(`Offer letter generated & issued for ${offeringApp.full_name}!`);
        setOfferingApp(null);
        loadData();
      } else {
        toast.error("Failed to generate offer letter.");
      }
    } catch (err: any) {
      setIssuingOffer(false);
      toast.error(err?.message || "Failed to generate offer letter.");
    }
  };

  // Open Certificate Generator Modal
  const handleOpenCertModal = (candidateData?: any) => {
    const today = new Date().toISOString().split("T")[0];
    const defaultStart = candidateData?.start_date || candidateData?.earliest_start_date || today;
    const startObj = new Date(defaultStart);
    const endObj = new Date(startObj);
    endObj.setMonth(endObj.getMonth() + 1);

    setCertForm({
      candidate_name: candidateData?.full_name || candidateData?.student_name || "",
      position: candidateData?.stream || candidateData?.position || "Software Engineering",
      company_name: "codeInt",
      issue_date: today,
      start_date: defaultStart,
      end_date: candidateData?.end_date || endObj.toISOString().split("T")[0],
      performance: "Outstanding",
      description: `Successfully completed all required engineering assignments, demonstrated exceptional technical competence, and consistently contributed to real-world software modules.`,
    });
    setPreviewCert(false);
    setCertifyingApp(candidateData || { full_name: "Candidate" });
  };

  // Submit Certificate Generation
  const handleIssueCertificateAction = async () => {
    if (!certForm.candidate_name) {
      return toast.error("Please enter the candidate's name.");
    }
    if (!certForm.start_date || !certForm.end_date) {
      return toast.error("Please specify both start and end dates.");
    }

    setIssuingCert(true);
    try {
      const res = await generateAndIssueCertificate({
        applicationId: certifyingApp?.id?.startsWith("app-") ? certifyingApp.id : undefined,
        candidateName: certForm.candidate_name,
        candidateEmail: certifyingApp?.email,
        candidateId: certifyingApp?.student_id,
        stream: certForm.position,
        position: certForm.position,
        companyName: certForm.company_name || "codeInt",
        issueDate: certForm.issue_date,
        startDate: certForm.start_date,
        endDate: certForm.end_date,
        performance: certForm.performance,
        description: certForm.description,
      });

      setIssuingCert(false);

      if (res.success) {
        toast.success(`Certificate issued successfully for ${certForm.candidate_name}!`);
        setCertifyingApp(null);
        loadData();
      } else {
        toast.error("Failed to generate certificate.");
      }
    } catch (err: any) {
      setIssuingCert(false);
      toast.error(err?.message || "Failed to generate certificate.");
    }
  };

  // Delete Certificate
  const handleDeleteCert = (certId: string, studentName: string) => {
    if (confirm(`Are you sure you want to delete/revoke certificate for ${studentName}?`)) {
      deleteStoredCertificate(certId);
      toast.success("Certificate deleted");
      loadData();
    }
  };

  // Download Certificate PDF
  const handleDownloadCertPDF = async (cert: any) => {
    setDownloadingCertId(cert.id || cert.cert_code);
    try {
      await downloadCertificatePDF(cert);
    } finally {
      setDownloadingCertId(null);
    }
  };

  // Status changer for application
  const handleStatusChange = async (appId: string, status: InternshipApplication["status"]) => {
    await updateApplicationStatus(appId, status);
    toast.success(`Status updated to "${status}"`);
    loadData();
  };

  // Download Offer Letter PDF
  const handleDownloadPDF = async (offer: any) => {
    setDownloadingOfferId(offer.id);
    try {
      await downloadOfferLetterPDF(offer);
    } finally {
      setDownloadingOfferId(null);
    }
  };

  // Recruiter actions
  const handleEditCompany = (recruiter: any) => {
    setEditingRecruiter(recruiter);
    setNewCompany(recruiter.company_name || "");
  };

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecruiter) return;
    setSavingCompany(true);

    const { error } = await supabase
      .from("profiles")
      .update({ company_name: newCompany })
      .eq("id", editingRecruiter.id);

    setSavingCompany(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Company name updated!");
      setEditingRecruiter(null);
      qc.invalidateQueries({ queryKey: ["admin-recruiters"] });
    }
  };

  const deleteRecruiter = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete recruiter "${name}"? This will also remove their postings.`)) return;

    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Recruiter removed");
      qc.invalidateQueries({ queryKey: ["admin-recruiters"] });
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesStream = selectedStreamFilter === "all" || app.stream.toLowerCase().includes(selectedStreamFilter.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const s = searchApp.toLowerCase();
    const matchesSearch =
      !s ||
      app.full_name.toLowerCase().includes(s) ||
      app.email.toLowerCase().includes(s) ||
      app.phone.toLowerCase().includes(s) ||
      app.university.toLowerCase().includes(s) ||
      app.stream.toLowerCase().includes(s) ||
      (app.ref_code && app.ref_code.toLowerCase().includes(s));
    return matchesStream && matchesStatus && matchesSearch;
  });

  // Filtered certificates
  const filteredCerts = certificates.filter((c: any) => {
    const s = searchCert.toLowerCase();
    return (
      !s ||
      (c.student_name && c.student_name.toLowerCase().includes(s)) ||
      (c.cert_code && c.cert_code.toLowerCase().includes(s)) ||
      (c.position && c.position.toLowerCase().includes(s))
    );
  });

  // Filtered recruiters
  const filteredRecruiters = recruiters.filter((r: any) => {
    const s = recruiterSearch.toLowerCase();
    return (
      (r.full_name || "").toLowerCase().includes(s) ||
      (r.email || "").toLowerCase().includes(s) ||
      (r.company_name || "").toLowerCase().includes(s)
    );
  });

  // Stats calculation
  const totalAppsCount = applications.length;
  const pendingAppsCount = applications.filter((a) => a.status === "applied").length;
  const offeredCount = applications.filter((a) => a.status === "offered").length;
  const certsCount = certificates.length;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-destructive">
              <ShieldAlert className="h-4 w-4" /> System Administrator Console
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Admin Portal
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage student admissions across engineering streams, customize offer letters, and issue verified completion certificates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleOpenCertModal()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm"
            >
              <Award className="mr-1.5 h-3.5 w-3.5" /> Issue Certificate
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-border bg-white text-xs font-bold">
              <Link to="/apply" target="_blank">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open Public Apply Form
              </Link>
            </Button>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Applications</span>
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 font-display text-3xl font-bold">{totalAppsCount}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Across all engineering streams</div>
          </div>

          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Review</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-amber-600">{pendingAppsCount}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Awaiting admin assessment</div>
          </div>

          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Offers Issued</span>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-emerald-600">{offeredCount}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Official offer letters dispatched</div>
          </div>

          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Certificates Issued</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-amber-600">{certsCount}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Verifiable completion credentials</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="bg-surface-muted/60 border border-border p-1 rounded-2xl w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
            <TabsTrigger value="applications" className="rounded-xl px-5 py-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileText className="mr-2 h-4 w-4" /> Student Applications ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="offers" className="rounded-xl px-5 py-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Award className="mr-2 h-4 w-4 text-emerald-600" /> Issued Offers ({issuedOffers.length})
            </TabsTrigger>
            <TabsTrigger value="certificates" className="rounded-xl px-5 py-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Award className="mr-2 h-4 w-4 text-amber-600" /> Issued Certificates ({certificates.length})
            </TabsTrigger>
          </TabsList>

          {/* ========================================================
              TAB 1: CANDIDATE APPLICATIONS
              ======================================================== */}
          <TabsContent value="applications" className="space-y-6">
            <div className="surface-card p-6">
              {/* Controls bar */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by candidate name, email, phone, college..."
                    value={searchApp}
                    onChange={(e) => setSearchApp(e.target.value)}
                    className="pl-10 h-10 rounded-xl"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 h-10 rounded-xl text-xs">
                      <SelectValue placeholder="Status Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="applied">Applied (New)</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="offered">Offer Issued</SelectItem>
                      <SelectItem value="hired">Hired / Certified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStreamFilter("all");
                      setStatusFilter("all");
                      setSearchApp("");
                    }}
                    className="h-10 text-xs rounded-xl"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              {/* Stream Filter Pills */}
              <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
                <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Stream:
                </span>
                <button
                  onClick={() => setSelectedStreamFilter("all")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    selectedStreamFilter === "all"
                      ? "bg-brand-dark text-white shadow-sm"
                      : "bg-surface-muted hover:bg-surface-muted/80 text-foreground"
                  }`}
                >
                  All Streams
                </button>
                {STREAM_OPTIONS.map((st) => {
                  const isSel = selectedStreamFilter.toLowerCase() === st.name.toLowerCase() || selectedStreamFilter === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStreamFilter(isSel ? "all" : st.name)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isSel
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "bg-surface-muted hover:bg-surface-muted/80 text-foreground"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: st.color }} />
                      {st.name}
                    </button>
                  );
                })}
              </div>

              {/* Applications Table */}
              {filteredApps.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="font-semibold text-foreground">No applications found matching your filters.</p>
                  <p className="text-xs text-muted-foreground mt-1">Try resetting your search query or stream filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 px-4">Applicant</th>
                        <th className="py-3 px-4">Stream & Preferences</th>
                        <th className="py-3 px-4">University & Branch</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {filteredApps.map((a) => (
                        <tr key={a.id} className="hover:bg-surface-muted/40 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 font-display font-bold text-accent text-sm">
                                {a.full_name ? a.full_name[0].toUpperCase() : "?"}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground flex items-center gap-2">
                                  {a.full_name}
                                  {a.ref_code && (
                                    <span className="text-[10px] font-mono text-muted-foreground bg-surface-muted px-1.5 py-0.5 rounded">
                                      {a.ref_code}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                  <span>{a.email}</span>
                                  <span>·</span>
                                  <span>{a.phone}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                              <Code2 className="h-3 w-3" /> {a.stream}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {a.mode || "Remote"} · {a.duration || "1 Month"}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-medium text-foreground">{a.university}</div>
                            <div className="text-xs text-muted-foreground">
                              {a.degree_branch} {a.year_of_study && `(${a.year_of_study})`}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                                a.status === "hired"
                                  ? "bg-purple-100 text-purple-800 border border-purple-300"
                                  : a.status === "offered"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : a.status === "shortlisted"
                                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                                  : a.status === "rejected"
                                  ? "bg-red-100 text-red-800 border border-red-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {a.status === "offered" || a.status === "hired" ? <Check className="h-3 w-3" /> : null}
                              {a.status}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View Details */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingApp(a)}
                                className="h-8 text-xs rounded-lg"
                                title="View details"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                              </Button>

                              {/* Issue Offer Letter */}
                              <Button
                                size="sm"
                                onClick={() => handleOpenOfferModal(a)}
                                className={`h-8 text-xs rounded-lg font-semibold shadow-sm ${
                                  a.status === "offered"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                              >
                                <Award className="h-3.5 w-3.5 mr-1" />
                                {a.status === "offered" ? "Re-issue Offer" : "Issue Offer"}
                              </Button>

                              {/* Issue Certificate Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenCertModal(a)}
                                className="h-8 text-xs rounded-lg text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 font-semibold"
                                title="Issue completion certificate"
                              >
                                <Award className="h-3.5 w-3.5 mr-1 text-amber-600" /> Certificate
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ========================================================
              TAB 2: ISSUED OFFER LETTERS
              ======================================================== */}
          <TabsContent value="offers" className="space-y-6">
            <div className="surface-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold">Issued Corporate Offer Letters</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official internship offer letters generated with custom issue date, tenure, and verifiable QR codes.
                  </p>
                </div>
              </div>

              {issuedOffers.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Award className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="font-semibold text-foreground">No offer letters generated yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a candidate from the Applications tab and click "Issue Offer".
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 px-4">Candidate & Position</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Issue & Tenure Dates</th>
                        <th className="py-3 px-4">Ref Code</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {issuedOffers.map((o) => (
                        <tr key={o.id} className="hover:bg-surface-muted/40 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-semibold text-foreground">{o.student_name}</div>
                            <div className="text-xs text-accent font-medium">{o.position}</div>
                          </td>

                          <td className="py-4 px-4 font-medium text-foreground">
                            {o.company_name}
                          </td>

                          <td className="py-4 px-4 text-xs text-muted-foreground">
                            <div className="font-semibold text-foreground">
                              Issued: {new Date(o.issued_at || o.created_at).toLocaleDateString()}
                            </div>
                            <div className="mt-0.5">
                              Tenure: {new Date(o.start_date).toLocaleDateString()} → {new Date(o.end_date).toLocaleDateString()}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-mono text-xs bg-surface-muted px-2 py-1 rounded font-bold border border-border">
                              {o.offer_code}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 capitalize border border-emerald-300">
                              {o.status || "Offered"}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingOffer(o)}
                                className="h-8 text-xs rounded-lg"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => handleDownloadPDF(o)}
                                disabled={downloadingOfferId === o.id}
                                className="h-8 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                {downloadingOfferId === o.id ? "Preparing..." : "Download PDF"}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenCertModal(o)}
                                className="h-8 text-xs rounded-lg text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 font-semibold"
                                title="Issue certificate for this intern"
                              >
                                <Award className="h-3.5 w-3.5 mr-1 text-amber-600" /> Issue Cert
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ========================================================
              TAB 3: ISSUED CERTIFICATES (MANAGE CERTIFICATES)
              ======================================================== */}
          <TabsContent value="certificates" className="space-y-6">
            <div className="surface-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold">Manage Issued Completion Certificates</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official verifiable completion certificates matching the company letterhead design and domain.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search certificates..."
                      value={searchCert}
                      onChange={(e) => setSearchCert(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={() => handleOpenCertModal()}
                    className="h-9 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm shrink-0"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Issue New Certificate
                  </Button>
                </div>
              </div>

              {filteredCerts.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Award className="mx-auto h-10 w-10 text-amber-500/40 mb-3" />
                  <p className="font-semibold text-foreground">No completion certificates found.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Issue New Certificate" above to generate a certificate for an intern.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 px-4">Student & Stream</th>
                        <th className="py-3 px-4">Certificate ID</th>
                        <th className="py-3 px-4">Internship Tenure</th>
                        <th className="py-3 px-4">Issue Date</th>
                        <th className="py-3 px-4">Performance</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {filteredCerts.map((c: any) => (
                        <tr key={c.id || c.cert_code} className="hover:bg-surface-muted/40 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-semibold text-foreground">{c.student_name}</div>
                            <div className="text-xs text-amber-600 font-medium">{c.position}</div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-mono text-xs bg-surface-muted px-2 py-1 rounded font-bold border border-border">
                              {c.cert_code}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-xs text-muted-foreground">
                            {new Date(c.start_date).toLocaleDateString()} → {new Date(c.end_date).toLocaleDateString()}
                          </td>

                          <td className="py-4 px-4 text-xs font-semibold text-foreground">
                            {new Date(c.issued_at || c.created_at).toLocaleDateString()}
                          </td>

                          <td className="py-4 px-4">
                            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 capitalize border border-amber-300">
                              {c.performance || "Outstanding"}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Preview */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingCert(c)}
                                className="h-8 text-xs rounded-lg"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                              </Button>

                              {/* Download PDF */}
                              <Button
                                size="sm"
                                onClick={() => handleDownloadCertPDF(c)}
                                disabled={downloadingCertId === (c.id || c.cert_code)}
                                className="h-8 text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                {downloadingCertId === (c.id || c.cert_code) ? "Generating..." : "Download PDF"}
                              </Button>

                              {/* Delete */}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCert(c.id || c.cert_code, c.student_name)}
                                className="h-8 text-xs rounded-lg"
                                title="Revoke certificate"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ========================================================
          DIALOG 1: CANDIDATE APPLICATION DETAILS MODAL
          ======================================================== */}
      <Dialog open={!!viewingApp} onOpenChange={(v) => !v && setViewingApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Application Details</span>
              <span className="font-mono text-xs font-normal text-muted-foreground bg-surface-muted px-2 py-1 rounded">
                {viewingApp?.ref_code}
              </span>
            </DialogTitle>
          </DialogHeader>

          {viewingApp && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-surface-muted/50 p-4 border border-border">
                <div>
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  <div className="font-bold text-foreground text-base mt-0.5">{viewingApp.full_name}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Stream Selected</Label>
                  <div className="font-bold text-accent text-base mt-0.5">{viewingApp.stream}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email Address</Label>
                  <div className="font-medium text-foreground mt-0.5">{viewingApp.email}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Contact Phone</Label>
                  <div className="font-medium text-foreground mt-0.5">{viewingApp.phone}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">College / University</Label>
                  <div className="font-medium text-foreground mt-0.5">{viewingApp.university}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Degree & Branch</Label>
                  <div className="font-medium text-foreground mt-0.5">
                    {viewingApp.degree_branch} ({viewingApp.year_of_study})
                  </div>
                </div>
              </div>

              {viewingApp.resume_url && (
                <div>
                  <Label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Resume File Link</Label>
                  <a
                    href={viewingApp.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-accent hover:underline font-semibold text-xs bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View Resume Document ({viewingApp.resume_url})
                  </a>
                </div>
              )}

              {viewingApp.github_portfolio && (
                <div>
                  <Label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Portfolio / GitHub</Label>
                  <a
                    href={viewingApp.github_portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-foreground hover:underline font-semibold text-xs bg-surface-muted px-3 py-1.5 rounded-lg border border-border"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> {viewingApp.github_portfolio}
                  </a>
                </div>
              )}

              {viewingApp.cover_letter && (
                <div>
                  <Label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Candidate Statement / Cover Note</Label>
                  <div className="rounded-xl bg-surface-muted/60 p-3 text-xs leading-relaxed border border-border text-foreground whitespace-pre-line">
                    {viewingApp.cover_letter}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2 flex justify-between sm:justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleStatusChange(viewingApp.id, "shortlisted");
                      setViewingApp(null);
                    }}
                  >
                    Shortlist
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      handleStatusChange(viewingApp.id, "rejected");
                      setViewingApp(null);
                    }}
                  >
                    Reject
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold"
                    onClick={() => {
                      const target = viewingApp;
                      setViewingApp(null);
                      handleOpenCertModal(target);
                    }}
                  >
                    <Award className="h-3.5 w-3.5 mr-1.5" /> Issue Certificate
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={() => {
                      const target = viewingApp;
                      setViewingApp(null);
                      handleOpenOfferModal(target);
                    }}
                  >
                    <Award className="h-3.5 w-3.5 mr-1.5" /> Issue Offer
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================
          DIALOG 2: ACCEPT & ISSUE OFFER LETTER GENERATOR
          ======================================================== */}
      <Dialog open={!!offeringApp} onOpenChange={(v) => !v && setOfferingApp(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Generate Corporate Offer Letter</span>
              <span className="text-xs font-normal text-muted-foreground">
                For: <strong className="text-foreground">{offeringApp?.full_name}</strong>
              </span>
            </DialogTitle>
          </DialogHeader>

          {offeringApp && (
            <div className="space-y-5 py-2">
              {/* Toggle Form / Live Preview */}
              <div className="flex justify-end gap-2 border-b border-border pb-3">
                <Button
                  type="button"
                  size="sm"
                  variant={!previewOffer ? "default" : "outline"}
                  onClick={() => setPreviewOffer(false)}
                  className="h-8 text-xs font-semibold"
                >
                  Configure Fields
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewOffer ? "default" : "outline"}
                  onClick={() => setPreviewOffer(true)}
                  className="h-8 text-xs font-semibold"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> Preview Letterhead
                </Button>
              </div>

              {previewOffer ? (
                /* Live Letter Preview */
                <div className="w-full overflow-x-auto flex flex-col items-center justify-center p-4 bg-slate-100 rounded-2xl border border-border">
                  <OfferLetterView
                    offer={{
                      student_name: offeringApp.full_name,
                      student_id: offeringApp.id,
                      company_name: offerForm.company_name,
                      position: offerForm.position,
                      start_date: offerForm.start_date,
                      end_date: offerForm.end_date,
                      stipend: offerForm.stipend,
                      location: offerForm.location,
                      letter_body: offerForm.letter_body,
                      offer_code: "PREVIEW-OFR",
                      issued_at: offerForm.issue_date,
                    }}
                  />
                </div>
              ) : (
                /* Form Fields */
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5 block font-semibold">Position / Role Title</Label>
                      <Input
                        value={offerForm.position}
                        onChange={(e) => setOfferForm({ ...offerForm, position: e.target.value })}
                        placeholder="e.g. C++ Programming"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block font-semibold">Company / Venture Name</Label>
                      <Input
                        value={offerForm.company_name}
                        onChange={(e) => setOfferForm({ ...offerForm, company_name: e.target.value })}
                        placeholder="codeInt"
                      />
                    </div>
                  </div>

                  {/* Date Customization: Issue Date, Start Date, End Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface-muted/40 p-3.5 rounded-xl border border-border">
                    <div>
                      <Label className="mb-1.5 block font-semibold text-xs flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-accent" /> Issue Date (Letterhead)
                      </Label>
                      <Input
                        type="date"
                        value={offerForm.issue_date}
                        onChange={(e) => setOfferForm({ ...offerForm, issue_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block font-semibold text-xs flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-accent" /> Internship Start Date
                      </Label>
                      <Input
                        type="date"
                        value={offerForm.start_date}
                        onChange={(e) => setOfferForm({ ...offerForm, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block font-semibold text-xs flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-accent" /> Internship End Date
                      </Label>
                      <Input
                        type="date"
                        value={offerForm.end_date}
                        onChange={(e) => setOfferForm({ ...offerForm, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5 block font-semibold">Stipend / Honorarium</Label>
                      <Input
                        value={offerForm.stipend}
                        onChange={(e) => setOfferForm({ ...offerForm, stipend: e.target.value })}
                        placeholder="Performance Based Stipend"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block font-semibold">Location / Mode</Label>
                      <Input
                        value={offerForm.location}
                        onChange={(e) => setOfferForm({ ...offerForm, location: e.target.value })}
                        placeholder="Remote / Hybrid"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5 block font-semibold">Offer Letter Terms & Congratulatory Body</Label>
                    <Textarea
                      rows={4}
                      value={offerForm.letter_body}
                      onChange={(e) => setOfferForm({ ...offerForm, letter_body: e.target.value })}
                      placeholder="Letter body text..."
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="pt-3 border-t border-border">
                <Button variant="outline" onClick={() => setOfferingApp(null)} disabled={issuingOffer}>
                  Cancel
                </Button>
                <Button
                  onClick={handleIssueOffer}
                  disabled={issuingOffer}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  {issuingOffer ? "Generating Letter..." : "Generate & Dispatch Offer"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================
          DIALOG 3: ISSUE COMPLETION CERTIFICATE GENERATOR
          ======================================================== */}
      <Dialog open={!!certifyingApp} onOpenChange={(v) => !v && setCertifyingApp(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Issue Official Completion Certificate</span>
              <span className="text-xs font-normal text-muted-foreground">
                Candidate: <strong className="text-foreground">{certForm.candidate_name || "New Candidate"}</strong>
              </span>
            </DialogTitle>
          </DialogHeader>

          {certifyingApp && (
            <div className="space-y-5 py-2">
              {/* Toggle Form / Live Preview */}
              <div className="flex justify-end gap-2 border-b border-border pb-3">
                <Button
                  type="button"
                  size="sm"
                  variant={!previewCert ? "default" : "outline"}
                  onClick={() => setPreviewCert(false)}
                  className="h-8 text-xs font-semibold"
                >
                  Configure Fields
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewCert ? "default" : "outline"}
                  onClick={() => setPreviewCert(true)}
                  className="h-8 text-xs font-semibold"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> Preview Certificate
                </Button>
              </div>

              {previewCert ? (
                /* Live Certificate Preview */
                <div className="w-full overflow-x-auto flex flex-col items-center justify-center p-4 bg-slate-100 rounded-2xl border border-border">
                  <CertificateView
                    cert={{
                      student_name: certForm.candidate_name,
                      company_name: certForm.company_name,
                      position: certForm.position,
                      start_date: certForm.start_date,
                      end_date: certForm.end_date,
                      performance: certForm.performance,
                      description: certForm.description,
                      cert_code: "PREVIEW-CERT",
                      issued_at: certForm.issue_date,
                    }}
                  />
                </div>
              ) : (
                /* Form Fields */
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5 block font-semibold">Candidate Full Name</Label>
                      <Input
                        value={certForm.candidate_name}
                        onChange={(e) => setCertForm({ ...certForm, candidate_name: e.target.value })}
                        placeholder="e.g. Rahul Verma"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block font-semibold">Internship Role / Stream</Label>
                      <Input
                        value={certForm.position}
                        onChange={(e) => setCertForm({ ...certForm, position: e.target.value })}
                        placeholder="e.g. Full Stack Web Development"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5 block font-semibold">Company / Venture</Label>
                      <Input
                        value={certForm.company_name}
                        onChange={(e) => setCertForm({ ...certForm, company_name: e.target.value })}
                        placeholder="codeInt"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block font-semibold">Performance Rating</Label>
                      <Select
                        value={certForm.performance}
                        onValueChange={(v) => setCertForm({ ...certForm, performance: v })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select Rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Outstanding">Outstanding</SelectItem>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Very Good">Very Good</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dates: Issue Date, Start Date, End Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                    <div>
                      <Label className="mb-1.5 block font-semibold text-xs flex items-center gap-1.5 text-amber-900">
                        <Calendar className="h-3.5 w-3.5 text-amber-600" /> Certificate Issue Date
                      </Label>
                      <Input
                        type="date"
                        value={certForm.issue_date}
                        onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block font-semibold text-xs flex items-center gap-1.5 text-amber-900">
                        <Calendar className="h-3.5 w-3.5 text-amber-600" /> Internship Start Date
                      </Label>
                      <Input
                        type="date"
                        value={certForm.start_date}
                        onChange={(e) => setCertForm({ ...certForm, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block font-semibold text-xs flex items-center gap-1.5 text-amber-900">
                        <Calendar className="h-3.5 w-3.5 text-amber-600" /> Internship End Date
                      </Label>
                      <Input
                        type="date"
                        value={certForm.end_date}
                        onChange={(e) => setCertForm({ ...certForm, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5 block font-semibold">Commendation & Achievements</Label>
                    <Textarea
                      rows={4}
                      value={certForm.description}
                      onChange={(e) => setCertForm({ ...certForm, description: e.target.value })}
                      placeholder="Candidate's project accomplishments and evaluation..."
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="pt-3 border-t border-border">
                <Button variant="outline" onClick={() => setCertifyingApp(null)} disabled={issuingCert}>
                  Cancel
                </Button>
                <Button
                  onClick={handleIssueCertificateAction}
                  disabled={issuingCert}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  <Award className="h-4 w-4 mr-1.5" />
                  {issuingCert ? "Generating Certificate..." : "Generate & Dispatch Certificate"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================
          DIALOG 4: VIEW GENERATED OFFER LETTER
          ======================================================== */}
      <Dialog open={!!viewingOffer} onOpenChange={(v) => !v && setViewingOffer(null)}>
        <DialogContent className="max-w-[850px] p-6 max-h-[90vh] overflow-y-auto bg-slate-100 flex flex-col items-center">
          <DialogHeader className="w-full">
            <DialogTitle className="flex justify-between items-center text-slate-900">
              <span>Official Offer Letter — {viewingOffer?.student_name}</span>
              <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border">
                {viewingOffer?.offer_code}
              </span>
            </DialogTitle>
          </DialogHeader>

          {viewingOffer && (
            <>
              <div className="w-full overflow-x-auto flex justify-center py-4">
                <OfferLetterView offer={viewingOffer} id={`offer-letter-${viewingOffer.id}`} />
              </div>
              <div className="flex w-full justify-between items-center border-t border-slate-300 pt-4 mt-2">
                <Button variant="outline" onClick={() => setViewingOffer(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadPDF(viewingOffer)}
                  disabled={downloadingOfferId === viewingOffer.id}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingOfferId === viewingOffer.id ? "Downloading..." : "Download Official A4 PDF"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================
          DIALOG 5: VIEW GENERATED CERTIFICATE
          ======================================================== */}
      <Dialog open={!!viewingCert} onOpenChange={(v) => !v && setViewingCert(null)}>
        <DialogContent className="max-w-5xl p-6 max-h-[90vh] overflow-y-auto bg-slate-100 flex flex-col items-center">
          <DialogHeader className="w-full">
            <DialogTitle className="flex justify-between items-center text-slate-900">
              <span>Official Certificate — {viewingCert?.student_name}</span>
              <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border">
                {viewingCert?.cert_code}
              </span>
            </DialogTitle>
          </DialogHeader>

          {viewingCert && (
            <>
              <div className="w-full overflow-x-auto flex justify-center py-4">
                <CertificateView cert={viewingCert} id={`certificate-modal-${viewingCert.id || viewingCert.cert_code}`} />
              </div>
              <div className="flex w-full justify-between items-center border-t border-slate-300 pt-4 mt-2">
                <Button variant="outline" onClick={() => setViewingCert(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadCertPDF(viewingCert)}
                  disabled={downloadingCertId === (viewingCert.id || viewingCert.cert_code)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingCertId === (viewingCert.id || viewingCert.cert_code) ? "Downloading..." : "Download Official A4 PDF"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
