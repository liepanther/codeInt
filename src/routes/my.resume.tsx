import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/auth-gate";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Download, Plus, Pencil, Trash2, GraduationCap, 
  Briefcase, Mail, Phone, MapPin, AlertCircle, Save, Award, CheckCircle2 
} from "lucide-react";

export const Route = createFileRoute("/my/resume")({
  component: () => <AuthGate requireRole="student"><Page /></AuthGate>,
});

interface ResumeEducation {
  id: string;
  degree: string;
  school: string;
  startYear: string;
  endYear: string;
}

interface ResumeExperience {
  id: string;
  role: string;
  company: string;
  startYear: string;
  endYear: string;
  description?: string;
}

interface ResumeProfileData {
  bio: string;
  careerObjective: string;
  education: ResumeEducation[];
  experience: ResumeExperience[];
}

// Parses profile.bio JSON structure, fallbacks to plain text if not JSON
function parseResumeData(bioText: string | null): ResumeProfileData {
  const defaultData: ResumeProfileData = {
    bio: "",
    careerObjective: "",
    education: [],
    experience: [],
  };
  if (!bioText) return defaultData;
  try {
    const parsed = JSON.parse(bioText);
    if (parsed && typeof parsed === "object" && (parsed.education || parsed.experience || parsed.careerObjective || parsed.bio)) {
      return {
        bio: parsed.bio || "",
        careerObjective: parsed.careerObjective || "",
        education: parsed.education || [],
        experience: parsed.experience || [],
      };
    }
  } catch (e) {
    // Treat string as bio fallback
  }
  return {
    ...defaultData,
    bio: bioText,
    careerObjective: bioText,
  };
}

function Page() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [loading, setLoading] = useState(false);
  const resume = parseResumeData(profile?.bio ?? null);

  // Modal controls
  const [eduModal, setEduModal] = useState<{ open: boolean; data?: ResumeEducation | null }>({ open: false });
  const [expModal, setExpModal] = useState<{ open: boolean; data?: ResumeExperience | null }>({ open: false });
  const [basicModal, setBasicModal] = useState(false);
  const [objModal, setObjModal] = useState(false);
  const [skillsModal, setSkillsModal] = useState(false);

  // Edit Forms
  const [basicForm, setBasicForm] = useState({ full_name: "", university: "", phone: "" });
  const [objForm, setObjForm] = useState({ careerObjective: "" });
  const [skillsForm, setSkillsForm] = useState({ skills: "" });
  const [eduForm, setEduForm] = useState({ degree: "", school: "", startYear: "", endYear: "" });
  const [expForm, setExpForm] = useState({ role: "", company: "", startYear: "", endYear: "", description: "" });

  useEffect(() => {
    if (profile) {
      setBasicForm({
        full_name: profile.full_name || "",
        university: profile.university || "",
        phone: profile.phone || "",
      });
      setObjForm({
        careerObjective: resume.careerObjective || resume.bio || "",
      });
      setSkillsForm({
        skills: (profile.skills || []).join(", "),
      });
    }
  }, [profile]);

  const saveResumeJson = async (updatedData: Partial<ResumeProfileData>) => {
    if (!user) return;
    setLoading(true);
    const finalPayload: ResumeProfileData = {
      bio: updatedData.bio !== undefined ? updatedData.bio : (resume.bio || resume.careerObjective),
      careerObjective: updatedData.careerObjective !== undefined ? updatedData.careerObjective : (resume.careerObjective || resume.bio),
      education: updatedData.education !== undefined ? updatedData.education : resume.education,
      experience: updatedData.experience !== undefined ? updatedData.experience : resume.experience,
    };

    const { error } = await supabase
      .from("profiles")
      .update({
        bio: JSON.stringify(finalPayload),
      })
      .eq("id", user.id);

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      qc.invalidateQueries();
      router.invalidate();
    }
  };

  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: basicForm.full_name,
        university: basicForm.university,
        phone: basicForm.phone || null,
      })
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Personal details updated!");
      setBasicModal(false);
      qc.invalidateQueries();
      router.invalidate();
    }
  };

  const handleSaveObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveResumeJson({ careerObjective: objForm.careerObjective, bio: objForm.careerObjective });
    toast.success("Objective updated!");
    setObjModal(false);
  };

  const handleSaveSkills = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const skillsArray = skillsForm.skills
      ? skillsForm.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const { error } = await supabase
      .from("profiles")
      .update({ skills: skillsArray })
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Skills updated!");
      setSkillsModal(false);
      qc.invalidateQueries();
      router.invalidate();
    }
  };

  // Education Add / Edit / Delete
  const openAddEdu = () => {
    setEduForm({ degree: "", school: "", startYear: "", endYear: "" });
    setEduModal({ open: true, data: null });
  };
  const openEditEdu = (item: ResumeEducation) => {
    setEduForm({ degree: item.degree, school: item.school, startYear: item.startYear, endYear: item.endYear });
    setEduModal({ open: true, data: item });
  };
  const handleSaveEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    let updated: ResumeEducation[] = [];
    if (eduModal.data) {
      // Editing
      updated = resume.education.map((item) => 
        item.id === eduModal.data?.id ? { ...item, ...eduForm } : item
      );
    } else {
      // Adding
      const newItem: ResumeEducation = {
        id: crypto.randomUUID(),
        ...eduForm,
      };
      updated = [...resume.education, newItem];
    }
    await saveResumeJson({ education: updated });
    toast.success("Education history updated!");
    setEduModal({ open: false });
  };
  const handleDeleteEdu = async (id: string) => {
    if (!confirm("Delete this education entry?")) return;
    const updated = resume.education.filter((item) => item.id !== id);
    await saveResumeJson({ education: updated });
    toast.success("Entry removed");
  };

  // Experience Add / Edit / Delete
  const openAddExp = () => {
    setExpForm({ role: "", company: "", startYear: "", endYear: "", description: "" });
    setExpModal({ open: true, data: null });
  };
  const openEditExp = (item: ResumeExperience) => {
    setExpForm({ 
      role: item.role, 
      company: item.company, 
      startYear: item.startYear, 
      endYear: item.endYear, 
      description: item.description || "" 
    });
    setExpModal({ open: true, data: item });
  };
  const handleSaveExp = async (e: React.FormEvent) => {
    e.preventDefault();
    let updated: ResumeExperience[] = [];
    if (expModal.data) {
      // Editing
      updated = resume.experience.map((item) => 
        item.id === expModal.data?.id ? { ...item, ...expForm } : item
      );
    } else {
      // Adding
      const newItem: ResumeExperience = {
        id: crypto.randomUUID(),
        ...expForm,
      };
      updated = [...resume.experience, newItem];
    }
    await saveResumeJson({ experience: updated });
    toast.success("Work history updated!");
    setExpModal({ open: false });
  };
  const handleDeleteExp = async (id: string) => {
    if (!confirm("Delete this experience entry?")) return;
    const updated = resume.experience.filter((item) => item.id !== id);
    await saveResumeJson({ experience: updated });
    toast.success("Entry removed");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-6 py-10 print:px-0 print:py-0">
        
        {/* Back Link and Action Row (print:hidden) */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <Button onClick={handlePrint} variant="outline" className="gap-2 rounded-xl font-bold shadow-sm bg-card hover:bg-slate-50">
            <Download className="h-4 w-4" /> Download / Print Resume
          </Button>
        </div>

        {/* Informative Warning Card (print:hidden) */}
        <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-2xl flex gap-3 text-xs leading-relaxed mb-8 print:hidden">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-blue-900">Internly Resume Profile</p>
            <p className="text-blue-800 mt-0.5">This is the official master resume employers will see when you apply to postings. Keep it complete, professional, and up-to-date.</p>
          </div>
        </div>

        {/* Master Resume Canvas sheet */}
        <div className="surface-card bg-card border border-border rounded-3xl overflow-hidden print:border-none print:shadow-none print:bg-transparent">
          
          {/* Header Resume Banner */}
          <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-wrap justify-between items-start gap-6 print:bg-none print:border-b-2 print:border-slate-800 print:px-0">
            <div>
              <h1 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight leading-none print:text-4xl">{profile?.full_name || "Name Not Specified"}</h1>
              <p className="text-sm font-semibold text-slate-600 mt-2 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-slate-400" /> {profile?.university || "Add University Details"}
              </p>

              {/* Meta contact grid */}
              <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {profile?.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {profile?.phone || "No phone added"}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> Student Profile</span>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => setBasicModal(true)} className="rounded-xl gap-1.5 h-8 text-xs font-bold bg-card border-border shadow-sm print:hidden">
              <Pencil className="h-3.5 w-3.5" /> Edit Basic Details
            </Button>
          </div>

          <div className="p-8 space-y-8 print:px-0">
            
            {/* 1. CAREER OBJECTIVE */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 print:text-slate-900">Career Objective</h2>
                <Button variant="ghost" size="sm" onClick={() => setObjModal(true)} className="h-7 text-xs font-bold text-accent hover:bg-slate-50 rounded-full px-2 print:hidden">
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </div>
              {resume.careerObjective ? (
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{resume.careerObjective}</p>
              ) : (
                <button onClick={() => setObjModal(true)} className="w-full py-4 border border-dashed border-slate-200 hover:bg-slate-50/50 rounded-2xl text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5 transition-colors print:hidden">
                  <Plus className="h-4 w-4" /> Add a career objective
                </button>
              )}
            </div>

            {/* 2. EDUCATION */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 print:text-slate-900">Education</h2>
                <Button variant="ghost" size="sm" onClick={openAddEdu} className="h-7 text-xs font-bold text-accent hover:bg-slate-50 rounded-full px-2.5 print:hidden">
                  <Plus className="h-4 w-4 mr-1" /> Add Education
                </Button>
              </div>
              {resume.education.length > 0 ? (
                <div className="space-y-4">
                  {resume.education.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/30 print:p-0 print:border-none print:bg-none">
                      <div className="flex gap-3">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0 h-10 w-10 grid place-items-center print:hidden"><GraduationCap className="h-5 w-5" /></div>
                        <div>
                          <h3 className="font-display font-bold text-sm text-slate-800 leading-tight print:text-base">{item.degree}</h3>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">{item.school}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wide">{item.startYear} — {item.endYear}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 print:hidden">
                        <Button variant="ghost" size="icon" onClick={() => openEditEdu(item)} className="h-8 w-8 text-slate-500 hover:text-slate-800 rounded-full">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEdu(item.id)} className="h-8 w-8 text-red-500 hover:text-red-700 rounded-full">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={openAddEdu} className="w-full py-6 border border-dashed border-slate-200 hover:bg-slate-50/50 rounded-2xl text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5 transition-colors print:hidden">
                  <Plus className="h-4 w-4" /> Add education details
                </button>
              )}
            </div>

            {/* 3. WORK EXPERIENCE */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 print:text-slate-900">Work Experience / Projects</h2>
                <Button variant="ghost" size="sm" onClick={openAddExp} className="h-7 text-xs font-bold text-accent hover:bg-slate-50 rounded-full px-2.5 print:hidden">
                  <Plus className="h-4 w-4 mr-1" /> Add Experience
                </Button>
              </div>
              {resume.experience.length > 0 ? (
                <div className="space-y-4">
                  {resume.experience.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/30 print:p-0 print:border-none print:bg-none">
                      <div className="flex gap-3">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0 h-10 w-10 grid place-items-center print:hidden"><Briefcase className="h-5 w-5" /></div>
                        <div>
                          <h3 className="font-display font-bold text-sm text-slate-800 leading-tight print:text-base">{item.role}</h3>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">{item.company}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wide">{item.startYear} — {item.endYear}</p>
                          {item.description && <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">{item.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 print:hidden">
                        <Button variant="ghost" size="icon" onClick={() => openEditExp(item)} className="h-8 w-8 text-slate-500 hover:text-slate-800 rounded-full">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteExp(item.id)} className="h-8 w-8 text-red-500 hover:text-red-700 rounded-full">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={openAddExp} className="w-full py-6 border border-dashed border-slate-200 hover:bg-slate-50/50 rounded-2xl text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5 transition-colors print:hidden">
                  <Plus className="h-4 w-4" /> Add internship or project experience
                </button>
              )}
            </div>

            {/* 4. SKILLS */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 print:text-slate-900">Skills</h2>
                <Button variant="ghost" size="sm" onClick={() => setSkillsModal(true)} className="h-7 text-xs font-bold text-accent hover:bg-slate-50 rounded-full px-2.5 print:hidden">
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Skills
                </Button>
              </div>
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.skills.map((s: string) => (
                    <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200 shadow-sm print:border-none print:shadow-none print:px-2 print:py-0 print:bg-transparent print:underline">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <button onClick={() => setSkillsModal(true)} className="w-full py-4 border border-dashed border-slate-200 hover:bg-slate-50/50 rounded-2xl text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5 transition-colors print:hidden">
                  <Plus className="h-4 w-4" /> Add technical skills
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ==================== DIALOGS / EDITORS ==================== */}

      {/* Basic Contact Info Dialog */}
      <Dialog open={basicModal} onOpenChange={setBasicModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Personal Details</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveBasic} className="space-y-4 py-2">
            <div>
              <Label className="mb-1 block">Full Name</Label>
              <Input required value={basicForm.full_name} onChange={(e) => setBasicForm({ ...basicForm, full_name: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block">College / University</Label>
              <Input required value={basicForm.university} onChange={(e) => setBasicForm({ ...basicForm, university: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block">Phone Number</Label>
              <Input value={basicForm.phone} onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })} placeholder="+1 (555) 012-3456" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setBasicModal(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Objective Dialog */}
      <Dialog open={objModal} onOpenChange={setObjModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Career Objective</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveObjective} className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5 block">Professional Summary / Objective</Label>
              <Textarea rows={4} value={objForm.careerObjective} onChange={(e) => setObjForm({ ...objForm, careerObjective: e.target.value })} placeholder="A motivated student looking for..." />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setObjModal(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Skills Dialog */}
      <Dialog open={skillsModal} onOpenChange={setSkillsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Technical Skills</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveSkills} className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5 block">Skills (comma separated)</Label>
              <Input value={skillsForm.skills} onChange={(e) => setSkillsForm({ ...skillsForm, skills: e.target.value })} placeholder="React, Python, TypeScript" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setSkillsModal(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Education Add/Edit Dialog */}
      <Dialog open={eduModal.open} onOpenChange={(v) => !v && setEduModal({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{eduModal.data ? "Edit Education Entry" : "Add Education Entry"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveEdu} className="space-y-4 py-2">
            <div>
              <Label className="mb-1 block">Degree / Course</Label>
              <Input required value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} placeholder="e.g. B.Tech Computer Science" />
            </div>
            <div>
              <Label className="mb-1 block">School / Institution</Label>
              <Input required value={eduForm.school} onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })} placeholder="e.g. IIT Madras" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Start Year</Label>
                <Input required value={eduForm.startYear} onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })} placeholder="2024" />
              </div>
              <div>
                <Label className="mb-1 block">End Year (or Expected)</Label>
                <Input required value={eduForm.endYear} onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })} placeholder="2028" />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEduModal({ open: false })} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Experience Add/Edit Dialog */}
      <Dialog open={expModal.open} onOpenChange={(v) => !v && setExpModal({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{expModal.data ? "Edit Experience Entry" : "Add Experience Entry"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveExp} className="space-y-4 py-2">
            <div>
              <Label className="mb-1 block">Role / Title</Label>
              <Input required value={expForm.role} onChange={(e) => setExpForm({ ...expForm, role: e.target.value })} placeholder="e.g. Frontend Intern" />
            </div>
            <div>
              <Label className="mb-1 block">Company / Organization</Label>
              <Input required value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} placeholder="e.g. Internly" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Start Date/Year</Label>
                <Input required value={expForm.startYear} onChange={(e) => setExpForm({ ...expForm, startYear: e.target.value })} placeholder="June 2025" />
              </div>
              <div>
                <Label className="mb-1 block">End Date/Year</Label>
                <Input required value={expForm.endYear} onChange={(e) => setExpForm({ ...expForm, endYear: e.target.value })} placeholder="August 2025" />
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Responsibilities / Details</Label>
              <Textarea rows={3} value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="Describe your achievements and duties..." />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setExpModal({ open: false })} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
