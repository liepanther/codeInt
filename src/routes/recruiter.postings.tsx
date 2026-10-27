import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/auth-gate";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusCircle, MapPin, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/recruiter/postings")({
  component: () => <AuthGate requireRole="recruiter"><Page /></AuthGate>,
});

function Page() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: postings = [], isLoading } = useQuery({
    queryKey: ["rec-postings-full", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("internships").select("*, applications(count)").eq("recruiter_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const toggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("internships").update({ is_active: !isActive }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["rec-postings-full"] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete this posting?")) return;
    const { error } = await supabase.from("internships").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["rec-postings-full"] });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">My postings</h1>
            <p className="mt-1 text-muted-foreground">Manage your active internship openings.</p>
          </div>
          <Button asChild><Link to="/recruiter/new"><PlusCircle className="mr-2 h-4 w-4" /> New posting</Link></Button>
        </div>

        {isLoading ? (
          <div className="surface-card p-8 text-center text-muted-foreground">Loading...</div>
        ) : postings.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <p className="text-muted-foreground">No postings yet.</p>
            <Button asChild className="mt-4"><Link to="/recruiter/new">Create your first</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {postings.map((p: any) => (
              <div key={p.id} className="surface-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link to="/internships/$id" params={{ id: p.id }} className="font-display text-lg font-semibold hover:underline">{p.title}</Link>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.location}</span>
                      <span>{p.work_mode}</span>
                      <span>{p.applications?.[0]?.count ?? 0} applications</span>
                      <span>Posted {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.is_active ? "bg-success/20 text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                      {p.is_active ? "Active" : "Closed"}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => toggle(p.id, p.is_active)}>
                      {p.is_active ? <><EyeOff className="mr-1 h-3 w-3" /> Close</> : <><Eye className="mr-1 h-3 w-3" /> Reopen</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => del(p.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
