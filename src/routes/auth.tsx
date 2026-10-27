import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, ArrowLeft, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [user, isAdmin, navigate]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      return toast.error("Please enter both email and password.");
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });

      if (error) {
        setLoading(false);
        return toast.error(error.message || "Invalid authentication credentials.");
      }

      toast.success("Authentication successful. Redirecting to Admin Console...");
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-4">
          <div className="text-3xl font-black tracking-tight text-slate-900">
            code<span className="text-[#EA580C]">Int</span>
          </div>
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-2">
          <Shield className="h-3.5 w-3.5 text-slate-900" />
          <span>Internal Administration</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Admin Portal Authentication
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Sign in with authorized administrator credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div>
              <Label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className="rounded-xl border-slate-200 h-11 pl-10 text-sm focus-visible:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <Label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className="rounded-xl border-slate-200 h-11 pl-10 text-sm focus-visible:ring-slate-900"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white hover:bg-black rounded-xl h-11 font-semibold text-sm mt-4 shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                "Authenticate & Enter Admin"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-medium">
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Website
            </Link>
            <span className="text-slate-400 font-mono text-[11px]">codeInt v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
