import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";

export function AuthGate({ 
  children, 
  requireRole 
}: { 
  children: React.ReactNode; 
  requireRole?: "student" | "recruiter" | "admin" 
}) {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  // While checking authentication or loading user profile
  if (loading || (!profile && user && requireRole)) {
    return (
      <div className="min-h-screen bg-[#FBFAF7]">
        <SiteHeader />
        <div className="grid place-items-center py-32">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
            <span className="text-xs font-medium">Verifying authorization...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return null;
  }

  // Strict Admin Gate
  if (requireRole === "admin" && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FBFAF7]">
        <SiteHeader />
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="font-sans text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            This section is restricted to authorized codeInt administrators. Your account does not hold administrative clearance.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate({ to: "/" })} 
              className="rounded-xl border-slate-200 text-slate-700"
            >
              Return to Home
            </Button>
            <Button 
              onClick={() => navigate({ to: "/auth" })} 
              className="rounded-xl bg-slate-900 hover:bg-black text-white"
            >
              Admin Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Other Role Gate (Student or Recruiter)
  if (requireRole && requireRole !== "admin" && profile?.role !== requireRole && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FBFAF7]">
        <SiteHeader />
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="font-sans text-2xl font-bold text-slate-900">Not Authorized</h1>
          <p className="mt-2 text-sm text-slate-600">This area is only accessible to {requireRole} accounts.</p>
          <div className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => navigate({ to: "/" })} 
              className="rounded-xl border-slate-200"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
