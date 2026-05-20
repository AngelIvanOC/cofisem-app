// ── SOLO DESARROLLO — eliminar antes de producción ───────────
// Acceso: /pdf-preview  (ruta pública, sin autenticación)
import { useState, useEffect } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import PolizaPDF, { mockPoliza } from "../components/pdf/PolizaPDF";
import { generateQR } from "../utils/generateQR";

export default function PDFPreview() {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    generateQR(mockPoliza.contratante.constancia)
      .then(setQrDataUrl)
      .catch(console.error);
  }, []);

  const poliza = { ...mockPoliza, qrDataUrl };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* ── Viewer ── */}
      <div className="flex-1 overflow-hidden">
        <PDFViewer
          width="100%"
          height="100%"
          showToolbar
          style={{ border: "none" }}
        >
          <PolizaPDF poliza={poliza} />
        </PDFViewer>
      </div>
    </div>
  );
}
