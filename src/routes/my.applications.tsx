import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/auth-gate";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { StatusBadge } from "./dashboard";

export const Route = createFileRoute("/my/applications")({
  component: () => <AuthGate requireRole="student"><Page /></AuthGate>,
});

function Page() {
  const { user } = useAuth();
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["my-apps-full", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("applications").select("*, internships(*)").eq("student_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">My applications</h1>
        <p className="mt-1 text-muted-foreground">Track every internship you've applied to.</p>

        <div className="mt-8 surface-card divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : apps.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-muted-foreground">You haven't applied to any internships yet.</p>
              <Link to="/internships" className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">Browse now →</Link>
            </div>
          ) : (
            apps.map((a: any) => (
              <Link key={a.id} to="/internships/$id" params={{ id: a.internship_id }} className="flex items-center justify-between p-5 hover:bg-surface-muted/50">
                <div>
                  <div className="font-semibold">{a.internships?.title}</div>
                  <div className="text-xs text-muted-foreground">{a.internships?.company} · {a.internships?.location} · applied {new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
