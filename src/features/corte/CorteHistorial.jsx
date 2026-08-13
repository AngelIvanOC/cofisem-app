import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, History, Banknote } from "lucide-react";
import { supabase } from "../../supabaseClient";

const n = (v) => parseFloat(v) || 0;
const $ = (v) => `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "—";

const REVISION_META = {
  PENDIENTE: { label: "Pendiente de revisión", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APROBADO:  { label: "Aprobado",               cls: "bg-blue-50 text-blue-700 border-blue-200" },
  REGRESADO: { label: "Regresado",              cls: "bg-red-50 text-red-700 border-red-200" },
  RECIBIDO:  { label: "Recibido",               cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const PAGE_SIZE = 10;

export default function CorteHistorial({ usuario }) {
  const [entregas, setEntregas] = useState([]);
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pagina, setPagina] = useState(0);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from("corte_efectivo_entrega").select("*").order("fecha_corte", { ascending: false }).limit(90);
      q = usuario?.oficina_id ? q.eq("oficina_id", usuario.oficina_id) : q.is("oficina_id", null);
      const { data: dEntregas, error: e1 } = await q;
      if (e1) throw e1;

      const fechas = (dEntregas ?? []).map((e) => e.fecha_corte);
      let dPolizas = [];
      if (fechas.length) {
        let q2 = supabase.from("polizas_cofisem").select("fecha_corte, prima_primer_pago").in("fecha_corte", fechas);
        q2 = usuario?.oficina_id ? q2.eq("oficina_id", usuario.oficina_id) : q2;
        const { data, error: e2 } = await q2;
        if (e2) throw e2;
        dPolizas = data ?? [];
      }
      setEntregas(dEntregas ?? []);
      setPolizas(dPolizas);
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, [usuario?.oficina_id]);

  useEffect(() => { cargar(); }, [cargar]);

  const totalPaginas = Math.max(1, Math.ceil(entregas.length / PAGE_SIZE));
  const visibles = entregas.slice(pagina * PAGE_SIZE, pagina * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a] flex items-center gap-2">
            <History className="w-6 h-6 text-[#13193a]" />
            Historial de cortes
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Consulta tus cortes anteriores, notas de administración y pendientes por resolver</p>
        </div>
        <Link
          to="/corte"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Ir al corte de hoy
        </Link>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Cargando historial…
        </div>
      ) : entregas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center text-sm text-gray-400">
          Todavía no tienes cortes registrados.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {visibles.map((e) => {
              const count = polizas.filter((p) => p.fecha_corte === e.fecha_corte).length;
              const totalPrimerPago = polizas.filter((p) => p.fecha_corte === e.fecha_corte).reduce((s, p) => s + n(p.prima_primer_pago), 0);
              const revMeta = REVISION_META[e.estatus_revision] ?? REVISION_META.PENDIENTE;
              const faltaComprobante = e.entrega === "DEPOSITO" && !e.comprobante_url;

              return (
                <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#13193a] capitalize">{fmt(e.fecha_corte)}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                        <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${e.cerrado ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                          {e.cerrado ? "Cerrado" : "En proceso"}
                        </span>
                        {e.cerrado && (
                          <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${revMeta.cls}`}>
                            {revMeta.label}
                          </span>
                        )}
                        {e.cierre_incompleto && (
                          <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                            ⚠ Cerrado incompleto
                          </span>
                        )}
                        {faltaComprobante && (
                          <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">
                            Falta comprobante de depósito
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#13193a]">{count}</p>
                        <p className="text-[10px] text-gray-400">pólizas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-700 tabular-nums">{$(totalPrimerPago)}</p>
                        <p className="text-[10px] text-gray-400">1er pago</p>
                      </div>
                      <Link
                        to={`/corte?fecha=${e.fecha_corte}`}
                        className="px-4 py-2 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-bold transition-all"
                      >
                        Ver
                      </Link>
                    </div>
                  </div>

                  {(e.notas_admin || e.nota_operador_cierre || faltaComprobante) && (
                    <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                      {e.notas_admin && (
                        <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                          <strong className="text-gray-700">Nota de administración:</strong> {e.notas_admin}
                        </p>
                      )}
                      {e.nota_operador_cierre && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                          <strong>Tu nota al cerrar incompleto:</strong> {e.nota_operador_cierre}
                        </p>
                      )}
                      {faltaComprobante && (
                        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          <p className="text-xs text-red-700 flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5 shrink-0" />
                            Elegiste depósito para este corte pero falta subir el comprobante.
                          </p>
                          <Link
                            to={`/corte?fecha=${e.fecha_corte}`}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-all"
                          >
                            Subir comprobante
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={pagina === 0}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-500">Página {pagina + 1} de {totalPaginas}</span>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={pagina >= totalPaginas - 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
