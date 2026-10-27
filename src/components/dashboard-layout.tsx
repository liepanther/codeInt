import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { User, LogOut } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin, isStudent, isRecruiter, signOut } = useAuth();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <div className="app-shell">
      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">
        <Link to="/" className="side-logo">
          code<span style={{ color: "#EA580C" }}>Int</span>
        </Link>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-2 flex flex-col gap-6">
          <div className="side-group mb-0">
            <Link
              to="/dashboard"
              className={`side-link ${currentPath === "/dashboard" ? "active" : ""}`}
            >
              <svg className="dash-icon" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
              </svg>
              Home
            </Link>

            {isStudent && (
              <>
                <Link
                  to="/apply"
                  className={`side-link ${currentPath === "/apply" ? "active" : ""}`}
                >
                  <svg className="dash-icon" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  Apply (Streams)
                </Link>
                <Link
                  to="/internships"
                  className={`side-link ${currentPath.includes("/internships") ? "active" : ""}`}
                >
                  <svg className="dash-icon" viewBox="0 0 24 24">
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                    <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  Internships
                </Link>
                <Link
                  to="/my/applications"
                  className={`side-link ${currentPath.includes("/applications") ? "active" : ""}`}
                >
                  <svg className="dash-icon" viewBox="0 0 24 24">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                  Applications
                </Link>
                <Link
                  to="/my/offers"
                  className={`side-link ${currentPath.includes("/offers") ? "active" : ""}`}
                >
                  <svg className="dash-icon" viewBox="0 0 24 24">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                  Offers
                </Link>
                <Link
                  to="/my/resume"
                  className={`side-link ${currentPath.includes("/resume") ? "active" : ""}`}
                >
                  <svg className="dash-icon" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M9 9h6v6H9z" />
                  </svg>
                  Resume
                </Link>
                <Link
                  to="/my/certificates"
                  className={`side-link ${currentPath.includes("/certificates") ? "active" : ""}`}
                >
                  <svg className="dash-icon" viewBox="0 0 24 24">
                    <path d="M12 15l-2 5-9-5 9-5 2 5z" />
                    <path d="M19 8l-2 5-9-5 9-5 2 5z" />
                    <circle cx="12" cy="15" r="2" />
                  </svg>
                  Certificates
                </Link>
              </>
            )}

            {isRecruiter && (
              <>
                <Link
                  to="/recruiter/postings"
                  className={`side-link ${currentPath.includes("/postings") ? "active" : ""}`}
                >
                  <svg className="dash-icon" viewBox="0 0 24 24">
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                    <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  Our Postings
                </Link>
                <Link
                  to="/recruiter/applications"
                  className={`side-link ${currentPath.includes("/applications") ? "active" : ""}`}
                >
                  <svg className="dash-icon" viewBox="0 0 24 24">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                  Candidate Applications
                </Link>
                <Link
                  to="/recruiter/certificates"
                  className={`side-link ${currentPath.includes("/certificates") ? "active" : ""}`}
                >
                  <svg className="dash-icon" viewBox="0 0 24 24">
                    <path d="M12 15l-2 5-9-5 9-5 2 5z" />
                    <path d="M19 8l-2 5-9-5 9-5 2 5z" />
                    <circle cx="12" cy="15" r="2" />
                  </svg>
                  Issued Certificates
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`side-link ${currentPath.includes("/admin") ? "active" : ""}`}
              >
                <svg className="dash-icon" viewBox="0 0 24 24">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                Admin Panel
              </Link>
            )}
          </div>

          {isStudent && (
            <div className="side-group mb-0">
              <div className="side-label">Learn</div>
              <div className="side-link text-opacity-50 pointer-events-none cursor-not-allowed">
                <svg className="dash-icon" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M10 8l6 4-6 4z" />
                </svg>
                Tech News (Coming Soon)
              </div>
              <div className="side-link text-opacity-50 pointer-events-none cursor-not-allowed">
                <svg className="dash-icon" viewBox="0 0 24 24">
                  <path d="M22 10L12 5 2 10l10 5 10-5z" />
                  <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
                </svg>
                Courses (Coming Soon)
              </div>
            </div>
          )}

          <div className="side-promo mt-auto">
            <svg className="dash-icon" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <h4>Book a mock interview</h4>
            <p>Practice with a mentor before your next real one.</p>
            <div className="go">
              Book free session{" "}
              <svg
                className="dash-icon"
                style={{ width: "12px", height: "12px" }}
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-6 border-t border-white/10 flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-brand-yellow text-brand-dark flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{profile?.full_name || profile?.email}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mt-0.5">{profile?.role}</div>
            </div>
          </div>
          <button onClick={signOut} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-sm font-semibold text-red-400/90 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="main-area">
        <div className="topbar">
          <div className="search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search internships, companies, or skills" />
          </div>
          <div className="topbar-right">
            <button className="top-btn">
              <svg className="dash-icon" viewBox="0 0 24 24">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <span className="dot"></span>
            </button>
            {isStudent && (
              <Link to="/internships" className="top-cta">
                Browse internships{" "}
                <svg
                  className="dash-icon"
                  style={{ width: "13px", height: "13px" }}
                  viewBox="0 0 24 24"
                >
                  <path d="M7 17L17 7M7 7h10v10" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Content provided by the route */}
        <div className="dash-content">
          {children}
        </div>
      </div>
    </div>
  );
}
