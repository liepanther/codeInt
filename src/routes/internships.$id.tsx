import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Building2, MapPin, Clock, DollarSign, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/internships/$id")({
  component: InternshipDetail,
});

function InternshipDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, isStudent } = useAuth();
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState("");
  const [resume, setResume] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: internship, isLoading } = useQuery({
    queryKey: ["internship", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("internships").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: existingApp } = useQuery({
    queryKey: ["my-app", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("*").eq("internship_id", id).eq("student_id", user!.id).maybeSingle();
      return data;
    },
  });

  const submit = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!isStudent) return toast.error("Only students can apply");
    setSubmitting(true);
    const { error } = await supabase.from("applications").insert({
      internship_id: id,
      student_id: user.id,
      cover_letter: cover,
      resume_url: resume,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Application submitted!");
    setOpen(false);
  };

  if (isLoading) return <div className="min-h-screen">{user ? <DashboardLayout><div className="p-10 text-center text-muted-foreground">Loading...</div></DashboardLayout> : <><SiteHeader /><div className="p-10 text-center text-muted-foreground">Loading...</div></>}</div>;
  if (!internship) return <div className="min-h-screen">{user ? <DashboardLayout><div className="p-10 text-center">Internship not found</div></DashboardLayout> : <><SiteHeader /><div className="p-10 text-center">Internship not found</div></>}</div>;

  const Content = (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link to="/internships" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All internships
      </Link>

      <div className="surface-card p-8 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" /> {internship.company}
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">{internship.title}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {internship.location}</span>
              {internship.duration && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {internship.duration}</span>}
              {internship.stipend && <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> {internship.stipend}</span>}
              <Badge variant="outline">{internship.work_mode}</Badge>
              {internship.deadline && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Apply by {new Date(internship.deadline).toLocaleDateString()}</span>}
            </div>
          </div>
          <div>
            {existingApp ? (
              <Badge className="h-10 px-4 text-sm capitalize">Status: {existingApp.status}</Badge>
            ) : (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="rounded-full px-6">Apply now</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Apply — {internship.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5 block">Resume link</Label>
                      <Input value={resume} onChange={(e) => setResume(e.target.value)} placeholder="https://... (Google Drive, LinkedIn, etc.)" />
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Cover letter</Label>
                      <Textarea value={cover} onChange={(e) => setCover(e.target.value)} rows={6} placeholder="Tell them why you're a great fit..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={submit} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit application
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <Section title="About the role" body={internship.description} />
            {internship.responsibilities && <Section title="Responsibilities" body={internship.responsibilities} />}
            {internship.requirements && <Section title="What you'll need" body={internship.requirements} />}
          </div>
          <div>
            <div className="rounded-2xl border border-border bg-surface-muted/50 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skills</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(internship.skills || []).map((s: string) => (
                  <span key={s} className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (user) {
    return <DashboardLayout>{Content}</DashboardLayout>;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      {Content}
      <SiteFooter />
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
