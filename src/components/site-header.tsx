import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SiteHeader({ onOpenDownload }: { onOpenDownload?: () => void } = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate({ to: "/" });
  };

  const isHome = location.pathname === "/";

  const handleDownloadClick = () => {
    if (onOpenDownload) {
      onOpenDownload();
    } else {
      navigate({ to: "/" });
      setTimeout(() => {
        // Trigger dialog if on home
        const btn = document.getElementById("hero-download-btn");
        btn?.click();
      }, 150);
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full transition-all ${isHome ? 'bg-brand-yellow border-transparent' : 'bg-brand-beige/90 backdrop-blur-md border-b border-brand-dark/10'}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 relative">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center select-none">
            <span className="font-serif text-[28px] italic font-semibold tracking-tight text-brand-dark">
              internly.
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/apply"
              className="text-sm font-semibold text-brand-dark/80 hover:text-brand-dark transition-colors"
            >
              Apply for Internship
            </Link>
            <button
              type="button"
              onClick={handleDownloadClick}
              className="text-sm font-semibold text-brand-dark/80 hover:text-brand-dark transition-colors"
            >
              Download Documents
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Button asChild size="sm" className="rounded-full bg-brand-dark text-white hover:bg-black font-semibold text-xs px-4">
                <Link to="/admin">
                  <Shield className="mr-1.5 h-3.5 w-3.5" /> Admin Console
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="rounded-full border-brand-dark/20 text-brand-dark hover:bg-brand-dark/5 text-xs font-semibold"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="rounded-full bg-brand-dark text-white hover:bg-black px-5 h-9 text-xs font-bold shadow-sm">
              <Link to="/auth">Admin Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
