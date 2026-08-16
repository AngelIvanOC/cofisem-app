import { useState, useEffect, useCallback } from "react";
import { Paperclip, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { verComprobantePago } from "../../services/comprobantesPagoCofisem";

const n = (v) => parseFloat(v) || 0;
const $ = (v) => `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const ESTATUS_META = {
  PENDIENTE: { label: "Pendiente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  RECIBIDO:  { label: "Por aplicar", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  APLICADO:  { label: "Aplicado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

// La cuota que se capturó directo en polizas_cofisem (prima_primer_pago +
// efectivo/cheque/tdc/pol_pend_pago) — cuota 1 de una póliza completa, o
// la cuota num_cuota_pago de un registro parcial ("No tengo la póliza")
// — nunca vive en pagos_cofisem. Aquí solo se representa de solo lectura
// para que "Pagos" sea el historial completo, no se duplica el dato ni
// se puede editar/aplicar desde esta vista (no hay paso de revisión para
// esta cuota, se cierra sola al capturarla).
const VIRTUAL_META = {
  PENDIENTE: { label: "Pendiente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APLICADO:  { label: "Cobrado al vender", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};
function cuotaPropiaVirtual(p) {
  const cobrado = n(p.efectivo) + n(p.cheque) + n(p.tdc);
  const numCuota = p.registro_parcial ? (p.num_cuota_pago ?? 1) : 1;
  return {
    id: `virtual-${numCuota}-${p.id}`,
    poliza_cofisem_id: p.id,
    num_cuota: numCuota,
    prima_total: p.prima_primer_pago,
    prima_neta: p.prima_primer_pago_neta,
    fecha_vencimiento: p.fecha_emision,
    fecha_recibido: cobrado > 0 ? p.fecha_emision : null,
    estatus: cobrado > 0 ? "APLICADO" : "PENDIENTE",
    comprobante_url: p.comprobante_cheque_url || p.comprobante_tdc_url || null,
    pago_gaman_id: null,
    _virtual: true,
  };
}

// Pagos de GAMAN: el estatus real vive en la tabla `pagos` de GAMAN — aquí
// solo se lee (nunca se copia ni se modifica). Se traduce a mi mismo cajón
// PENDIENTE/RECIBIDO/APLICADO solo para que los filtros funcionen igual con
// ambos tipos de fila, pero la ETIQUETA usa las palabras propias de GAMAN.
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
// la cuota 1 enlazada de GAMAN cuando aplica) más, si falta, la cuota
// propia virtual (cuota 1 de una póliza completa, o num_cuota_pago de un
// registro parcial — ver arriba).
function cuotasDePoliza(p) {
  const reales = (p.pagos_cofisem ?? []).map((c) => ({ ...c, _info: infoFila(c) }));
  if (p.poliza_id) return reales;
  const numCuotaPropia = p.registro_parcial ? (p.num_cuota_pago ?? 1) : 1;
  if (reales.some((c) => c.num_cuota === numCuotaPropia)) return reales;
  const virtual = cuotaPropiaVirtual(p);
  return [{ ...virtual, _info: infoFila(virtual) }, ...reales];
}

// Mismos 3 estatus que GAMAN ya trata como "bloqueada" en su propia
// sección de Pagos (operador/Pagos.jsx, analista/AnalistaPagos.jsx).
const ESTATUS_GAMAN_BLOQUEADOS = ["CANCELADA", "VENCIDA", "ANULADA"];

function agruparPorPoliza(polizas) {
  const arr = polizas.map((p) => {
    const cuotas = cuotasDePoliza(p).sort((a, b) => a.num_cuota - b.num_cuota);
    const pendientes = cuotas.filter((c) => c._info.bucket === "PENDIENTE");
    const porAplicar = cuotas.filter((c) => c._info.bucket === "RECIBIDO");
    const aplicados = cuotas.filter((c) => c._info.bucket === "APLICADO");
    const montoPorAplicar = porAplicar.reduce((s, c) => s + n(c._info.primaTotal), 0);
    const cancelada = ESTATUS_GAMAN_BLOQUEADOS.includes(p.poliza_gaman_estatus);
    return {
      polizaId: p.id, poliza: p, oficina: p.oficina, operador: p.operador,
      cuotas, pendientes, porAplicar, aplicados, montoPorAplicar, cancelada,
    };
  });
  arr.sort((a, b) => b.porAplicar.length - a.porAplicar.length);
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
  { k: "RECIBIDO", label: "Por aplicar" },
  { k: "PENDIENTE", label: "Pendientes" },
  { k: "APLICADO", label: "Aplicados" },
  { k: "TODAS", label: "Todas" },
];

export default function PagosAnalista({ usuario }) {
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filtro, setFiltro] = useState("RECIBIDO");
  const [aplicandoId, setAplicandoId] = useState(null);
  const [modalPolizaId, setModalPolizaId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("polizas_cofisem")
        .select(`
          id, poliza_id, aseguradora, numero_poliza, asegurado_nombre,
          fecha_emision, prima_primer_pago, prima_primer_pago_neta,
          efectivo, cheque, tdc, pol_pend_pago, poliza_gaman_estatus,
          comprobante_cheque_url, comprobante_tdc_url,
          registro_parcial, num_cuota_pago,
          operador:creado_por(nombre, apellido),
          oficina:oficina_id(nombre),
          pagos_cofisem(*, pago_gaman:pagos(monto, estatus, fecha_pago, fecha_vencimiento))
        `)
        .order("fecha_emision", { ascending: true });
      if (error) throw error;
      setPolizas(data ?? []);
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const grupos = agruparPorPoliza(polizas);
  const visibles = filtro === "TODAS" ? grupos : grupos.filter((g) => g.cuotas.some((c) => c._info.bucket === filtro));
  const porAplicar = grupos.flatMap((g) => g.porAplicar);
  const montoPorAplicar = porAplicar.reduce((s, c) => s + n(c._info.primaTotal), 0);
  const pendientesCount = grupos.reduce((s, g) => s + g.pendientes.length, 0);
  const aplicadosCount = grupos.reduce((s, g) => s + g.aplicados.length, 0);
  const totalCuotas = grupos.reduce((s, g) => s + g.cuotas.length, 0);
  const grupoAbierto = grupos.find((g) => g.polizaId === modalPolizaId) ?? null;

  async function verComprobante(path) {
    try {
      await verComprobantePago(path);
    } catch (e) {
      setErrorMsg("No se pudo abrir el comprobante: " + e.message);
    }
  }

  async function handleAplicar(row) {
    setAplicandoId(row.id);
    try {
      const { data, error } = await supabase
        .from("pagos_cofisem")
        .update({ estatus: "APLICADO", aplicado_por: usuario?.id ?? null })
        .eq("id", row.id)
        .select()
        .single();
      if (error) throw error;
      setPolizas((prev) =>
        prev.map((p) =>
          p.id !== data.poliza_cofisem_id
            ? p
            : { ...p, pagos_cofisem: (p.pagos_cofisem ?? []).map((c) => (c.id === data.id ? { ...c, ...data } : c)) }
        )
      );
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg("No se pudo aplicar el pago: " + e.message);
    } finally {
      setAplicandoId(null);
    }
  }

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1447e6] flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Revisión de Pagos
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Historial de cobros — libera y aplica las cuotas que los operadores marcan como recibidas</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Por aplicar", value: porAplicar.length, sub: $(montoPorAplicar), cls: "text-blue-600" },
          { label: "Pendientes", value: pendientesCount, sub: "aún no llega el pago", cls: "text-amber-600" },
          { label: "Aplicados", value: aplicadosCount, sub: "confirmados", cls: "text-emerald-600" },
          { label: "Total cuotas", value: totalCuotas, sub: "en el sistema", cls: "text-[#1447e6]" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className={`text-2xl font-black tabular-nums ${k.cls}`}>{k.value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-0.5">{k.label}</p>
            <p className="text-[11px] text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

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
                  {["Oficina", "Operador", "Póliza", "Aseguradora", "Asegurado", "Cuotas", "Por aplicar", "Acción"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibles.map((g) => {
                  const p = g.poliza;
                  const cobradas = g.aplicados.length + g.porAplicar.length;
                  const opNombre = [g.operador?.nombre, g.operador?.apellido].filter(Boolean).join(" ") || "—";
                  return (
                    <tr key={g.polizaId} className={`transition-colors ${g.cancelada ? "opacity-60 bg-gray-50/80" : "hover:bg-gray-50/60"}`}>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{g.oficina?.nombre || "—"}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{opNombre}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#1447e6] whitespace-nowrap">
                        {p.numero_poliza || "—"}
                        {g.cancelada && (
                          <span className="ml-1.5 inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            {p.poliza_gaman_estatus}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{p.aseguradora || "—"}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[150px] truncate">{p.asegurado_nombre || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <CuotasDots cuotas={g.cuotas} />
                          <span className="text-[11px] text-gray-500 tabular-nums">{cobradas}/{g.cuotas.length}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {g.cancelada ? (
                          <span className="text-gray-400 font-semibold">Cancelada</span>
                        ) : g.montoPorAplicar > 0 ? (
                          <span className="font-bold text-blue-700">{$(g.montoPorAplicar)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
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
        onAplicar={handleAplicar}
        aplicandoId={aplicandoId}
      />
    </div>
  );
}

// Modal de detalle: todas las cuotas de una póliza, con el botón de
// "Aplicar" por cuota — así la tabla principal se queda en una fila por
// póliza sin perder el detalle ni la acción individual de cada cuota. Las
// filas virtuales (1er pago de pólizas que no son de GAMAN) no tienen
// acción: ya se cerraron solas al capturarse en "Completar".
function ModalCuotasPoliza({ grupo, onClose, onVerComprobante, onAplicar, aplicandoId }) {
  if (!grupo) return null;
  const p = grupo.poliza;
  const cobradas = grupo.aplicados.length + grupo.porAplicar.length;

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
              🔒 Póliza {p.poliza_gaman_estatus} en GAMAN — no se pueden aplicar más cobros aquí.
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Por aplicar", value: $(grupo.montoPorAplicar) },
              { label: "Aplicadas", value: `${grupo.aplicados.length}` },
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
                    {!c._virtual && !esGaman && !grupo.cancelada && c.estatus === "RECIBIDO" && (
                      <button
                        type="button"
                        onClick={() => onAplicar(c)}
                        disabled={aplicandoId === c.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-50 whitespace-nowrap"
                      >
                        {aplicandoId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Aplicar"}
                      </button>
                    )}
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
