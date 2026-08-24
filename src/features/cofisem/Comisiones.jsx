// ============================================================
// src/features/cofisem/Comisiones.jsx
// Captura la comisión (vale) de un vendedor por cada póliza que él
// vendió — antes se capturaba junto con el resto de "Montos y cobro"
// en el formulario de la póliza, pero normalmente se calcula días
// después de la venta, así que se separa aparte. Solo aplican pólizas
// con un vendedor real (vendedor_id distinto de NULL y distinto de
// 1=COFISEM, que es "sin vendedor específico").
//
// El vale se guarda en su propia tabla (comisiones_cofisem) en vez de
// vivir en polizas_cofisem — eso permite seguir editando el vale de una
// póliza aunque el corte del día en que se vendió ya esté cerrado (todo
// lo demás de la póliza sí se bloquea al cerrar el corte, pero la
// comisión suele calcularse después).
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { HandCoins, CheckCircle2, Loader2, Search, X, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { ComprobanteField } from "../corte/CompletarPolizaModal";
import {
  subirComprobante,
  verComprobante,
  MAX_COMPROBANTE_BYTES,
  COMPROBANTE_BUCKET,
} from "../../services/comprobantesPago";
import { hoyISO } from "../../utils/fecha";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";

const n = (v) => parseFloat(v) || 0;
const $ = (v) =>
  `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const FILTROS = [
  { k: "PENDIENTE", label: "Pendientes" },
  { k: "CAPTURADO", label: "Capturados" },
  { k: "TODAS", label: "Todas" },
];

// PostgREST devuelve este embed como objeto (no arreglo) porque
// comisiones_cofisem.poliza_cofisem_id tiene un UNIQUE.
const comisionDe = (p) =>
  (Array.isArray(p.comisiones_cofisem)
    ? p.comisiones_cofisem[0]
    : p.comisiones_cofisem) ?? null;

export default function Comisiones({ usuario }) {
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filtro, setFiltro] = useState("PENDIENTE");
  const [busqueda, setBusqueda] = useState("");
  const [modalPoliza, setModalPoliza] = useState(null); // póliza en edición | null

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("polizas_cofisem")
        .select(
          "id, aseguradora, numero_poliza, fecha_emision, vendedor_id, vendedor_nombre, asegurado_nombre, comisiones_cofisem(id, monto, fecha_pago, comprobante_url)",
        )
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

  useEffect(() => {
    cargar();
  }, [cargar]);

  const porFiltro = polizas.filter((p) => {
    if (filtro === "TODAS") return true;
    const capturado = n(comisionDe(p)?.monto) > 0;
    return filtro === "CAPTURADO" ? capturado : !capturado;
  });
  const q = busqueda.trim().toLowerCase();
  const visibles = q
    ? porFiltro.filter((p) =>
        [p.aseguradora, p.numero_poliza, p.vendedor_nombre, p.asegurado_nombre]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q)),
      )
    : porFiltro;

  const pendientesCount = polizas.filter(
    (p) => !(n(comisionDe(p)?.monto) > 0),
  ).length;
  const totalCapturado = polizas.reduce(
    (s, p) => s + n(comisionDe(p)?.monto),
    0,
  );

  const {
    page,
    setPage,
    totalPages,
    paginated: visiblesPag,
    total,
  } = usePagination(visibles, 10);

  function onGuardado(polizaId, comision) {
    setPolizas((prev) =>
      prev.map((p) =>
        p.id === polizaId ? { ...p, comisiones_cofisem: comision } : p,
      ),
    );
    setModalPoliza(null);
  }

  async function eliminarComision(p) {
    const c = comisionDe(p);
    if (!c) return;
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar esta comisión?",
      html: `Se borrará el vale de <strong>${$(c.monto)}</strong> de la póliza <strong>${p.numero_poliza || "—"}</strong> y su comprobante (si tenía) — la póliza vuelve a "Sin capturar".`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    try {
      const { error } = await supabase
        .from("comisiones_cofisem")
        .delete()
        .eq("poliza_cofisem_id", p.id);
      if (error) throw error;
      if (c.comprobante_url) {
        await supabase.storage.from(COMPROBANTE_BUCKET).remove([c.comprobante_url]);
      }
      setPolizas((prev) =>
        prev.map((row) =>
          row.id === p.id ? { ...row, comisiones_cofisem: null } : row,
        ),
      );
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: e.message,
        confirmButtonColor: "#13193a",
      });
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
          Captura el vale (comisión) de cada póliza vendida con vendedor — se
          puede seguir editando aunque el corte de esa venta ya esté cerrado.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-600 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por aseguradora, póliza, vendedor o asegurado…"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] bg-white"
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100 w-fit">
              {FILTROS.map((f) => (
                <button
                  key={f.k}
                  type="button"
                  onClick={() => setFiltro(f.k)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    filtro === f.k
                      ? "bg-[#1447e6] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f.label}
                  {f.k === "PENDIENTE" && pendientesCount > 0 && (
                    <span
                      className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filtro === f.k ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}
                    >
                      {pendientesCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">
              Total capturado:{" "}
              <strong className="text-[#1447e6]">{$(totalCapturado)}</strong>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando…
          </div>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
            <span className="text-sm font-semibold">
              Sin pólizas en este filtro.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Aseguradora",
                    "Póliza",
                    "F. Emisión",
                    "Vendedor",
                    "Asegurado",
                    "Vale",
                    "Fecha de pago",
                    "Acción",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 py-2 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visiblesPag.map((p) => {
                  const c = comisionDe(p);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-4 py-2 font-semibold text-gray-700 whitespace-nowrap">
                        {p.aseguradora || "—"}
                      </td>
                      <td className="px-4 py-2 font-mono font-bold text-[#1447e6] whitespace-nowrap">
                        {p.numero_poliza || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                        {fmt(p.fecha_emision)}
                      </td>
                      <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                        {p.vendedor_nombre || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700 whitespace-nowrap max-w-[160px] truncate">
                        {p.asegurado_nombre || "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {n(c?.monto) > 0 ? (
                          $(c.monto)
                        ) : (
                          <span className="text-gray-300 font-normal">
                            Sin capturar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                        {c?.fecha_pago ? fmt(c.fecha_pago) : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setModalPoliza(p)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                              n(c?.monto) > 0
                                ? "border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                                : "bg-amber-500 hover:bg-amber-600 text-white"
                            }`}
                          >
                            {n(c?.monto) > 0 ? "Editar vale" : "Capturar vale"}
                          </button>
                          {n(c?.monto) > 0 && (
                            <button
                              type="button"
                              title="Eliminar comisión"
                              onClick={() => eliminarComision(p)}
                              className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Paginator
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={10}
              onPage={setPage}
            />
          </div>
        )}
      </div>

      <ModalVale
        poliza={modalPoliza}
        usuario={usuario}
        onClose={() => setModalPoliza(null)}
        onSaved={onGuardado}
      />
    </div>
  );
}

// Modal de captura/edición del vale — reemplaza la edición en línea que
// tenía la tabla antes: monto, fecha de pago y comprobante opcional.
function ModalVale({ poliza, usuario, onClose, onSaved }) {
  const [valor, setValor] = useState("");
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [comprobante, setComprobante] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!poliza) return;
    const c = comisionDe(poliza);
    setValor(c?.monto || "");
    setFechaPago(c?.fecha_pago || hoyISO());
    setComprobante(c?.comprobante_url ?? null);
    setError(null);
  }, [poliza]);

  if (!poliza) return null;

  async function handleComprobante(file) {
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setError("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setError(null);
    setSubiendo(true);
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/comisiones/${poliza.id}/vale`;
      const path = await subirComprobante(basePath, file);
      setComprobante(path);
    } catch (e) {
      setError("No se pudo subir el comprobante: " + e.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("comisiones_cofisem")
        .upsert(
          {
            poliza_cofisem_id: poliza.id,
            monto: n(valor),
            fecha_pago: fechaPago || hoyISO(),
            comprobante_url: comprobante,
            capturado_por: usuario?.id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "poliza_cofisem_id" },
        )
        .select()
        .single();
      if (err) throw err;
      onSaved(poliza.id, data);
    } catch (e) {
      setError("No se pudo guardar la comisión: " + e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1447e6]">
              {n(comisionDe(poliza)?.monto) > 0
                ? "Editar vale"
                : "Capturar vale"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              <span className="font-mono font-bold text-gray-600">
                {poliza.numero_poliza || "—"}
              </span>{" "}
              · {poliza.asegurado_nombre || "—"} · {poliza.vendedor_nombre || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Monto
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  autoFocus
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Fecha de pago
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 -mt-2">
            Día en que se pagó — así sale restado en el corte de ese día.
          </p>

          <ComprobanteField
            obligatorio={false}
            label="Comprobante del vale"
            path={comprobante}
            subiendo={subiendo}
            onFile={handleComprobante}
            onVer={() => verComprobante(comprobante)}
          />

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || subiendo}
              className="px-5 py-2.5 rounded-xl bg-[#1447e6] hover:bg-[#0f36b3] text-white text-sm font-bold disabled:opacity-50 transition-all"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
