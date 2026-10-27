import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-brand-dark/10 bg-brand-beige/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="font-serif text-2xl italic font-semibold text-brand-dark">internly.</div>
          <p className="mt-2 max-w-xs text-xs text-brand-dark/70 leading-relaxed">
            The dedicated stream-based internship and certification platform for engineering students.
          </p>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Programs</div>
          <ul className="mt-3 space-y-2 text-xs">
            <li><a href="#streams-section" className="text-brand-dark/70 hover:text-brand-dark">C++ Programming</a></li>
            <li><a href="#streams-section" className="text-brand-dark/70 hover:text-brand-dark">Java Programming</a></li>
            <li><a href="#streams-section" className="text-brand-dark/70 hover:text-brand-dark">CyberSecurity</a></li>
            <li><a href="#streams-section" className="text-brand-dark/70 hover:text-brand-dark">Python & Web Development</a></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Student Services</div>
          <ul className="mt-3 space-y-2 text-xs">
            <li><a href="#download-section" className="text-brand-dark/70 hover:text-brand-dark">Download Offer Letter</a></li>
            <li><a href="#download-section" className="text-brand-dark/70 hover:text-brand-dark">Download Certificate</a></li>
            <li><Link to="/verify" className="text-brand-dark/70 hover:text-brand-dark">Verify Certificate Code</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Administration</div>
          <p className="mt-3 text-xs text-brand-dark/70 leading-relaxed">
            Administrator login is restricted to authorized platform personnel.
          </p>
          <Link to="/auth" className="mt-3 inline-block text-xs font-bold text-brand-dark hover:underline">
            Admin Portal Sign In →
          </Link>
        </div>
      </div>
      <div className="border-t border-brand-dark/10 py-4 text-center text-xs text-brand-dark/50">
        © {new Date().getFullYear()} Internly. All rights reserved.
      </div>
    </footer>
  );
}
