import { useState, useEffect, useCallback } from "react";
import { Paperclip, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../../supabaseClient";
import {
  subirComprobantePago,
  verComprobantePago,
  MAX_PAGO_COMPROBANTE_BYTES,
} from "../../services/comprobantesPagoCofisem";
import { hoyISO } from "../../utils/fecha";
import RegistrarCobroModal from "./RegistrarCobroModal";

const n = (v) => parseFloat(v) || 0;
const $ = (v) => `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const HOY_ISO = hoyISO();

const ESTATUS_META = {
  PENDIENTE: { label: "Pendiente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  RECIBIDO:  { label: "Recibido — por aplicar", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  APLICADO:  { label: "Aplicado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

// El 1er pago de una póliza que NO viene de GAMAN no vive en pagos_cofisem
// — ya se capturó directo en polizas_cofisem (prima_primer_pago +
// efectivo/cheque/tdc/pol_pend_pago) al completarla. Aquí solo se
// representa de solo lectura para que "Pagos" sea el historial completo,
// no se duplica el dato ni se puede editar desde esta vista.
const VIRTUAL_META = {
  PENDIENTE: { label: "Pendiente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APLICADO:  { label: "Cobrado al vender", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};
function cuotaUnoVirtual(p) {
  const cobrado = n(p.efectivo) + n(p.cheque) + n(p.tdc);
  return {
    id: `virtual-1-${p.id}`,
    poliza_cofisem_id: p.id,
    num_cuota: 1,
    prima_total: p.prima_primer_pago,
    prima_neta: p.prima_primer_pago_neta,
    fecha_vencimiento: p.fecha_emision,
    fecha_recibido: cobrado > 0 ? p.fecha_emision : null,
    estatus: cobrado > 0 ? "APLICADO" : "PENDIENTE",
    comprobante_url: p.comprobante_cheque_url || p.comprobante_tdc_url || null,
    pago_gaman_id: null,
    polizas_cofisem: p,
    _virtual: true,
  };
}

// Pagos de GAMAN: el estatus real vive en la tabla `pagos` de GAMAN — aquí
// solo se lee (nunca se copia ni se modifica). Se traduce a mi mismo cajón
// PENDIENTE/RECIBIDO/APLICADO solo para que los filtros de esta tabla
// funcionen igual con ambos tipos de fila, pero la ETIQUETA que se muestra
// usa las palabras propias de GAMAN para no mezclar dos vocabularios.
const GAMAN_BUCKET = { PENDIENTE: "PENDIENTE", ADEUDO: "RECIBIDO", PAGADO: "APLICADO" };
const GAMAN_META = {
  PENDIENTE: { label: "Pendiente (GAMAN)", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  ADEUDO:    { label: "Adeudo (GAMAN)",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  PAGADO:    { label: "Pagado (GAMAN)",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function infoFila(c) {
  if (c._virtual) {
    return {
      esGaman: false,
      bucket: c.estatus,
      meta: VIRTUAL_META[c.estatus] ?? VIRTUAL_META.PENDIENTE,
      primaTotal: c.prima_total,
      primaNeta: c.prima_neta,
      fecha: c.fecha_recibido,
      vence: c.fecha_vencimiento,
    };
  }
  if (c.pago_gaman_id) {
    const g = c.pago_gaman ?? {};
    return {
      esGaman: true,
      bucket: GAMAN_BUCKET[g.estatus] ?? "PENDIENTE",
      meta: GAMAN_META[g.estatus] ?? GAMAN_META.PENDIENTE,
      primaTotal: g.monto,
      primaNeta: null,
      fecha: g.fecha_pago,
      vence: g.fecha_vencimiento,
    };
  }
  return {
    esGaman: false,
    bucket: c.estatus,
    meta: ESTATUS_META[c.estatus] ?? ESTATUS_META.PENDIENTE,
    primaTotal: c.prima_total,
    primaNeta: c.prima_neta,
    fecha: c.fecha_recibido,
    vence: c.fecha_vencimiento,
  };
}

// Todas las cuotas de una póliza — las reales de pagos_cofisem (incluida
// la cuota 1 enlazada de GAMAN cuando aplica) más, si la póliza NO es de
// GAMAN, la cuota 1 virtual (ver arriba).
function cuotasDePoliza(p) {
  const reales = (p.pagos_cofisem ?? []).map((c) => ({ ...c, polizas_cofisem: p, _info: infoFila(c) }));
  if (p.poliza_id) return reales;
  if (reales.some((c) => c.num_cuota === 1)) return reales;
  const virtual = cuotaUnoVirtual(p);
  return [{ ...virtual, _info: infoFila(virtual) }, ...reales];
}

// Mismos 3 estatus que GAMAN ya trata como "bloqueada" en su propia
// sección de Pagos (operador/Pagos.jsx, analista/AnalistaPagos.jsx).
const ESTATUS_GAMAN_BLOQUEADOS = ["CANCELADA", "VENCIDA", "ANULADA"];

function agruparPorPoliza(polizas) {
  const arr = polizas.map((p) => {
    const cuotas = cuotasDePoliza(p).sort((a, b) => a.num_cuota - b.num_cuota);
    const pendientes = cuotas.filter((c) => c._info.bucket === "PENDIENTE");
    const recibidos = cuotas.filter((c) => c._info.bucket === "RECIBIDO");
    const aplicados = cuotas.filter((c) => c._info.bucket === "APLICADO");
    const porCobrar = pendientes.reduce((s, c) => s + n(c._info.primaTotal), 0);
    const recibido = [...recibidos, ...aplicados].reduce((s, c) => s + n(c._info.primaTotal), 0);
    const proxVence = pendientes.map((c) => c._info.vence).filter(Boolean).sort()[0] ?? null;
    // "perdida" (el cliente no volvió a pagar, se dio de baja la póliza en
    // COFISEM) se trata igual que una cancelación en GAMAN: se sigue
    // mostrando como historial, pero ya no se puede registrar ningún cobro.
    const cancelada = ESTATUS_GAMAN_BLOQUEADOS.includes(p.poliza_gaman_estatus) || !!p.perdida;
    return { polizaId: p.id, poliza: p, cuotas, pendientes, recibidos, aplicados, porCobrar, recibido, proxVence, cancelada };
  });
  arr.sort((a, b) => {
    if (!a.proxVence && !b.proxVence) return 0;
    if (!a.proxVence) return 1;
    if (!b.proxVence) return -1;
    return a.proxVence.localeCompare(b.proxVence);
  });
  return arr;
}

function CuotasDots({ cuotas }) {
  return (
    <div className="flex items-center gap-1">
      {cuotas.map((c) => {
        const b = c._info.bucket;
        const cls = b === "APLICADO" ? "bg-emerald-500" : b === "RECIBIDO" ? "bg-blue-400" : "bg-gray-200";
        return <div key={c.id} className={`w-2 h-2 rounded-full ${cls}`} title={`Cuota ${c.num_cuota}: ${c._info.meta.label}`} />;
      })}
    </div>
  );
}

const FILTROS = [
  { k: "PENDIENTE", label: "Pendientes" },
  { k: "RECIBIDO", label: "Recibidos" },
  { k: "APLICADO", label: "Aplicados" },
  { k: "TODAS", label: "Todas" },
];

export default function PagosOperador({ usuario }) {
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filtro, setFiltro] = useState("PENDIENTE");
  const [modalPolizaId, setModalPolizaId] = useState(null);
  const [modalRow, setModalRow] = useState(null);
  const [modalGamanRow, setModalGamanRow] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("polizas_cofisem")
        .select(`
          id, poliza_id, aseguradora, numero_poliza, asegurado_nombre,
          fecha_emision, prima_primer_pago, prima_primer_pago_neta,
          efectivo, cheque, tdc, pol_pend_pago, poliza_gaman_estatus,
          comprobante_cheque_url, comprobante_tdc_url,
          perdida, perdida_nota,
          pagos_cofisem(*, pago_gaman:pagos(monto, estatus, fecha_pago, fecha_vencimiento))
        `)
        .order("fecha_emision", { ascending: true });
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

  const grupos = agruparPorPoliza(polizas);
  const visibles = filtro === "TODAS" ? grupos : grupos.filter((g) => g.cuotas.some((c) => c._info.bucket === filtro));
  const pendientesCount = grupos.reduce((s, g) => s + g.pendientes.length, 0);
  const grupoAbierto = grupos.find((g) => g.polizaId === modalPolizaId) ?? null;

  async function verComprobante(path) {
    try {
      await verComprobantePago(path);
    } catch (e) {
      setErrorMsg("No se pudo abrir el comprobante: " + e.message);
    }
  }

  // Refresca una cuota real dentro del árbol polizas → pagos_cofisem tras
  // guardarla desde uno de los modales.
  function actualizarCuota(actualizado) {
    setPolizas((prev) =>
      prev.map((p) =>
        p.id !== actualizado.poliza_cofisem_id
          ? p
          : { ...p, pagos_cofisem: (p.pagos_cofisem ?? []).map((c) => (c.id === actualizado.id ? { ...c, ...actualizado } : c)) }
      )
    );
  }

  // La póliza completa se dio por perdida — refresca el árbol para que se
  // vea bloqueada (gris) igual que una cancelada de GAMAN.
  function actualizarPolizaPerdida(polizaActualizada) {
    setPolizas((prev) => prev.map((p) => (p.id === polizaActualizada.id ? { ...p, ...polizaActualizada } : p)));
  }

  async function handleAdelantar(c) {
    try {
      const { data, error } = await supabase
        .from("pagos_cofisem")
        .update({ fecha_adelantado: HOY_ISO })
        .eq("id", c.id)
        .select()
        .single();
      if (error) throw error;
      actualizarCuota(data);
    } catch (e) {
      setErrorMsg("No se pudo adelantar la cuota: " + e.message);
    }
  }

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1447e6] flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Pagos
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Historial de cobros de tus pólizas — sube el comprobante cuando el cliente pague</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

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
                  {["Póliza", "Aseguradora", "Asegurado", "Cuotas", "Recibido", "Por cobrar", "Próx. vence", "Acción"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibles.map((g) => {
                  const p = g.poliza;
                  const cobradas = g.aplicados.length + g.recibidos.length;
                  return (
                    <tr key={g.polizaId} className={`transition-colors ${g.cancelada ? "opacity-60 bg-gray-50/80" : "hover:bg-gray-50/60"}`}>
                      <td className="px-4 py-3 font-mono font-bold text-[#1447e6] whitespace-nowrap">
                        {p.numero_poliza || "—"}
                        {g.cancelada && (
                          <span className="ml-1.5 inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            {p.poliza_gaman_estatus || "PERDIDA"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{p.aseguradora || "—"}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[160px] truncate">{p.asegurado_nombre || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <CuotasDots cuotas={g.cuotas} />
                          <span className="text-[11px] text-gray-500 tabular-nums">{cobradas}/{g.cuotas.length}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{$(g.recibido)}</td>
                      <td className="px-4 py-3 text-right">
                        {g.cancelada ? (
                          <span className="text-gray-400 font-semibold">Cancelada</span>
                        ) : g.porCobrar > 0 ? (
                          <span className="font-bold text-amber-700">{$(g.porCobrar)}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Al corriente</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(g.proxVence)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setModalPolizaId(g.polizaId)}
                          className="px-3 py-1.5 rounded-lg border border-[#1447e6]/20 text-[#1447e6] hover:bg-[#1447e6]/5 text-[11px] font-bold whitespace-nowrap"
                        >
                          Ver cuotas
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalCuotasPoliza
        grupo={grupoAbierto}
        onClose={() => setModalPolizaId(null)}
        onVerComprobante={verComprobante}
        onMarcarRecibido={(c) => setModalRow(c)}
        onAdjuntarArchivo={(c) => setModalGamanRow(c)}
        onAdelantar={handleAdelantar}
      />

      <RegistrarCobroModal
        row={modalRow}
        usuario={usuario}
        onClose={() => setModalRow(null)}
        onSaved={(actualizado) => {
          actualizarCuota(actualizado);
          setModalRow(null);
        }}
        onPerdida={(polizaActualizada) => {
          actualizarPolizaPerdida(polizaActualizada);
          setModalRow(null);
          setModalPolizaId(null);
        }}
      />

      <ModalAdjuntarArchivo
        row={modalGamanRow}
        usuario={usuario}
        onClose={() => setModalGamanRow(null)}
        onSaved={(actualizado) => {
          actualizarCuota(actualizado);
          setModalGamanRow(null);
        }}
      />
    </div>
  );
}

// Modal de detalle: todas las cuotas de una póliza, con su acción individual
// (marcar recibido / adjuntar archivo GAMAN) — así la tabla principal se
// queda en una fila por póliza sin perder el detalle por cuota. Las filas
// virtuales (1er pago de pólizas que no son de GAMAN) no tienen acción:
// ese dato se edita desde "Completar", no desde aquí.
function ModalCuotasPoliza({ grupo, onClose, onVerComprobante, onMarcarRecibido, onAdjuntarArchivo, onAdelantar }) {
  const [confirmandoAdelantoId, setConfirmandoAdelantoId] = useState(null);
  useEffect(() => { setConfirmandoAdelantoId(null); }, [grupo?.polizaId]);
  if (!grupo) return null;
  const p = grupo.poliza;
  const cobradas = grupo.aplicados.length + grupo.recibidos.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-sm font-bold text-[#1447e6]">Pagos y cuotas</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Póliza <span className="font-mono font-bold">{p.numero_poliza || "—"}</span> · {p.asegurado_nombre || "—"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {grupo.cancelada && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-xs font-semibold">
              🔒 {p.perdida
                ? <>Póliza dada de baja — el cliente no acudió a pagar. No se pueden registrar más cobros aquí.{p.perdida_nota && <> Nota: {p.perdida_nota}</>}</>
                : <>Póliza {p.poliza_gaman_estatus} en GAMAN — no se pueden registrar más cobros aquí.</>}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Recibido", value: $(grupo.recibido) },
              { label: "Por cobrar", value: $(grupo.porCobrar) },
              { label: "Cuotas", value: `${cobradas}/${grupo.cuotas.length}` },
            ].map((k) => (
              <div key={k.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{k.label}</p>
                <p className="text-sm font-bold text-[#1447e6]">{k.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {grupo.cuotas.map((c) => {
              const { esGaman, meta, primaTotal, primaNeta, vence, fecha } = c._info;
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {c.num_cuota}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#13193a]">
                        {$(primaTotal)}
                        {!esGaman && n(primaNeta) > 0 && (
                          <span className="text-xs text-gray-400 font-normal"> · neta {$(primaNeta)}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-gray-400">Vence {fmt(vence)}</p>
                        {fecha && (
                          <>
                            <span className="text-gray-300">·</span>
                            <p className="text-xs text-blue-600">Recibido {fmt(fecha)}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${meta.cls}`}>
                      {meta.label}
                    </span>
                    {c.comprobante_url && (
                      <button type="button" onClick={() => onVerComprobante(c.comprobante_url)} className="text-[#1447e6] hover:text-[#0f36b3]" title="Ver comprobante">
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!c._virtual && !grupo.cancelada && (esGaman ? (
                      <button
                        type="button"
                        onClick={() => onAdjuntarArchivo(c)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-[11px] font-bold whitespace-nowrap"
                      >
                        {c.comprobante_url ? "Cambiar archivo" : "Adjuntar archivo"}
                      </button>
                    ) : c.estatus === "PENDIENTE" && (
                      <>
                        {c.fecha_vencimiento > HOY_ISO && (
                          c.fecha_adelantado === HOY_ISO ? (
                            <span className="text-[11px] font-semibold text-blue-600 whitespace-nowrap">Se cobra hoy</span>
                          ) : confirmandoAdelantoId === c.id ? (
                            <span className="flex items-center gap-1.5">
                              <span className="text-[11px] text-gray-500 whitespace-nowrap">¿Traer al corte de hoy?</span>
                              <button
                                type="button"
                                onClick={() => { onAdelantar(c); setConfirmandoAdelantoId(null); }}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold whitespace-nowrap"
                              >
                                Sí, adelantar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmandoAdelantoId(null)}
                                className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-[11px] font-bold whitespace-nowrap"
                              >
                                Cancelar
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmandoAdelantoId(c.id)}
                              className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold whitespace-nowrap"
                              title="Traer esta cuota al corte de hoy para cobrarla antes de su fecha"
                            >
                              Adelantar
                            </button>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => onMarcarRecibido(c)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold whitespace-nowrap"
                        >
                          Registrar cobro
                        </button>
                      </>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Cuotas ligadas a un pago real de GAMAN (pago_gaman_id): aquí solo se
// adjunta un archivo propio (ej. foto del depósito) — el estatus, monto y
// fecha de recibido los sigue controlando GAMAN, no se tocan desde aquí.
function ModalAdjuntarArchivo({ row, usuario, onClose, onSaved }) {
  const [comprobantePath, setComprobantePath] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!row) return;
    setComprobantePath(row.comprobante_url ?? null);
    setError(null);
  }, [row]);

  if (!row) return null;

  const { meta, primaTotal } = infoFila(row);
  const p = row.polizas_cofisem ?? {};

  async function handleArchivo(file) {
    if (file.size > MAX_PAGO_COMPROBANTE_BYTES) {
      setError("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setError(null);
    setSubiendo(true);
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/${row.poliza_cofisem_id}/cuota-${row.num_cuota}-gaman`;
      const path = await subirComprobantePago(basePath, file);
      setComprobantePath(path);
    } catch (e) {
      setError("No se pudo subir el archivo: " + e.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("pagos_cofisem")
        .update({ comprobante_url: comprobantePath })
        .eq("id", row.id)
        .select()
        .single();
      if (err) throw err;
      onSaved(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-[#1447e6]">Adjuntar archivo</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Póliza <strong className="font-mono">{p.numero_poliza || "—"}</strong> · Cuota {row.num_cuota}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-1.5">
            <p className="text-[11px] text-gray-400">Este pago lo controla GAMAN — solo se puede adjuntar un archivo aquí.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Monto</span>
              <span className="text-sm font-bold text-[#1447e6]">{$(primaTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Estatus en GAMAN</span>
              <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${meta.cls}`}>
                {meta.label}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Paperclip className="w-4 h-4 shrink-0 text-gray-400" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-600">Archivo</p>
                <p className={`text-[11px] ${comprobantePath ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                  {subiendo ? "Subiendo…" : comprobantePath ? "✓ Archivo adjunto" : "Opcional — sube foto o PDF"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {comprobantePath && !subiendo && (
                <button type="button" onClick={() => verComprobantePago(comprobantePath)} className="text-xs font-bold text-[#1447e6] underline underline-offset-2">
                  Ver
                </button>
              )}
              <label className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
                subiendo ? "bg-gray-200 text-gray-400 cursor-wait" : comprobantePath ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50" : "bg-[#1447e6] text-white hover:bg-[#0f36b3]"
              }`}>
                {subiendo ? "..." : comprobantePath ? "Cambiar" : "Subir"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  className="hidden"
                  disabled={subiendo}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) handleArchivo(f);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="button" onClick={guardar} disabled={guardando || subiendo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1447e6] hover:bg-[#0f36b3] text-white text-sm font-bold disabled:opacity-50">
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

