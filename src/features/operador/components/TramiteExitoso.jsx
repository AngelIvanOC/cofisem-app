import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PolizaPDF from "../../../components/pdf/PolizaPDF";
import { buildPolizaPDF } from "../../../services/polizas";
import { generateQR } from "../../../utils/generateQR";

export default function TramiteExitoso({ poliza, oficina, onNueva, onVolver }) {
  const [polizaPDF, setPolizaPDF] = useState(null);

  useEffect(() => {
    if (!poliza?.constancia) return;
    const base = buildPolizaPDF(poliza, oficina);
    const qrUrl = `${window.location.origin}/verificar/${poliza.constancia}`;
    generateQR(qrUrl)
      .then(qrDataUrl => setPolizaPDF({ ...base, qrDataUrl }))
      .catch(console.error);
  }, [poliza]);

  const cliente = poliza?.clientes ?? {};
  const nombre  = [cliente.nombre, cliente.apellido].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-[#13193a] mb-2">¡Póliza emitida!</h2>
      <p className="text-gray-400 text-sm mb-1">
        Constancia: <span className="font-mono font-bold text-[#13193a]">{poliza?.constancia}</span>
      </p>
      <p className="text-gray-400 text-sm mb-8">
        Asegurado: <strong className="text-gray-600">{nombre}</strong>
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={onVolver}
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          Ver pólizas
        </button>

        {polizaPDF ? (
          <PDFDownloadLink
            document={<PolizaPDF poliza={polizaPDF} />}
            fileName={`poliza-${poliza.constancia}.pdf`}
            style={{ textDecoration: "none" }}
          >
            {({ loading: pdfLoading }) => (
              <span className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50] cursor-pointer select-none">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {pdfLoading ? "Preparando PDF..." : "Descargar póliza"}
              </span>
            )}
          </PDFDownloadLink>
        ) : (
          <span className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#13193a]/50 text-white text-sm font-bold cursor-wait select-none">
            Generando QR...
          </span>
        )}

        <button onClick={onNueva}
          className="px-6 py-2.5 rounded-xl border-2 border-[#13193a] text-sm font-bold text-[#13193a] hover:bg-[#13193a]/5">
          Nueva póliza
        </button>
      </div>
    </div>
  );
}
