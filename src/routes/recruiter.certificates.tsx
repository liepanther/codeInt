import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/auth-gate";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CertificateView } from "@/components/certificate-view";
import { Award, Download, Loader2, Printer } from "lucide-react";
import { downloadCertificatePDF } from "@/lib/pdf";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/recruiter/certificates")({
  component: () => <AuthGate requireRole="recruiter"><Page /></AuthGate>,
});

function Page() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [preview, setPreview] = useState<any | null>(null);

  const { data: interns = [] } = useQuery({
    queryKey: ["rec-hired", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: myInts } = await supabase.from("internships").select("id, title, company").eq("recruiter_id", user!.id);
      const ids = (myInts ?? []).map((i: any) => i.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("offer_letters").select("*, applications(*)").in("internship_id", ids).eq("status", "accepted");
      return data ?? [];
    },
  });

  const { data: issued = [] } = useQuery({
    queryKey: ["rec-certs", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("certificates").select("*, internship:internships(location, work_mode)").eq("recruiter_id", user!.id).order("issued_at", { ascending: false })).data ?? [],
  });

  const [f, setF] = useState({
    offer_id: "",
    performance: "Excellent",
    description: "Contributed meaningfully to team projects and demonstrated strong engineering ability throughout the program.",
  });
  const [loading, setLoading] = useState(false);

  const issue = async () => {
    const offer = interns.find((i: any) => i.id === f.offer_id);
    if (!offer) return toast.error("Select an intern");
    setLoading(true);
    const { data, error } = await supabase.from("certificates").insert({
      internship_id: offer.internship_id,
      student_id: offer.student_id,
      recruiter_id: user!.id,
      student_name: offer.student_name,
      company_name: offer.company_name,
      position: offer.position,
      start_date: offer.start_date,
      end_date: offer.end_date,
      performance: f.performance,
      description: f.description,
    }).select("*, internship:internships(location, work_mode)").single();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Certificate issued");
    setPreview(data);
    qc.invalidateQueries({ queryKey: ["rec-certs"] });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20"><Award className="h-5 w-5 text-accent" /></div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Issue a certificate</h1>
            <p className="text-sm text-muted-foreground">Recognize your interns with a verifiable completion certificate.</p>
          </div>
        </div>

        <div className="surface-card space-y-4 p-6">
          <div>
            <Label className="mb-1.5 block">Select intern (from accepted offers)</Label>
            <Select value={f.offer_id} onValueChange={(v) => setF({ ...f, offer_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pick an intern..." /></SelectTrigger>
              <SelectContent>
                {interns.length === 0 && <div className="p-3 text-sm text-muted-foreground">No interns with accepted offers yet.</div>}
                {interns.map((i: any) => (
                  <SelectItem key={i.id} value={i.id}>{i.student_name} — {i.position}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Performance rating</Label>
            <Input value={f.performance} onChange={(e) => setF({ ...f, performance: e.target.value })} placeholder="Excellent / Very good / Good" />
          </div>
          <div>
            <Label className="mb-1.5 block">Description / achievements</Label>
            <Textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <Button onClick={issue} disabled={loading || !f.offer_id} size="lg">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
            Generate certificate
          </Button>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 font-display text-xl font-semibold">Previously issued</h2>
          {issued.length === 0 ? (
            <div className="surface-card p-8 text-center text-muted-foreground">No certificates issued yet.</div>
          ) : (
            <div className="grid gap-3">
              {issued.map((c: any) => (
                <div key={c.id} className="surface-card flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <div className="font-semibold">{c.student_name}</div>
                    <div className="text-xs text-muted-foreground">{c.position} · <span className="font-mono">{c.cert_code}</span></div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setPreview(c)}>View</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {preview && (
        <Dialog open onOpenChange={(v) => !v && setPreview(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle className="sr-only">Certificate</DialogTitle></DialogHeader>
            <CertificateView cert={preview} />
            <div className="no-print flex justify-end gap-2 mt-4">
              <Button onClick={() => downloadCertificatePDF(preview)} className="bg-[#2E5BFF] hover:bg-[#1D4ED8] text-white">
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button onClick={() => window.print()} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
