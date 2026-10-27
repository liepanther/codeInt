import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Search, Sparkles, Clock, DollarSign } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/internships/")({
  component: BrowseInternships,
});

function BrowseInternships() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const { data: internships = [], isLoading } = useQuery({
    queryKey: ["internships-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = internships.filter((i: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return i.title.toLowerCase().includes(s) || i.company.toLowerCase().includes(s) || i.location.toLowerCase().includes(s) || (i.skills || []).some((sk: string) => sk.toLowerCase().includes(s));
  });

  const Content = (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Find your next <span className="font-serif italic">chapter</span>.
          </h1>
          <p className="mt-3 text-muted-foreground">Real internships from vetted companies & verified training tracks.</p>
        </div>
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-800">Stream Admissions</div>
            <div className="text-xs text-brand-dark/70">C++, Java, CyberSecurity & more</div>
          </div>
          <Button asChild size="sm" className="rounded-xl bg-brand-dark text-white hover:bg-black font-bold text-xs">
            <Link to="/apply">Apply by Stream →</Link>
          </Button>
        </div>
      </div>

      <div className="relative mb-8 max-w-2xl">
        <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L14.2 9.8L23 12L14.2 14.2L12 23L9.8 14.2L1 12L9.8 9.8L12 1Z" />
        </svg>
        <Input
          placeholder="Search role, company, location, or skill..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 rounded-full pl-12 text-base"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="surface-card h-48 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card grid place-items-center p-16 text-center">
          <Sparkles className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-lg font-semibold">No internships yet</p>
          <p className="text-sm text-muted-foreground">Check back soon or invite recruiters to post.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((i: any) => (
            <Link
              key={i.id}
              to="/internships/$id"
              params={{ id: i.id }}
              className="surface-card group block p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" /> {i.company}
                  </div>
                  <h3 className="mt-1 font-display text-xl font-semibold group-hover:underline">{i.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{i.description}</p>
                </div>
                <Badge variant="outline" className="shrink-0">{i.work_mode}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(i.skills || []).slice(0, 4).map((s: string) => (
                  <span key={s} className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">{s}</span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {i.location}</span>
                {i.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {i.duration}</span>}
                {i.stipend && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {i.stipend}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
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
