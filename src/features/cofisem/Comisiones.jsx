// ============================================================
// src/features/cofisem/Comisiones.jsx
// Captura la comisión (vale) de un vendedor por cada póliza que él
// vendió — antes se capturaba junto con el resto de "Montos y cobro"
// en el formulario de la póliza, pero normalmente se calcula días
// después de la venta, así que se separa aparte. Solo aplican pólizas
// con un vendedor real (vendedor_id distinto de NULL y distinto de
// 1=COFISEM, que es "sin vendedor específico").
//
// El vale se guarda vía la función de BD actualizar_vale_poliza_cofisem
// (SECURITY DEFINER) en vez de un UPDATE directo — esa función permite
// seguir editando el vale de una póliza aunque el corte del día en que
// se vendió ya esté cerrado (todo lo demás de la póliza sí se bloquea
// al cerrar el corte, pero la comisión suele calcularse después).
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { HandCoins, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { ComprobanteField } from "../corte/CompletarPolizaModal";
import { subirComprobante, verComprobante, MAX_COMPROBANTE_BYTES } from "../../services/comprobantesPago";

const n = (v) => parseFloat(v) || 0;
const $ = (v) => `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const FILTROS = [
  { k: "PENDIENTE", label: "Pendientes" },
  { k: "CAPTURADO", label: "Capturados" },
  { k: "TODAS", label: "Todas" },
];

export default function Comisiones({ usuario }) {
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filtro, setFiltro] = useState("PENDIENTE");
  const [editando, setEditando] = useState(null); // id de la póliza en edición | null
  const [valorEdit, setValorEdit] = useState("");
  const [comprobanteEdit, setComprobanteEdit] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("polizas_cofisem")
        .select("id, aseguradora, numero_poliza, fecha_emision, vendedor_id, vendedor_nombre, asegurado_nombre, vale, comprobante_vale_url")
        .not("vendedor_id", "is", null)
        .neq("vendedor_id", 1)
        .order("fecha_emision", { ascending: false });
      if (usuario?.id) query = query.eq("creado_por", usuario.id);
      const { data, error } = await query;
      if (error) throw error;
      setPolizas(data ?? []);
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, [usuario?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = polizas.filter((p) => {
    if (filtro === "TODAS") return true;
    const capturado = n(p.vale) > 0;
    return filtro === "CAPTURADO" ? capturado : !capturado;
  });
  const pendientesCount = polizas.filter((p) => !(n(p.vale) > 0)).length;
  const totalCapturado = polizas.reduce((s, p) => s + n(p.vale), 0);

  function abrirEdicion(p) {
    setEditando(p.id);
    setValorEdit(p.vale || "");
    setComprobanteEdit(p.comprobante_vale_url ?? null);
    setErrorMsg(null);
  }

  function cancelarEdicion() {
    setEditando(null);
    setValorEdit("");
    setComprobanteEdit(null);
  }

  async function handleComprobante(file) {
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setErrorMsg("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setErrorMsg(null);
    setSubiendo(true);
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/comisiones/${editando}/vale`;
      const path = await subirComprobante(basePath, file);
      setComprobanteEdit(path);
    } catch (e) {
      setErrorMsg("No se pudo subir el comprobante: " + e.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar(id) {
    setGuardando(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.rpc("actualizar_vale_poliza_cofisem", {
        p_poliza_id: id,
        p_vale: n(valorEdit),
        p_comprobante_vale_url: comprobanteEdit,
      });
      if (error) throw error;
      const actualizado = Array.isArray(data) ? data[0] : data;
      setPolizas((prev) => prev.map((p) => (p.id === id ? { ...p, ...actualizado } : p)));
      cancelarEdicion();
    } catch (e) {
      setErrorMsg("No se pudo guardar el vale: " + e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1447e6] flex items-center gap-2">
          <HandCoins className="w-6 h-6" />
          Comisiones
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Captura el vale (comisión) de cada póliza vendida con vendedor — se puede seguir editando aunque el corte de esa venta ya esté cerrado.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-100 w-fit">
          {FILTROS.map((f) => (
            <button
              key={f.k}
              type="button"
              onClick={() => setFiltro(f.k)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                filtro === f.k ? "bg-[#1447e6] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
              {f.k === "PENDIENTE" && pendientesCount > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filtro === f.k ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}>
                  {pendientesCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Total capturado: <strong className="text-[#1447e6]">{$(totalCapturado)}</strong>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando…
          </div>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
            <span className="text-sm font-semibold">Sin pólizas en este filtro.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Aseguradora", "Póliza", "F. Emisión", "Vendedor", "Asegurado", "Vale", "Acción"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibles.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors align-top">
                    <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{p.aseguradora || "—"}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[#1447e6] whitespace-nowrap">{p.numero_poliza || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(p.fecha_emision)}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{p.vendedor_nombre || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[160px] truncate">{p.asegurado_nombre || "—"}</td>
                    {editando === p.id ? (
                      <>
                        <td className="px-4 py-3">
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input
                              type="number" min="0" step="0.01" autoFocus
                              value={valorEdit}
                              onChange={(e) => setValorEdit(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 min-w-[260px]">
                          <div className="space-y-2">
                            {n(valorEdit) > 0 && (
                              <ComprobanteField
                                obligatorio={false}
                                label="Comprobante del vale"
                                path={comprobanteEdit}
                                subiendo={subiendo}
                                onFile={handleComprobante}
                                onVer={() => verComprobante(comprobanteEdit)}
                              />
                            )}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => guardar(p.id)}
                                disabled={guardando || subiendo}
                                className="px-3 py-1.5 rounded-lg bg-[#1447e6] hover:bg-[#0f36b3] text-white text-[11px] font-bold disabled:opacity-50"
                              >
                                {guardando ? "Guardando…" : "Guardar"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelarEdicion}
                                disabled={guardando}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-[11px] font-bold"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                          {n(p.vale) > 0 ? $(p.vale) : <span className="text-gray-300 font-normal">Sin capturar</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => abrirEdicion(p)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                              n(p.vale) > 0
                                ? "border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                                : "bg-amber-500 hover:bg-amber-600 text-white"
                            }`}
                          >
                            {n(p.vale) > 0 ? "Editar vale" : "Capturar vale"}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
