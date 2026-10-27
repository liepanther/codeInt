import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { SUMIT_SIGNATURE_DATA_URL } from "@/lib/sumit-signature-data";
import { CompanySeal } from "@/components/company-seal";

export function CertificateView({
  cert,
  isPdfDownload = false,
  id,
}: {
  cert: any;
  isPdfDownload?: boolean;
  id?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [qrSrc, setQrSrc] = useState("");

  const companyName = cert.company_name || "codeInt";
  const certCode = cert.cert_code || cert.id || "CERT-CI-0000";
  const verifyUrl = `https://codeint.tech/verify?id=${encodeURIComponent(certCode)}`;
  const qrFallback = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&margin=1`;

  // Generate QR Code linking directly to codeint.tech/verify?id=...
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(verifyUrl, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0F172A", light: "#FFFFFF" },
    })
      .then((url) => {
        if (alive) setQrSrc(url);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [verifyUrl]);

  // Responsive scaling for container
  useEffect(() => {
    if (isPdfDownload) return;
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        setScale(width / 1123);
      }
    };

    handleResize();

    let observer: ResizeObserver | null = null;
    if (containerRef.current) {
      observer = new ResizeObserver(handleResize);
      observer.observe(containerRef.current);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) observer.disconnect();
    };
  }, [isPdfDownload]);

  const formattedStartDate = new Date(cert.start_date || Date.now()).toLocaleDateString("en-US", { 
    month: "long", 
    day: "numeric", 
    year: "numeric" 
  });
  
  const formattedEndDate = new Date(cert.end_date || Date.now()).toLocaleDateString("en-US", { 
    month: "long", 
    day: "numeric", 
    year: "numeric" 
  });

  const formattedIssueDate = new Date(cert.issued_at || cert.created_at || Date.now()).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const getDurationString = (start: string, end: string) => {
    try {
      if (start && end) {
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.round(diffDays / 7);
        if (diffWeeks >= 4) return "1-month";
        if (diffWeeks > 0) return `${diffWeeks}-week`;
      }
    } catch {
      // ignore
    }
    return "1-month";
  };

  const getDepartment = (position: string) => {
    const pos = (position || "").toLowerCase();
    if (
      pos.includes("eng") || 
      pos.includes("dev") || 
      pos.includes("code") || 
      pos.includes("web") || 
      pos.includes("tech") || 
      pos.includes("software") || 
      pos.includes("frontend") || 
      pos.includes("backend") || 
      pos.includes("fullstack") ||
      pos.includes("c++") ||
      pos.includes("java") ||
      pos.includes("python")
    ) {
      return "Engineering";
    }
    if (pos.includes("cyber") || pos.includes("security")) {
      return "Cyber Security";
    }
    if (
      pos.includes("design") || 
      pos.includes("ux") || 
      pos.includes("ui") || 
      pos.includes("product") || 
      pos.includes("graphic") ||
      pos.includes("creative")
    ) {
      return "Product Design";
    }
    if (
      pos.includes("data") || 
      pos.includes("ai") || 
      pos.includes("ml") || 
      pos.includes("analyst")
    ) {
      return "Data Science & AI";
    }
    if (pos.includes("cloud") || pos.includes("devops")) {
      return "Cloud & DevOps";
    }
    return "Engineering";
  };

  const duration = getDurationString(cert.start_date, cert.end_date);
  const department = getDepartment(cert.position);
  const location = cert.internship?.location || cert.location || "Remote";

  const renderCertContent = (idSuffix: string) => (
    <div className="cert" id={`cert-${idSuffix}`}>
      <div className="frame-outer" />
      <div className="frame-inner" />

      {/* Clean elegant corner brackets - NO AI stars */}
      <div className="corner-bracket tl" />
      <div className="corner-bracket tr" />
      <div className="corner-bracket bl" />
      <div className="corner-bracket br" />

      <div className="content">
        {/* Header */}
        <div className="logo-row">
          <div className="logo-text">code<span>Int</span></div>
        </div>

        <h1 className="title">Certificate of Completion</h1>

        <p className="lead">This certifies that</p>
        <div className="recipient">{cert.student_name}</div>
        <div className="recipient-rule" />

        <p className="body-copy">
          has successfully completed a <span className="cert-hl">{duration}</span> virtual internship with <span className="cert-hl">{companyName}</span> in <span className="cert-hl-blue">{cert.position}</span>, contributing to real projects with consistency, technical diligence, and professionalism from <span className="cert-hl">{formattedStartDate}</span> to <span className="cert-hl">{formattedEndDate}</span>.
        </p>

        <div className="meta-row">
          <div><b>Stream / Dept</b> &nbsp; {department}</div>
          <div className="meta-divider" />
          <div><b>Mode</b> &nbsp; {location}</div>
          <div className="meta-divider" />
          <div><b>Performance</b> &nbsp; {cert.performance || "Outstanding"}</div>
          <div className="meta-divider" />
          <div><b>Issued</b> &nbsp; {formattedIssueDate}</div>
        </div>

        <div className="spacer" />

        {/* 3-Pillar Verification Footer: QR Code | Company Seal | Sumit Kumar Signature */}
        <div className="sign-section">
          {/* 1. QR Code linking to codeint.tech/verify?id=... */}
          <div className="qr-pillar">
            <img
              src={qrSrc || qrFallback}
              alt="Scan to Verify"
              className="cert-qr-img"
            />
            <div className="cert-qr-text">Scan to Verify</div>
          </div>

          {/* 2. Official codeInt Corporate Seal with full name codeInt */}
          <div className="seal-pillar">
            <CompanySeal company={companyName} suffix={idSuffix} size={118} />
          </div>

          {/* 3. Authorized Signature Block */}
          <div className="sign-pillar">
            <div className="sign-name">
              <img
                src={SUMIT_SIGNATURE_DATA_URL}
                alt="Sumit Kumar Signature"
                className="sig-img"
              />
            </div>
            <div className="sign-line" />
            <div className="sign-name-text">{cert.signatory_name || "Sumit Kumar"}</div>
            <div className="sign-role">{cert.signatory_title || "CEO & CTO, codeInt"}</div>
          </div>
        </div>

        {/* Bottom Verification Footer */}
        <div className="bottom-bar">
          <div className="cert-id-text">
            Certificate ID: <strong>{certCode}</strong>
          </div>
          <div className="verify-url-text">
            Verify at: <strong>codeint.tech/verify</strong>
          </div>
        </div>
      </div>
    </div>
  );

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500;1,9..144,600&family=Inter:wght@400;500;600;700;800;900&display=swap');

    .cert {
      position: relative;
      width: 1123px;
      height: 794px;
      background: #FBFAF7;
      overflow: hidden;
      flex-shrink: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      box-sizing: border-box;
    }
    .cert::before {
      content: "";
      position: absolute; inset: 0;
      background:
        radial-gradient(1200px 500px at 85% -10%, rgba(234,88,12,.05), transparent 60%),
        radial-gradient(900px 500px at -10% 110%, rgba(15,23,42,.04), transparent 60%);
      pointer-events: none;
    }
    .frame-outer {
      position: absolute; inset: 24px;
      border: 1.5px solid #0B1220;
      pointer-events: none;
    }
    .frame-inner {
      position: absolute; inset: 32px;
      border: 1px solid #EA580C;
      opacity: .6;
      pointer-events: none;
    }
    .corner-bracket {
      position: absolute;
      width: 16px;
      height: 16px;
      pointer-events: none;
    }
    .corner-bracket.tl { top: 38px; left: 38px; border-top: 2px solid #0B1220; border-left: 2px solid #0B1220; }
    .corner-bracket.tr { top: 38px; right: 38px; border-top: 2px solid #0B1220; border-right: 2px solid #0B1220; }
    .corner-bracket.bl { bottom: 38px; left: 38px; border-bottom: 2px solid #0B1220; border-left: 2px solid #0B1220; }
    .corner-bracket.br { bottom: 38px; right: 38px; border-bottom: 2px solid #0B1220; border-right: 2px solid #0B1220; }

    .content {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 62px 90px 42px;
      text-align: center;
      box-sizing: border-box;
    }
    .logo-row {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-bottom: 14px !important;
    }
    .logo-text {
      font-family: 'Inter', sans-serif !important;
      font-weight: 900 !important;
      font-size: 36px !important;
      letter-spacing: -1.6px !important;
      color: #0B1220 !important;
      display: inline-block !important;
      white-space: nowrap !important;
      line-height: 1 !important;
    }
    .logo-text span {
      color: #EA580C !important;
      display: inline !important;
    }
    .eyebrow {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 10.5px;
      letter-spacing: 4.5px;
      color: #EA580C;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    h1.title {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 500;
      font-size: 42px;
      letter-spacing: -0.5px;
      color: #0B1220;
      margin: 0 0 22px;
      line-height: 1.1;
    }
    .lead {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #5B6472;
      margin: 0 0 4px;
    }
    .recipient {
      font-family: 'Fraunces', Georgia, serif;
      font-style: italic;
      font-weight: 500;
      font-size: 44px;
      color: #0B1220;
      margin: 4px 0 2px;
      line-height: 1.15;
    }
    .recipient-rule {
      width: 320px;
      height: 1px;
      background: #CBD5E1;
      margin: 6px 0 20px;
    }
    .body-copy {
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      line-height: 1.8;
      color: #33394A;
      max-width: 720px;
      margin: 0 0 6px;
      display: block !important;
      text-align: center;
    }
    .body-copy .cert-hl {
      color: #0B1220;
      font-weight: 700;
      display: inline !important;
    }
    .body-copy .cert-hl-blue {
      color: #EA580C;
      font-weight: 700;
      display: inline !important;
    }
    .meta-row {
      display: flex;
      gap: 28px;
      margin-top: 14px;
      font-family: 'Inter', sans-serif;
      font-size: 12.5px;
      color: #5B6472;
      align-items: center;
      justify-content: center;
    }
    .meta-row b { color: #0B1220; font-weight: 600; }
    .meta-divider { width: 1px; height: 13px; background: #CBD5E1; }
    .spacer { flex: 1; }

    /* 3-Pillar Footer Row */
    .sign-section {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 24px 6px;
      margin-top: auto;
    }
    .qr-pillar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      width: 190px;
    }
    .cert-qr-img {
      width: 96px;
      height: 96px;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 4px;
      background: #FFFFFF;
      display: block;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    .cert-qr-text {
      font-family: 'Inter', sans-serif;
      font-size: 8.5px;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .seal-pillar {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      transform: rotate(-7deg) translateY(4px);
    }
    .sign-pillar {
      width: 200px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .sign-name {
      margin-bottom: 2px;
      height: 44px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .sig-img {
      height: 42px;
      max-width: 150px;
      object-fit: contain;
      display: block;
    }
    .sign-line {
      width: 170px;
      border-top: 1px solid #0B1220;
      padding-top: 5px;
      margin-bottom: 2px;
    }
    .sign-name-text {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 13px;
      color: #0B1220;
      line-height: 1.2;
    }
    .sign-role {
      font-family: 'Inter', sans-serif;
      font-size: 10.5px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #EA580C;
      font-weight: 600;
      margin-top: 1px;
    }

    /* Bottom Information Bar */
    .bottom-bar {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 10px 0;
      border-top: 1px solid #E2E8F0;
      margin-top: 8px;
      font-family: 'Inter', monospace;
      font-size: 10.5px;
      color: #64748B;
      letter-spacing: 0.5px;
    }
    .bottom-bar strong {
      color: #0B1220;
      font-weight: 700;
    }
  `;

  if (isPdfDownload) {
    return (
      <div className="bg-[#FBFAF7] w-[1123px] h-[794px] overflow-hidden rounded-none shadow-none">
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="cert-container w-[1123px] h-[794px]">
          {renderCertContent("pdf")}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 flex justify-center items-center overflow-hidden print:bg-white print:p-0 w-full rounded-lg shadow-inner">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        ${css}
        .cert {
          box-shadow: 0 30px 70px -20px rgba(11,18,32,.35), 0 0 0 1px rgba(11,18,32,.04);
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #cert-print, #cert-print * {
            visibility: visible;
          }
          #cert-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 1123px;
            height: 794px;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `,
        }}
      />

      {/* Screen container: scaled down to fit */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden no-print bg-slate-100 flex items-center justify-center"
        style={{
          aspectRatio: "1123 / 794",
        }}
      >
        <div
          className="cert-container"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
            width: "1123px",
            height: "794px",
          }}
        >
          {renderCertContent("screen")}
        </div>
      </div>

      {/* Print-only container */}
      <div className="hidden print:block cert-container">
        {renderCertContent("print")}
      </div>
    </div>
  );
}
