import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/auth-gate";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/recruiter/new")({
  component: () => <AuthGate requireRole="recruiter"><Page /></AuthGate>,
});

function Page() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    title: "",
    company: profile?.company_name || "",
    location: "",
    work_mode: "Remote",
    description: "",
    responsibilities: "",
    requirements: "",
    stipend: "",
    duration: "",
    skills: "",
    deadline: "",
  });

  const set = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: typeof e === "string" ? e : e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("internships").insert({
      recruiter_id: user!.id,
      title: f.title,
      company: f.company,
      location: f.location,
      work_mode: f.work_mode,
      description: f.description,
      responsibilities: f.responsibilities || null,
      requirements: f.requirements || null,
      stipend: f.stipend || null,
      duration: f.duration || null,
      skills: f.skills.split(",").map((s) => s.trim()).filter(Boolean),
      deadline: f.deadline || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Internship posted!");
    navigate({ to: "/recruiter/postings" });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Post an internship</h1>
        <p className="mt-1 text-muted-foreground">Share the details. Students will start applying immediately.</p>

        <form onSubmit={submit} className="surface-card mt-8 space-y-5 p-8">
          <Row>
            <Fld label="Role title *" value={f.title} onChange={set("title")} placeholder="Software Engineering Intern" required />
            <Fld label="Company *" value={f.company} onChange={set("company")} required />
          </Row>
          <Row>
            <Fld label="Location *" value={f.location} onChange={set("location")} placeholder="San Francisco, CA" required />
            <div>
              <Label className="mb-1.5 block">Work mode</Label>
              <Select value={f.work_mode} onValueChange={set("work_mode")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="Onsite">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Row>
          <div>
            <Label className="mb-1.5 block">About the role *</Label>
            <Textarea value={f.description} onChange={set("description")} rows={4} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Responsibilities</Label>
            <Textarea value={f.responsibilities} onChange={set("responsibilities")} rows={3} placeholder="One per line" />
          </div>
          <div>
            <Label className="mb-1.5 block">Requirements</Label>
            <Textarea value={f.requirements} onChange={set("requirements")} rows={3} />
          </div>
          <Row>
            <Fld label="Stipend" value={f.stipend} onChange={set("stipend")} placeholder="$4,000/month" />
            <Fld label="Duration" value={f.duration} onChange={set("duration")} placeholder="12 weeks" />
          </Row>
          <Row>
            <Fld label="Skills (comma separated)" value={f.skills} onChange={set("skills")} placeholder="React, TypeScript, PostgreSQL" />
            <Fld label="Application deadline" type="date" value={f.deadline} onChange={set("deadline")} />
          </Row>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Publish posting
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}
function Fld({ label, value, onChange, ...rest }: any) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Input value={value} onChange={onChange} {...rest} />
    </div>
  );
}
