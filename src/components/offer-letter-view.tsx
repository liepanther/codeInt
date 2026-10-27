import { useRef, useState, useEffect } from "react";
import QRCode from "qrcode";
import { SUMIT_SIGNATURE_DATA_URL } from "@/lib/sumit-signature-data";

// ─── Styles ─────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap');

  .ol-sheet {
    position: relative;
    width: 794px;
    height: 1123px;
    background: #FFFFFF;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'Lora', Georgia, 'Times New Roman', serif;
    color: #111827;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .ol-sheet.pdf-mode {
    height: 1123px !important;
    overflow: hidden !important;
  }

  /* Top / Bottom Accent */
  .ol-accent-top {
    width: 100%;
    height: 14px;
    background: #EA580C;
    flex-shrink: 0;
  }
  .ol-accent-bottom {
    width: 100%;
    height: 14px;
    background: #EA580C;
    flex-shrink: 0;
  }

  /* Inner Body */
  .ol-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 32px 52px 22px 52px;
    box-sizing: border-box;
    justify-content: space-between;
    overflow: hidden;
  }

  /* Header */
  .ol-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
  }
  .ol-company-name {
    font-size: 34px;
    font-weight: 900;
    color: #0F172A;
    letter-spacing: -1.5px;
    line-height: 1;
    /* Keep brand name in modern sans-serif */
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
  }
  .ol-company-name .accent {
    color: #EA580C;
  }
  .ol-tagline {
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 2.5px;
    color: #9CA3AF;
    text-transform: uppercase;
    margin-top: 5px;
    font-family: 'Inter', sans-serif !important;
  }

  /* Title */
  .ol-title {
    font-size: 17px;
    font-weight: 700;
    text-align: center;
    letter-spacing: 2.5px;
    color: #0F172A;
    margin: 0 0 14px 0;
    text-transform: uppercase;
    text-decoration: none;
    font-family: 'Inter', sans-serif !important;
  }

  /* Meta row */
  .ol-meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1.5px solid #E2E8F0;
  }

  /* Letter body */
  .ol-salutation {
    font-size: 14.5px;
    font-weight: 400;
    font-style: italic;
    color: #111827;
    margin: 0 0 14px 0;
  }
  .ol-para {
    font-size: 13.5px;
    line-height: 1.8;
    color: #1a1a1a;
    margin: 0 0 13px 0;
    text-align: justify;
    font-weight: 400;
  }
  .ol-para strong {
    font-weight: 700;
    color: #0F172A;
    font-style: normal;
  }
  .ol-wish {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin: 12px 0 0 0;
    font-style: italic;
  }

  /* Footer */
  .ol-footer {
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid #E5E7EB;
  }

  /* Signature + Stamp row */
  .ol-sign-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 14px;
  }

  .ol-sig-block {
    display: flex;
    flex-direction: column;
    text-align: left;
  }
  .ol-sincerely {
    font-size: 13.5px;
    font-weight: 400;
    font-style: italic;
    color: #374151;
    margin-bottom: 2px;
    font-family: 'Lora', Georgia, serif !important;
  }
  .ol-sig-img {
    height: 58px;
    width: auto;
    max-width: 200px;
    object-fit: contain;
    display: block;
    margin: 2px 0 4px 0;
  }
  .ol-sig-line {
    width: 180px;
    border-top: 1px solid #9CA3AF;
    margin-bottom: 5px;
  }
  .ol-sig-name {
    font-size: 14px;
    font-weight: 700;
    color: #0F172A;
    letter-spacing: 0;
    line-height: 1.2;
    font-family: 'Inter', sans-serif !important;
  }
  .ol-sig-title {
    font-size: 11px;
    font-weight: 500;
    color: #6B7280;
    letter-spacing: 0.2px;
    font-family: 'Inter', sans-serif !important;
  }

  /* QR + Stamp */
  .ol-verify-group {
    display: flex;
    align-items: flex-end;
    gap: 22px;
  }
  .ol-qr-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .ol-qr-img {
    width: 78px;
    height: 78px;
    border: 1px solid #CBD5E1;
    border-radius: 4px;
    padding: 3px;
    background: #fff;
    display: block;
  }
  .ol-qr-label {
    font-size: 8px;
    font-weight: 700;
    color: #94A3B8;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  /* Contact pill */
  .ol-contact {
    display: flex;
    align-items: center;
    border: 1.5px solid #CBD5E1;
    border-radius: 6px;
    overflow: hidden;
    width: 80%;
    margin: 0 auto;
  }
  .ol-contact-cell {
    flex: 1;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    color: #1F2937;
    padding: 5px 0;
  }
  .ol-contact-cell + .ol-contact-cell {
    border-left: 1.5px solid #CBD5E1;
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtSlash(val?: string) {
  const d = val ? new Date(val) : new Date();
  if (isNaN(d.getTime())) return val ?? "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function fmtLong(val?: string, addMonths = 0) {
  const d = val ? new Date(val) : new Date();
  if (isNaN(d.getTime())) return val ?? "";
  if (addMonths) d.setMonth(d.getMonth() + addMonths);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

import { CompanySeal } from "@/components/company-seal";
export { CompanySeal };


// ─── Component ───────────────────────────────────────────────────────────────
export function OfferLetterView({
  offer,
  id,
  isPdfDownload = false,
}: {
  offer: any;
  id?: string;
  isPdfDownload?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [qrSrc, setQrSrc] = useState("");

  const company   = offer.company_name || "codeInt";
  const position  = offer.position     || "Cyber Security";
  const student   = offer.student_name || "Student";
  const code      = offer.offer_code   || offer.id || "OFR-0000";

  const origin = typeof window !== "undefined" ? window.location.origin : "https://codeint.tech";
  const verifyUrl = `${origin}/verify?id=${encodeURIComponent(code)}`;

  // Generate QR code
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(verifyUrl, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => { if (alive) setQrSrc(url); })
      .catch(() => {});
    return () => { alive = false; };
  }, [verifyUrl]);

  // Screen-fit scaling
  useEffect(() => {
    if (isPdfDownload) return;
    const resize = () => {
      if (containerRef.current) {
        setScale(containerRef.current.getBoundingClientRect().width / 794);
      }
    };
    resize();
    const obs = new ResizeObserver(resize);
    if (containerRef.current) obs.observe(containerRef.current);
    window.addEventListener("resize", resize);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [isPdfDownload]);

  const issueDate  = fmtSlash(offer.issued_at || offer.created_at);
  const startDate  = fmtLong(offer.start_date);
  const endDate    = fmtLong(offer.end_date, offer.end_date ? 0 : 1);
  const qrFallback = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&margin=1`;
  // Always use codeint.tech domain for contact
  const contactEmail = `contact@codeint.tech`;
  const websiteUrl   = `www.codeint.tech`;

  const renderSheet = (suffix: string) => (
    <div
      className={`ol-sheet offer-letter-sheet${suffix === "pdf" ? " pdf-mode" : ""}`}
      id={`offer-sheet-${suffix}`}
    >
      {/* Top Accent */}
      <div className="ol-accent-top" />

      {/* Inner body */}
      <div className="ol-body">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="ol-header">
          <div className="ol-company-name">
            code<span className="accent">Int</span>
          </div>
        </div>

        {/* ─── Document Title ───────────────────────────────── */}
        <h1 className="ol-title">Internship Offer Letter</h1>

        {/* ─── Meta Row ─────────────────────────────────────── */}
        <div className="ol-meta-row">
          <span>Date : {issueDate}</span>
          <span>ID: {code}</span>
        </div>

        {/* ─── Letter Content ───────────────────────────────── */}
        <p className="ol-salutation">Dear {student},</p>

        <p className="ol-para">
          We would like to congratulate you on being selected for the
          &ldquo;<strong>{position}</strong>&rdquo; virtual internship position with
          &ldquo;<strong>{company}</strong>&rdquo;. We at {company} are excited that you will
          join our team. The duration of the internship will be of&nbsp;<strong>1 Month</strong>,
          starting from <strong>{startDate} to {endDate}</strong>. The internship is an
          educational opportunity for you, hence the primary focus is on learning, developing new
          skills, and gaining hands-on knowledge. As an intern, we expect you to perform all
          assigned tasks to the best of your ability and follow any lawful and reasonable
          instructions provided to you.
        </p>

        <p className="ol-para">
          We are confident that this virtual internship will be a valuable experience for you.
          We look forward to working with you and helping you achieve your career goals.
        </p>

        <p className="ol-para">
          By accepting this offer, you commit to executing assigned tasks diligently and ensuring
          excellence in all aspects of your work.
        </p>

        <p className="ol-wish">Best of Luck!</p>

        {/* ─── Footer ──────────────────────────────────────── */}
        <div className="ol-footer">
          <div className="ol-sign-row">
            {/* Signature block */}
            <div className="ol-sig-block">
              <div className="ol-sincerely">Sincerely,</div>
              <img
                src={SUMIT_SIGNATURE_DATA_URL}
                alt="Signature"
                className="ol-sig-img"
              />
              <div className="ol-sig-line" />
              <div className="ol-sig-name">{offer.signatory_name || "Sumit Kumar"}</div>
              <div className="ol-sig-title">{offer.signatory_title || "CEO & CTO"}</div>
              <div className="ol-sig-title" style={{ color: "#EA580C", marginTop: "1px" }}>{company}</div>
            </div>

            {/* QR + Seal */}
            <div className="ol-verify-group">
              <div className="ol-qr-wrap">
                <img
                  src={qrSrc || qrFallback}
                  alt="Scan to verify"
                  className="ol-qr-img"
                />
                <span className="ol-qr-label">Scan to Verify</span>
              </div>

              <CompanySeal company={company} suffix={suffix} />
            </div>
          </div>

          {/* Contact Pill */}
          <div className="ol-contact">
            <div className="ol-contact-cell">{contactEmail}</div>
            <div className="ol-contact-cell">{websiteUrl}</div>
          </div>
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="ol-accent-bottom" />
    </div>
  );

  // ── PDF mode: render raw for html2canvas ──
  if (isPdfDownload) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {renderSheet("pdf")}
      </>
    );
  }

  // ── Screen mode: scale to fit container width ──
  return (
    <div
      className="bg-slate-100 w-full rounded-lg shadow-inner"
      style={{ position: "relative" }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={containerRef}
        style={{ position: "relative", width: "100%", height: `${1123 * scale}px`, overflow: "hidden" }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            transform: `translate(-50%, 0) scale(${scale})`,
            transformOrigin: "top center",
            width: "794px",
            height: "1123px",
          }}
        >
          {renderSheet("screen")}
        </div>
      </div>

      {/* Print-only (full res) */}
      <div style={{ display: "none" }} className="print:block">
        {renderSheet("print")}
      </div>
    </div>
  );
}
