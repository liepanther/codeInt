import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/auth-gate";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CertificateView } from "@/components/certificate-view";
import { Printer, Award, Download } from "lucide-react";
import { downloadCertificatePDF } from "@/lib/pdf";
import { useState } from "react";

export const Route = createFileRoute("/my/certificates")({
  component: () => <AuthGate requireRole="student"><Page /></AuthGate>,
});

function Page() {
  const { user } = useAuth();
  const [viewing, setViewing] = useState<any | null>(null);

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["my-certs-full", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("certificates").select("*, internship:internships(location, work_mode)").eq("student_id", user!.id).order("issued_at", { ascending: false })).data ?? [],
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">My certificates</h1>
        <p className="mt-1 text-muted-foreground">Every certificate is verifiable at <span className="font-mono text-xs">/verify</span>.</p>

        <div className="mt-8 grid gap-4">
          {isLoading ? (
            <div className="surface-card p-8 text-center text-muted-foreground">Loading...</div>
          ) : certs.length === 0 ? (
            <div className="surface-card grid place-items-center gap-2 p-10 text-center text-muted-foreground">
              <Award className="h-6 w-6" /> No certificates yet.
            </div>
          ) : (
            certs.map((c: any) => (
              <div key={c.id} className="surface-card flex flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <div className="text-xs text-muted-foreground">{c.company_name} · <span className="font-mono">{c.cert_code}</span></div>
                  <div className="mt-1 font-display text-xl font-semibold">{c.position}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {new Date(c.start_date).toLocaleDateString()} → {new Date(c.end_date).toLocaleDateString()}
                  </div>
                </div>
                <Dialog open={viewing?.id === c.id} onOpenChange={(v) => setViewing(v ? c : null)}>
                  <DialogTrigger asChild><Button>View certificate</Button></DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader><DialogTitle className="sr-only">Certificate</DialogTitle></DialogHeader>
                    <CertificateView cert={c} />
                    <div className="no-print flex justify-end gap-2 mt-4">
                      <Button onClick={() => downloadCertificatePDF(c)} className="bg-[#2E5BFF] hover:bg-[#1D4ED8] text-white">
                        <Download className="mr-2 h-4 w-4" /> Download PDF
                      </Button>
                      <Button onClick={() => window.print()} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
