import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export const downloadCertificatePDF = async (c: any) => {
  toast.info("Generating certificate PDF — please wait…");

  try {
    const container = document.createElement("div");
    container.style.cssText = [
      "position:fixed",
      "top:0",
      "left:-9999px",
      "width:1123px",
      "height:794px",
      "overflow:hidden",
      "z-index:9999",
      "background:white",
    ].join(";");
    document.body.appendChild(container);

    const { createRoot } = await import("react-dom/client");
    const { createElement } = await import("react");
    const { CertificateView } = await import("../components/certificate-view");
    const root = createRoot(container);

    await new Promise<void>((resolve) => {
      root.render(createElement(CertificateView, { cert: c, isPdfDownload: true }));
      setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())), 1200);
    });

    const sheet = (container.querySelector(".cert") || container.querySelector(".cert-sheet")) as HTMLElement;
    if (!sheet) throw new Error("Certificate element not found");

    const canvas = await html2canvas(sheet, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#FBFAF7",
      logging: false,
      foreignObjectRendering: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);

    pdf.save(`Certificate_${(c.student_name || "Candidate").replace(/\s+/g, "_")}.pdf`);
    toast.success("Certificate downloaded!");

    root.unmount();
    document.body.removeChild(container);
  } catch (err: any) {
    console.error("Certificate PDF error:", err);
    toast.error("Failed to generate certificate: " + err.message);
  }
};

export const downloadOfferLetterPDF = async (o: any) => {
  toast.info("Generating offer letter PDF — please wait…");

  try {
    // ── Off-screen container ──
    const container = document.createElement("div");
    container.style.cssText = [
      "position:fixed",
      "top:0",
      "left:-9999px",
      "width:794px",
      "height:1123px",
      "overflow:hidden",
      "z-index:9999",
      "background:white",
    ].join(";");
    document.body.appendChild(container);

    // ── Render the offer letter view ──
    const { createRoot } = await import("react-dom/client");
    const { createElement } = await import("react");
    const { OfferLetterView } = await import("../components/offer-letter-view");
    const root = createRoot(container);

    await new Promise<void>((resolve) => {
      root.render(
        createElement(OfferLetterView, { offer: o, isPdfDownload: true, id: "pdf-render-target" })
      );
      // Wait for images (signature PNG, QR base64) to fully load
      setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())), 1200);
    });

    // ── Grab the sheet element ──
    const sheet = (container.querySelector(".offer-letter-sheet") || container.querySelector(".ol-sheet")) as HTMLElement;
    if (!sheet) throw new Error("Offer letter sheet element not found in render");

    // ── Capture at 3× for crisp text ──
    const canvas = await html2canvas(sheet, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#FFFFFF",
      logging: false,
      foreignObjectRendering: false,
      imageTimeout: 0,
    });

    // ── Build A4 Portrait PDF ──
    const imgData = canvas.toDataURL("image/jpeg", 0.97);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Fill page completely — canvas is exactly A4 at 794×1123px
    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);

    // ── Save ──
    const name = (o.student_name || "Candidate").replace(/\s+/g, "_");
    pdf.save(`Offer_Letter_${name}.pdf`);
    toast.success("Offer letter downloaded!");

    root.unmount();
    document.body.removeChild(container);
  } catch (err: any) {
    console.error("Offer letter PDF error:", err);
    toast.error("Failed to generate offer letter: " + err.message);
  }
};
