import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "recruiter" | "admin";
  company_name: string | null;
  university: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  skills: string[] | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isStudent: boolean;
  isRecruiter: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async (u: User | null) => {
      if (!u) { if (mounted) { setProfile(null); setUser(null); setLoading(false); } return; }
      if (mounted) setUser(u);
      const { data } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
      if (mounted) { setProfile(data as Profile | null); setLoading(false); }
    };

    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      // Defer profile fetch to avoid deadlock inside listener
      setTimeout(() => load(session?.user ?? null), 0);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const emailLower = user?.email?.toLowerCase() || "";
  const isAdmin = 
    profile?.role === "admin" ||
    (!!user?.email && (
      emailLower.startsWith("admin@") || 
      emailLower.endsWith("@codeint.tech") ||
      (user.user_metadata as any)?.role === "admin" ||
      (user.app_metadata as any)?.role === "admin"
    ));

  const value = {
    user,
    profile,
    loading,
    isStudent: profile?.role === "student",
    isRecruiter: profile?.role === "recruiter",
    isAdmin,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
