import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/auth-gate";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { StatusBadge } from "./dashboard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OfferLetterView } from "@/components/offer-letter-view";
import { Download, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { downloadOfferLetterPDF } from "@/lib/pdf";

export const Route = createFileRoute("/my/offers")({
  component: () => <AuthGate requireRole="student"><Page /></AuthGate>,
});

function Page() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<any | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["my-offers-full", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("offer_letters").select("*").eq("student_id", user!.id).order("issued_at", { ascending: false })).data ?? [],
  });

  const downloadPDF = async (o: any) => {
    setDownloading(o.id);
    await downloadOfferLetterPDF(o);
    setDownloading(null);
  };

  const respond = async (offerId: string, status: "accepted" | "declined") => {
    const { error } = await supabase.from("offer_letters").update({ status, responded_at: new Date().toISOString() }).eq("id", offerId);
    if (error) return toast.error(error.message);
    toast.success(status === "accepted" ? "Offer accepted!" : "Offer declined");
    qc.invalidateQueries({ queryKey: ["my-offers-full"] });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">My offer letters</h1>
        <p className="mt-1 text-muted-foreground">Accept or decline offers, download professional PDFs.</p>

        <div className="mt-8 grid gap-4">
          {isLoading ? (
            <div className="surface-card p-8 text-center text-muted-foreground">Loading...</div>
          ) : offers.length === 0 ? (
            <div className="surface-card p-10 text-center text-muted-foreground">No offers yet.</div>
          ) : (
            offers.map((o: any) => (
              <div key={o.id} className="surface-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">{o.company_name} · Ref {o.offer_code}</div>
                    <div className="mt-1 font-display text-xl font-semibold">{o.position}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {new Date(o.start_date).toLocaleDateString()} → {new Date(o.end_date).toLocaleDateString()}
                      {o.stipend && ` · ${o.stipend}`}
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Dialog open={viewing?.id === o.id} onOpenChange={(v) => setViewing(v ? o : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">View letter</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[850px] p-6 max-h-[90vh] overflow-y-auto bg-slate-100 flex flex-col items-center">
                      <DialogHeader><DialogTitle className="sr-only">Offer letter</DialogTitle></DialogHeader>
                      <div className="w-full overflow-x-auto flex justify-center py-4">
                        <OfferLetterView offer={o} id={`offer-letter-${o.id}`} />
                      </div>
                      <div className="flex w-full justify-end gap-2 border-t pt-4 mt-4">
                        <Button 
                          onClick={() => downloadPDF(o)} 
                          disabled={downloading === o.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                          <Download className="mr-2 h-4 w-4" /> 
                          {downloading === o.id ? "Downloading..." : "Download A4 PDF"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {o.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => respond(o.id, "accepted")} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        <Check className="mr-1 h-4 w-4" /> Accept offer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => respond(o.id, "declined")}>
                        <X className="mr-1 h-4 w-4" /> Decline
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
