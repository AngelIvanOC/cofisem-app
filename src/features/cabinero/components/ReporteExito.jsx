import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import { CheckCircle2, Clock, UserCheck, Car, ArrowRight, Plus, FileText, Loader2 } from "lucide-react";
import PolizaPDF from "../../../components/pdf/PolizaPDF";
import { fetchPolizaById, buildPolizaPDF } from "../../../services/polizas";
import { fetchConfigCostos } from "../../../services/configuracion";
import { generateQR } from "../../../utils/generateQR";

export default function ReporteExito({ folio, ajustador, horaInicio, horaFin, minutos, constancia, vendedor, polizaId, usuario, vehiculoDesc, placas }) {
  const navigate = useNavigate();

  const [pdfData,    setPdfData]    = useState(null);
  const [loadingPDF, setLoadingPDF] = useState(false);

  // Abre el PDF como documento propio en una pestaña nueva (no embebido en un
  // iframe dentro de la página) — los navegadores móviles solo renderizan PDFs
  // con su visor nativo cuando es la navegación de nivel superior de la pestaña.
  const handleVerPoliza = async () => {
    const nuevaVentana = window.open("", "_blank");
    setLoadingPDF(true);
    try {
      let datos = pdfData;
      if (!datos) {
        const [full, config] = await Promise.all([fetchPolizaById(polizaId), fetchConfigCostos()]);
        const base      = buildPolizaPDF(full, usuario?.oficinas, config);
        const qrDataUrl = await generateQR(`${window.location.origin}/gaman/verificar/${full.constancia}`);
        datos = { ...base, qrDataUrl };
        setPdfData(datos);
      }
      const blob = await pdf(<PolizaPDF poliza={datos} />).toBlob();
      const url  = URL.createObjectURL(blob);
      if (nuevaVentana) nuevaVentana.location.href = url;
      else window.open(url, "_blank");
    } catch (e) {
      nuevaVentana?.close();
      alert("No se pudo cargar la póliza: " + e.message);
    } finally {
      setLoadingPDF(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="w-full max-w-md space-y-2.5">

          {/* ── Header horizontal — ícono + texto · folio ── */}
          <div className="bg-[#13193a] rounded-2xl px-5 py-5 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 55%)" }} />
            {/* Izquierda: check + labels */}
            <div className="relative flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-full bg-emerald-400/10 border-2 border-emerald-400/25 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.15em] leading-none">
                  Reporte generado
                </p>
                <p className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">exitosamente</p>
                {constancia && (
                  <p className="text-white/35 text-[10px] font-mono mt-1.5 truncate">
                    Póliza <span className="text-white/60 font-semibold">{constancia}</span>
                  </p>
                )}
              </div>
            </div>
            {/* Derecha: número de reporte */}
            <div className="relative text-right shrink-0">
              <p className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5">Nro. Reporte</p>
              <p className="text-white font-black font-mono text-3xl tracking-tight leading-none">{folio}</p>
            </div>
          </div>

          {/* ── Vehículo ── */}
          {(vehiculoDesc || placas) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Car className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                {vehiculoDesc && (
                  <p className="text-xs font-bold text-[#13193a] leading-tight truncate">{vehiculoDesc}</p>
                )}
                {placas && placas !== "—" && (
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">Placas <span className="font-semibold text-gray-600">{placas}</span></p>
                )}
              </div>
            </div>
          )}

          {/* ── Ajustador ── */}
          {ajustador ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#13193a] flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">
                  Ajustador asignado
                </p>
                <p className="text-[#13193a] font-bold text-sm truncate">{ajustador}</p>
                {vendedor && (
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                    <span className="text-gray-300">Vendedor:</span> {vendedor}
                  </p>
                )}
              </div>
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Asignado
              </span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 font-semibold">
                Sin ajustador — se puede asignar desde la lista de siniestros
              </p>
            </div>
          )}

          {/* ── Tiempos ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tiempos del reporte</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Hora Inicio</p>
                <p className="text-[#13193a] font-bold font-mono text-xs leading-none">{horaInicio}</p>
              </div>
              <div className="text-center p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Hora Final</p>
                <p className="text-[#13193a] font-bold font-mono text-xs leading-none">{horaFin}</p>
              </div>
              <div className="text-center p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Tiempo</p>
                <p className="text-emerald-700 font-black text-lg leading-none">{minutos}</p>
                <p className="text-emerald-500 text-[9px] font-bold">min</p>
              </div>
            </div>
          </div>

          {/* ── Botón Ver Póliza ── */}
          {polizaId && (
            <button
              onClick={handleVerPoliza}
              disabled={loadingPDF}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-[#13193a]/20 text-[#13193a] text-xs font-semibold hover:bg-[#13193a]/5 transition-all disabled:opacity-50"
            >
              {loadingPDF
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Cargando póliza...</>
                : <><FileText className="w-3.5 h-3.5" />Ver póliza</>}
            </button>
          )}

          {/* ── Acciones principales ── */}
          <div className="flex gap-2.5">
            <button
              onClick={() => navigate("/gaman/siniestros/nuevo", { replace: true })}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo reporte
            </button>
            <button
              onClick={() => navigate("/gaman/siniestros")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all"
            >
              Ver siniestros
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
