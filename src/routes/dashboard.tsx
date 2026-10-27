import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/auth-gate";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { 
  Briefcase, FileText, Award, PlusCircle, Users, Sparkles, 
  User, GraduationCap, Phone, Mail, Pencil, MapPin, 
  Calendar, Globe, CheckCircle2, AlertCircle, ArrowRight, Download, Sparkle 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: () => <AuthGate><Dashboard /></AuthGate>,
});

function Dashboard() {
  const { profile, user, isStudent, isRecruiter } = useAuth();

  return (
    <DashboardLayout>
      {isStudent && <StudentDashboard userId={user!.id} profile={profile} />}
      {isRecruiter && <RecruiterDashboard userId={user!.id} profile={profile} />}
    </DashboardLayout>
  );
}

/* ==========================================================================
   STUDENT DASHBOARD
   ========================================================================== */
function StudentDashboard({ userId, profile }: { userId: string; profile: any }) {
  const [profileOpen, setProfileOpen] = useState(false);

  // Stats / Counters
  const { data: apps = [] } = useQuery({
    queryKey: ["stu-apps", userId],
    queryFn: async () => (await supabase.from("applications").select("*, internships(*)").eq("student_id", userId).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: offers = [] } = useQuery({
    queryKey: ["stu-offers", userId],
    queryFn: async () => (await supabase.from("offer_letters").select("*").eq("student_id", userId).order("issued_at", { ascending: false })).data ?? [],
  });
  const { data: certs = [] } = useQuery({
    queryKey: ["stu-certs", userId],
    queryFn: async () => (await supabase.from("certificates").select("*").eq("student_id", userId).order("issued_at", { ascending: false })).data ?? [],
  });

  // Recommended active internships list
  const { data: recommended = [], isLoading: recsLoading } = useQuery({
    queryKey: ["recommended-internships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Checklist counts
  const skillsMissing = !profile?.skills || profile.skills.length === 0;
  const profileIncomplete = !profile?.bio || !profile?.phone || !profile?.university;
  const todoCount = (skillsMissing ? 1 : 0) + (profileIncomplete ? 1 : 0) + 1; // Always show experience missing as 1

  return (
    <div id="view-home" className="view active">
      <div className="greeting">
        <h1>Good evening, {profile?.full_name ? profile.full_name.split(" ")[0] : "Student"}</h1>
        <div className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </div>

      <div className="kpi-row">
        <div className="kpi"><div className="kpi-top"><div className="kpi-icon"><svg className="dash-icon" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div><span className="kpi-trend">+1 this week</span></div><div className="kpi-num">{apps.length}</div><div className="kpi-cap">Active applications</div></div>
        <div className="kpi"><div className="kpi-top"><div className="kpi-icon"><svg className="dash-icon" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg></div><span className="kpi-trend">0 this week</span></div><div className="kpi-num">{offers.length}</div><div className="kpi-cap">Pending Offers</div></div>
        <div className="kpi"><div className="kpi-top"><div className="kpi-icon"><svg className="dash-icon" viewBox="0 0 24 24"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg></div><span className="kpi-trend">+0 today</span></div><div className="kpi-num">{certs.length}</div><div className="kpi-cap">Certificates</div></div>
        <div className="kpi"><div className="kpi-top"><div className="kpi-icon"><svg className="dash-icon" viewBox="0 0 24 24"><path d="M2.05 12a9.94 9.94 0 0119.9 0"/><circle cx="12" cy="12" r="3"/></svg></div><span className="kpi-trend">+12%</span></div><div className="kpi-num">{todoCount}</div><div className="kpi-cap">Profile tasks</div></div>
      </div>

      <div className="body-grid">
        <div className="main-col">

          <div className="panel">
            <div className="panel-head">
              <div><h2>Recommended for you</h2><div className="sub">A preview — see the full list in Internships</div></div>
              <Link to="/internships" className="panel-link">View all <svg className="dash-icon" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link>
            </div>
            <div className="intern-list">
              {recsLoading ? (
                <div className="py-8 text-center text-muted-2">Fetching recommendations...</div>
              ) : recommended.length === 0 ? (
                <div className="py-8 text-center text-muted-2">No active internships.</div>
              ) : (
                recommended.map((i: any) => (
                  <div className="intern-row" key={i.id}>
                    <div className="intern-mark">{i.company?.substring(0,2).toUpperCase()}</div>
                    <div className="intern-info">
                      <div className="intern-role">{i.title}</div>
                      <div className="intern-meta">{i.company} · {i.location} · {i.duration}</div>
                      <div className="intern-tags-inline"><span className="tag match">90% match</span></div>
                    </div>
                    <div className="intern-right">
                      <div className="intern-stipend">{i.stipend || "Unpaid"}</div>
                      <Link to="/internships/$id" params={{ id: i.id }} className="btn-mini">Apply <svg className="dash-icon" style={{width:11,height:11}} viewBox="0 0 24 24"><path d="M7 17L17 7M7 7h10v10"/></svg></Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div><h2>Your applications</h2><div className="sub">A preview — manage everything in Applications</div></div>
              <Link to="/my/applications" className="panel-link">View all <svg className="dash-icon" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link>
            </div>
            <div className="stage-track">
              <div className="stage"><div className="stage-dot-row"><div className="stage-dot">{apps.filter((a:any) => a.status === 'applied').length}</div><div><div className="stage-name">Applied</div><div className="stage-count">Awaiting review</div></div></div></div>
              <div className="stage"><div className="stage-dot-row"><div className="stage-dot">{apps.filter((a:any) => a.status === 'interviewing').length}</div><div><div className="stage-name">Screening</div><div className="stage-count">Recruiter review</div></div></div></div>
              <div className="stage"><div className="stage-dot-row"><div className="stage-dot">{apps.filter((a:any) => a.status === 'offer_extended').length}</div><div><div className="stage-name">Offer</div><div className="stage-count">Decision pending</div></div></div></div>
              <div className="stage"><div className="stage-dot-row"><div className="stage-dot">{apps.filter((a:any) => a.status === 'accepted' || a.status === 'rejected').length}</div><div><div className="stage-name">Decided</div><div className="stage-count">Accepted/Rejected</div></div></div></div>
            </div>
            {apps.slice(0, 3).map((a: any) => (
              <div className="app-mini" key={a.id}>
                <div className="intern-mark">{a.internships?.company?.substring(0,2).toUpperCase()}</div>
                <div><div className="app-role-sm">{a.internships?.title}</div><div className="app-company-sm">{a.internships?.company}</div></div>
                <span className={`status-pill ${a.status === 'applied' ? 'wait' : a.status === 'rejected' ? 'danger' : 'good'}`}>{a.status.replace('_', ' ')}</span>
              </div>
            ))}
            {apps.length === 0 && <div className="py-8 text-center text-muted-2" style={{borderTop: '1px solid var(--line)'}}>No applications submitted.</div>}
          </div>

        </div>

        <div className="rail">
          <div className="rail-card">
            <div className="profile-widget">
              <div className="ring-mini">
                <svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" stroke="#EBE2CC" strokeWidth="7" fill="none"/><circle cx="32" cy="32" r="27" stroke="#F2B544" strokeWidth="7" fill="none" strokeDasharray="170" strokeDashoffset={profileIncomplete ? "80" : "20"} strokeLinecap="round"/></svg>
                <div className="ring-mini-label">{profileIncomplete ? '60%' : '95%'}</div>
              </div>
              <div>
                <h3 style={{marginBottom: 2}}>Profile strength</h3>
                <div className="profile-todo">{profileIncomplete ? 'Add missing details' : 'Looking great!'}</div>
                <div className="profile-cta" onClick={() => setProfileOpen(true)}>Edit profile <svg className="dash-icon" style={{width:11,height:11}} viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
              </div>
            </div>
          </div>

          <div className="rail-dark">
            <h3>Career resources, built for interns</h3>
            <p>Guides, mock interviews, and portfolio reviews from industry pros.</p>
            <div className="go">Explore resources <svg className="dash-icon" style={{width:12,height:12}} viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
          </div>
        </div>
      </div>
      
      <ProfileEditModal open={profileOpen} onClose={() => setProfileOpen(false)} profile={profile} userId={userId} />
    </div>
  );
}

/* ==========================================================================
   RECRUITER DASHBOARD
   ========================================================================== */
function RecruiterDashboard({ userId, profile }: { userId: string; profile: any }) {
  const [profileOpen, setProfileOpen] = useState(false);

  // Queries
  const { data: postings = [] } = useQuery({
    queryKey: ["rec-postings", userId],
    queryFn: async () => (await supabase.from("internships").select("*").eq("recruiter_id", userId).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: apps = [] } = useQuery({
    queryKey: ["rec-apps", userId],
    queryFn: async () => {
      const { data: myInts } = await supabase.from("internships").select("id").eq("recruiter_id", userId);
      const ids = (myInts ?? []).map((i: any) => i.id);
      if (ids.length === 0) return [];
      return (await supabase.from("applications").select("*, internships(title, company), profiles!student_id(full_name, email, university)").in("internship_id", ids).order("created_at", { ascending: false })).data ?? [];
    },
  });

  const stats = [
    { label: "Active postings", value: postings.filter((p: any) => p.is_active).length, href: "/recruiter/postings" as const, icon: Briefcase },
    { label: "Applications received", value: apps.length, href: "/recruiter/applications" as const, icon: Users },
  ];

  return (
    <div id="view-home" className="view active">
      <div className="greeting">
        <h1>Hi, {profile?.full_name ? profile.full_name.split(" ")[0] : "Recruiter"} 👋</h1>
        <div className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </div>

      <div className="kpi-row">
        <div className="kpi"><div className="kpi-top"><div className="kpi-icon"><svg className="dash-icon" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></div><span className="kpi-trend">Active</span></div><div className="kpi-num">{postings.filter((p: any) => p.is_active).length}</div><div className="kpi-cap">Job Postings</div></div>
        <div className="kpi"><div className="kpi-top"><div className="kpi-icon"><svg className="dash-icon" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div><span className="kpi-trend">+10%</span></div><div className="kpi-num">{apps.length}</div><div className="kpi-cap">Total Candidates</div></div>
      </div>

      <div className="body-grid">
        <div className="main-col">
          <div className="panel">
            <div className="panel-head">
              <div><h2>Recent Applications Received</h2><div className="sub">Review your latest candidates</div></div>
              <Link to="/recruiter/applications" className="panel-link">Manage <svg className="dash-icon" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link>
            </div>
            {apps.length === 0 ? (
               <div className="py-8 text-center text-muted-2" style={{borderTop: '1px solid var(--line)'}}>No applications received yet.</div>
            ) : (
               apps.slice(0, 5).map((a: any) => (
                 <div className="app-mini" key={a.id}>
                   <div className="intern-mark">{a.profiles?.full_name?.substring(0,2).toUpperCase()}</div>
                   <div><div className="app-role-sm">{a.profiles?.full_name}</div><div className="app-company-sm">Applied for {a.internships?.title}</div></div>
                   <span className={`status-pill ${a.status === 'applied' ? 'wait' : 'info'}`}>{a.status.replace('_', ' ')}</span>
                 </div>
               ))
            )}
          </div>
        </div>
        <div className="rail">
          <div className="rail-card">
            <h3 style={{marginBottom: 2}}>Recruiter Actions</h3>
            <div className="sub">Manage your portal</div>
            <Link to="/recruiter/new" className="mini-item">
              <span className="mini-tag">New</span>
              <div><div className="mini-title">Post Internship</div><div className="mini-sub">Share new opportunities.</div></div>
            </Link>
            <Link to="/recruiter/certificates" className="mini-item">
              <span className="mini-tag">Cert</span>
              <div><div className="mini-title">Issue Certificate</div><div className="mini-sub">Reward candidate efforts.</div></div>
            </Link>
          </div>
          <div className="rail-dark" style={{cursor: 'pointer'}} onClick={() => setProfileOpen(true)}>
            <h3>Update Company Profile</h3>
            <p>Ensure candidates see the most accurate info about your brand.</p>
            <div className="go">Edit Profile <svg className="dash-icon" style={{width:12,height:12}} viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
          </div>
        </div>
      </div>

      <ProfileEditModal open={profileOpen} onClose={() => setProfileOpen(false)} profile={profile} userId={userId} />
    </div>
  );
}

/* ==========================================================================
   SIDEBAR RESUME PROFILE CARD
   ========================================================================== */
function ProfileCard({ profile, onEdit }: { profile: any; onEdit: () => void }) {
  if (!profile) return null;
  const isStudent = profile.role === "student";

  return (
    <div className="surface-card overflow-hidden rounded-3xl border border-brand-dark/10 shadow-sm transition-all bg-white relative">
      {/* Decorative cover header */}
      <div className="h-20 bg-brand-yellow/30 border-b border-brand-dark/5" />

      {/* Main card info wrapper */}
      <div className="px-5 pb-5 pt-0 relative">
        {/* User avatar overlapping header */}
        <div className="flex justify-between items-end mb-3">
          <div className="mt-[-32px] relative">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-dark text-white font-display font-bold text-2xl border-[3px] border-white shadow-sm uppercase">
              {profile.full_name ? profile.full_name[0] : (profile.email ? profile.email[0] : "?")}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 text-[11px] font-bold text-brand-dark/70 hover:text-brand-dark hover:bg-brand-beige rounded-xl px-3 border border-transparent hover:border-brand-dark/10">
            <Pencil className="h-3 w-3 mr-1.5" /> Edit
          </Button>
        </div>

        {/* User Header Details */}
        <div className="space-y-1">
          <h2 className="font-display font-bold text-base text-brand-dark tracking-tight leading-tight">{profile.full_name || "Anonymous"}</h2>
          {isStudent && profile.university ? (
            <div className="flex items-center gap-1.5 text-xs text-brand-dark/60 font-medium">
              <GraduationCap className="h-3.5 w-3.5 text-brand-dark/40 shrink-0" />
              <span className="truncate">{profile.university}</span>
            </div>
          ) : !isStudent && profile.company_name ? (
             <div className="flex items-center gap-1.5 text-xs text-brand-dark/60 font-medium">
               <Briefcase className="h-3.5 w-3.5 text-brand-dark/40 shrink-0" />
               <span className="truncate">Recruiter at {profile.company_name}</span>
             </div>
          ) : null}
        </div>

        {/* Contact info list */}
        <div className="mt-4 pt-4 border-t border-brand-dark/5 space-y-2.5 text-xs text-brand-dark/70 font-medium">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-brand-dark/40 shrink-0" />
            <span className="truncate">{profile.email}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-brand-dark/40 shrink-0" />
            <span>{profile.phone || "No phone contact"}</span>
          </div>
        </div>

        {/* Skills Tag Section */}
        {isStudent && (
          <div className="mt-4 pt-4 border-t border-brand-dark/5 space-y-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-dark/40">Core Skills</h3>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.skills.map((s: string) => (
                    <span key={s} className="rounded-md bg-brand-beige px-2 py-1 text-[10px] font-bold text-brand-dark border border-brand-dark/10">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] italic text-brand-dark/50 font-medium">No skills listed.</p>
              )}
            </div>
            <Link to="/my/resume" className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-brand-dark hover:bg-black text-xs font-bold text-white shadow-sm transition-all mt-2">
              Build / View Resume
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   EDIT PROFILE MODAL
   ========================================================================== */
function ProfileEditModal({ open, onClose, profile, userId }: { open: boolean; onClose: () => void; profile: any; userId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    university: "",
    phone: "",
    bio: "",
    skills: "",
    company_name: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        university: profile.university || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        skills: (profile.skills || []).join(", "),
        company_name: profile.company_name || "",
      });
    }
  }, [profile, open]);

  const isStudent = profile?.role === "student";
  const isRecruiter = profile?.role === "recruiter";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const skillsArray = form.skills
      ? form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        university: isStudent ? form.university : null,
        company_name: isRecruiter ? form.company_name : null,
        phone: form.phone || null,
        bio: form.bio || null,
        skills: skillsArray,
      })
      .eq("id", userId);

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile details updated!");
      onClose();
      qc.invalidateQueries();
      router.invalidate();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div>
            <Label className="mb-1.5 block">Full Name</Label>
            <Input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          {isStudent && (
            <div>
              <Label className="mb-1.5 block">College / University</Label>
              <Input
                value={form.university}
                onChange={(e) => setForm({ ...form, university: e.target.value })}
                placeholder="MIT, Stanford, etc."
              />
            </div>
          )}

          {isRecruiter && (
            <div>
              <Label className="mb-1.5 block">Company Name</Label>
              <Input
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="Internly Inc."
              />
            </div>
          )}

          <div>
            <Label className="mb-1.5 block">Phone Number</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 012-3456"
            />
          </div>

          {isStudent && (
            <div>
              <Label className="mb-1.5 block">Skills (comma separated)</Label>
              <Input
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="React, TypeScript, Node.js"
              />
            </div>
          )}

          <div>
            <Label className="mb-1.5 block">About Me / Summary</Label>
            <Textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Write a brief professional bio..."
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ==========================================================================
   HELPER UTILITY COMPONENTS
   ========================================================================== */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    applied: "bg-muted text-muted-foreground",
    shortlisted: "bg-warning/20 text-warning-foreground",
    offered: "bg-accent/20 text-accent border border-accent/10",
    hired: "bg-success/20 text-success-foreground border border-success/10",
    rejected: "bg-destructive/15 text-destructive",
    pending: "bg-warning/20 text-warning-foreground",
    accepted: "bg-success/20 text-success-foreground border border-success/10",
    declined: "bg-destructive/15 text-destructive",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] || "bg-muted"}`}>{status}</span>;
}

function EmptyState({ msg, cta }: { msg: string; cta?: { label: string; href: string } }) {
  return (
    <div className="grid place-items-center py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed">
      <p className="text-sm text-slate-500">{msg}</p>
      {cta && <Link to={cta.href} className="mt-3 text-xs font-bold text-accent hover:underline">{cta.label} →</Link>}
    </div>
  );
}
