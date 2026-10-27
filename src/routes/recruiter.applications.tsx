import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/auth-gate";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./dashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { FileText, Send, Loader2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/recruiter/applications")({
  component: () => <AuthGate requireRole="recruiter"><Page /></AuthGate>,
});

function Page() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [offering, setOffering] = useState<any | null>(null);

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["rec-apps-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: myInts } = await supabase.from("internships").select("id, title, company, location").eq("recruiter_id", user!.id);
      const ids = (myInts ?? []).map((i: any) => i.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("applications").select("*, internships(*), profiles!student_id(full_name, email, university, phone), offer_letters(id)").in("internship_id", ids).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const app = apps.find((x: any) => x.id === id);
    const hasOffer = app && app.offer_letters && app.offer_letters.length > 0;
    if (app && (app.status === "rejected" || app.status === "hired" || (app.status === "offered" && hasOffer))) {
      return toast.error("A final decision has already been taken on this application.");
    }
    
    if (status === "offered") {
      // Trigger the Issue Offer dialog modal instead of editing status directly
      setOffering(app);
      return;
    }
    
    if (status === "hired") {
      return toast.error("Applications are marked as Hired automatically when the student accepts the offer letter.");
    }

    const { error } = await supabase.from("applications").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["rec-apps-full"] });
    toast.success("Updated");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Applications</h1>
        <p className="mt-1 text-muted-foreground">Review candidates and issue offer letters in one place.</p>

        <div className="mt-8 grid gap-4">
          {isLoading ? (
            <div className="surface-card p-8 text-center text-muted-foreground">Loading...</div>
          ) : apps.length === 0 ? (
            <div className="surface-card p-10 text-center text-muted-foreground">No applications yet.</div>
          ) : (
            apps.map((a: any) => (
              <div key={a.id} className="surface-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/20 font-display font-bold text-accent">
                        {(a.profiles?.full_name || a.profiles?.email || "?")[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-display font-semibold">{a.profiles?.full_name || a.profiles?.email}</div>
                        <div className="text-xs text-muted-foreground">{a.profiles?.email}{a.profiles?.university && ` · ${a.profiles.university}`}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      Applied to <span className="font-semibold text-foreground">{a.internships?.title}</span> · {new Date(a.created_at).toLocaleDateString()}
                    </div>
                    {a.cover_letter && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Cover letter</summary>
                        <p className="mt-2 rounded-lg border border-border bg-surface-muted/50 p-3 text-sm">{a.cover_letter}</p>
                      </details>
                    )}
                    {a.resume_url && (
                      <a href={a.resume_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                        <ExternalLink className="h-3 w-3" /> View resume
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={a.status} />
                    <Select 
                      value={a.status} 
                      onValueChange={(v) => setStatus(a.id, v)}
                      disabled={a.status === "rejected" || a.status === "hired" || (a.status === "offered" && a.offer_letters && a.offer_letters.length > 0)}
                    >
                      <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="offered">Offered</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                      </SelectContent>
                    </Select>
                    {a.status !== "rejected" && a.status !== "hired" && (a.status !== "offered" || !a.offer_letters || a.offer_letters.length === 0) ? (
                      <Button size="sm" onClick={() => setOffering(a)}>
                        <FileText className="mr-1 h-3 w-3" /> Issue offer
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" disabled className="text-xs">
                        Decision finalized
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {offering && <OfferDialog app={offering} onClose={() => setOffering(null)} onDone={() => qc.invalidateQueries({ queryKey: ["rec-apps-full"] })} />}
    </DashboardLayout>
  );
}

function OfferDialog({ app, onClose, onDone }: { app: any; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    position: app.internships?.title || "",
    start_date: "",
    end_date: "",
    stipend: app.internships?.stipend || "",
    location: app.internships?.location || "",
    letter_body: `We are excited about the value you'll bring to our team. Your acceptance of this offer confirms your commitment to the internship program and its terms.\n\nPlease review the details above and accept or decline via the portal.`,
  });
  const set = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    if (!f.start_date || !f.end_date) return toast.error("Dates required");
    setLoading(true);
    const { error } = await supabase.from("offer_letters").insert({
      application_id: app.id,
      internship_id: app.internship_id,
      student_id: app.student_id,
      recruiter_id: user!.id,
      student_name: app.profiles?.full_name || app.profiles?.email,
      company_name: app.internships?.company,
      position: f.position,
      start_date: f.start_date,
      end_date: f.end_date,
      stipend: f.stipend || null,
      location: f.location || null,
      letter_body: f.letter_body,
    });
    if (!error) await supabase.from("applications").update({ status: "offered" }).eq("id", app.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Offer letter issued");
    onDone();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Generate offer letter — {app.profiles?.full_name}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <F label="Position" value={f.position} onChange={set("position")} />
          <div className="grid grid-cols-2 gap-3">
            <F label="Start date" type="date" value={f.start_date} onChange={set("start_date")} />
            <F label="End date" type="date" value={f.end_date} onChange={set("end_date")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Stipend" value={f.stipend} onChange={set("stipend")} />
            <F label="Location" value={f.location} onChange={set("location")} />
          </div>
          <div>
            <Label className="mb-1.5 block">Letter body</Label>
            <Textarea rows={6} value={f.letter_body} onChange={set("letter_body")} />
          </div>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send offer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, ...rest }: any) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Input {...rest} />
    </div>
  );
}
