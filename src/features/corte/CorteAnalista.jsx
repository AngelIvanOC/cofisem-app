import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Paperclip, Inbox, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { verComprobante as abrirComprobante } from "../../services/comprobantesPago";

const n = (v) => parseFloat(v) || 0;
const $ = (v) => `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtDateTime = (ts) =>
  ts ? new Date(ts).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
const hoyIso = () => new Date().toISOString().split("T")[0];

const REVISION_META = {
  PENDIENTE: { label: "Pendiente de revisión", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APROBADO:  { label: "Aprobado",               cls: "bg-blue-50 text-blue-700 border-blue-200" },
  REGRESADO: { label: "Regresado",              cls: "bg-red-50 text-red-700 border-red-200" },
  RECIBIDO:  { label: "Recibido",               cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const PAGO_ADMIN_META = {
  DESCONOCIDO: { label: "Desconocido", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  PAGADA:      { label: "Pagada",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  NO_PAGADA:   { label: "No pagada",   cls: "bg-red-50 text-red-700 border-red-200" },
};
const PAGO_ADMIN_CICLO = { DESCONOCIDO: "PAGADA", PAGADA: "NO_PAGADA", NO_PAGADA: "DESCONOCIDO" };

function totalesDe(regs) {
  return {
    count: regs.length,
    vale: regs.reduce((s, r) => s + n(r.vale), 0),
    primaAnual: regs.reduce((s, r) => s + n(r.prima_anual), 0),
    primaNeta: regs.reduce((s, r) => s + n(r.prima_neta), 0),
    primerPago: regs.reduce((s, r) => s + n(r.prima_primer_pago), 0),
    efectivo: regs.reduce((s, r) => s + n(r.efectivo), 0),
    cheque: regs.reduce((s, r) => s + n(r.cheque), 0),
    tdc: regs.reduce((s, r) => s + n(r.tdc), 0),
  };
}

export default function CorteAnalista({ usuario }) {
  const [searchParams] = useSearchParams();
  const oficinaParam = searchParams.get("oficina");
  const fechaParam = searchParams.get("fecha");
  const detalleRef = useRef(null);

  const [oficinas, setOficinas] = useState([]);
  const [oficinaSel, setOficinaSel] = useState(oficinaParam ? Number(oficinaParam) : null);
  const [fecha, setFecha] = useState(fechaParam || hoyIso());
  const [usuariosMap, setUsuariosMap] = useState({}); // id -> { nombre, apellido }

  const [registrosDia, setRegistrosDia] = useState([]);       // todas las oficinas, esa fecha
  const [entregasDia, setEntregasDia] = useState([]);          // corte_efectivo_entrega, todas las oficinas, esa fecha
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [guardandoId, setGuardandoId] = useState(null); // id de corte_efectivo_entrega que se está guardando

  const [liberaciones, setLiberaciones] = useState([]);
  const [liberacionesLoading, setLiberacionesLoading] = useState(true);
  const [liberandoId, setLiberandoId] = useState(null);
  const [errorLiberaciones, setErrorLiberaciones] = useState(null);

  const [entregaActiva, setEntregaActiva] = useState(null); // corte_efectivo_entrega sobre el que actúa un modal
  const [modalRegresar, setModalRegresar] = useState(false);
  const [textoObservacion, setTextoObservacion] = useState("");
  const [modalNota, setModalNota] = useState(false);
  const [textoNota, setTextoNota] = useState("");

  useEffect(() => {
    supabase.from("oficinas").select("id, nombre").order("nombre").then(({ data, error }) => {
      if (error) { setErrorMsg(error.message); return; }
      setOficinas(data ?? []);
      if (data?.length && oficinaSel == null) setOficinaSel(data[0].id);
    });
    supabase.from("usuarios").select("id, nombre, apellido").then(({ data }) => {
      const map = {};
      (data ?? []).forEach((u) => { map[u.id] = u; });
      setUsuariosMap(map);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function nombreOperador(id) {
    const u = usuariosMap[id];
    return u ? [u.nombre, u.apellido].filter(Boolean).join(" ") : "—";
  }

  const cargarLiberaciones = useCallback(async () => {
    setLiberacionesLoading(true);
    try {
      const { data, error } = await supabase
        .from("corte_efectivo_entrega")
        .select("*")
        .eq("cierre_incompleto", true)
        .not("estatus_revision", "in", "(APROBADO,RECIBIDO)")
        .order("fecha_corte", { ascending: false })
        .limit(30);
      if (error) throw error;
      const conConteo = await Promise.all(
        (data ?? []).map(async (row) => {
          const { count } = await supabase
            .from("polizas_cofisem")
            .select("id", { count: "exact", head: true })
            .eq("fecha_corte", row.fecha_corte)
            .eq("oficina_id", row.oficina_id)
            .eq("completado", false);
          return { ...row, incompletas: count ?? 0 };
        }),
      );
      setLiberaciones(conConteo);
      setErrorLiberaciones(null);
    } catch (e) {
      setErrorLiberaciones(e.message);
    } finally {
      setLiberacionesLoading(false);
    }
  }, []);

  useEffect(() => { cargarLiberaciones(); }, [cargarLiberaciones]);

  function irACorte(row) {
    setOficinaSel(row.oficina_id);
    setFecha(row.fecha_corte);
    detalleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleLiberar(row) {
    setLiberandoId(row.id);
    try {
      const { error } = await supabase
        .from("corte_efectivo_entrega")
        .update({ estatus_revision: "APROBADO", revisado_por: usuario?.id ?? null })
        .eq("id", row.id);
      if (error) throw error;
      setLiberaciones((prev) => prev.filter((x) => x.id !== row.id));
      if (row.fecha_corte === fecha && row.oficina_id === oficinaSel) cargar();
    } catch (e) {
      setErrorLiberaciones("No se pudo liberar el corte: " + e.message);
    } finally {
      setLiberandoId(null);
    }
  }

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: polizas, error: e1 }, { data: entregas, error: e2 }] = await Promise.all([
        supabase.from("polizas_cofisem").select("*").eq("fecha_corte", fecha).order("created_at", { ascending: true }),
        supabase.from("corte_efectivo_entrega").select("*").eq("fecha_corte", fecha),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      setRegistrosDia(polizas ?? []);
      setEntregasDia(entregas ?? []);
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => { cargar(); }, [cargar]);

  const oficina = oficinas.find((o) => o.id === oficinaSel);
  const registrosOficina = registrosDia.filter((r) => r.oficina_id === oficinaSel);
  const entregasOficina = entregasDia.filter((e) => e.oficina_id === oficinaSel);

  // Un "corte" por cada operador que tuvo actividad ese día en esta oficina
  // (registró pólizas y/o ya abrió su entrega de efectivo).
  const operadorIds = Array.from(new Set([
    ...entregasOficina.map((e) => e.operador_id).filter(Boolean),
    ...registrosOficina.map((r) => r.creado_por).filter(Boolean),
  ])).sort((a, b) => nombreOperador(a).localeCompare(nombreOperador(b)));

  const cortesOperador = operadorIds.map((opId) => {
    const entrega = entregasOficina.find((e) => e.operador_id === opId) ?? null;
    const registros = registrosOficina.filter((r) => r.creado_por === opId);
    return { operadorId: opId, entrega, registros, totales: totalesDe(registros) };
  });

  async function actualizarEntrega(entregaId, cambios) {
    if (!entregaId) return;
    setGuardandoId(entregaId);
    try {
      const { data, error } = await supabase
        .from("corte_efectivo_entrega")
        .update({ ...cambios, revisado_por: usuario?.id ?? null })
        .eq("id", entregaId)
        .select()
        .single();
      if (error) throw error;
      setEntregasDia((prev) => prev.map((e) => (e.id === data.id ? data : e)));
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg("No se pudo actualizar el corte: " + e.message);
    } finally {
      setGuardandoId(null);
    }
  }

  function handleAprobar(entrega) {
    actualizarEntrega(entrega.id, { estatus_revision: "APROBADO" });
  }

  function handleAbrirRegresar(entrega) {
    setEntregaActiva(entrega);
    setTextoObservacion(entrega?.notas_admin ?? "");
    setModalRegresar(true);
  }

  async function handleConfirmarRegresar() {
    if (!textoObservacion.trim() || !entregaActiva) return;
    await actualizarEntrega(entregaActiva.id, { estatus_revision: "REGRESADO", notas_admin: textoObservacion.trim() });
    setModalRegresar(false);
  }

  function handleRecibido(entrega) {
    actualizarEntrega(entrega.id, { estatus_revision: "RECIBIDO", recibido_por: usuario?.id ?? null });
  }

  function handleAbrirNota(entrega) {
    setEntregaActiva(entrega);
    setTextoNota(entrega?.notas_admin ?? "");
    setModalNota(true);
  }

  async function handleGuardarNota() {
    if (!entregaActiva) return;
    await actualizarEntrega(entregaActiva.id, { notas_admin: textoNota.trim() || null });
    setModalNota(false);
  }

  async function handleCiclarPago(r) {
    const siguiente = PAGO_ADMIN_CICLO[r.estatus_pago_admin ?? "DESCONOCIDO"];
    try {
      const { data, error } = await supabase
        .from("polizas_cofisem")
        .update({ estatus_pago_admin: siguiente, estatus_pago_admin_por: usuario?.id ?? null, estatus_pago_admin_at: new Date().toISOString() })
        .eq("id", r.id)
        .select()
        .single();
      if (error) throw error;
      setRegistrosDia((prev) => prev.map((row) => (row.id === data.id ? data : row)));
    } catch (e) {
      setErrorMsg("No se pudo actualizar el estatus de pago: " + e.message);
    }
  }

  async function verComprobante(path) {
    try {
      await abrirComprobante(path);
    } catch (e) {
      setErrorMsg("No se pudo abrir el comprobante: " + e.message);
    }
  }

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Revisión de Corte Diario</h1>
        <p className="text-gray-400 text-sm mt-0.5">Aprueba, regresa o marca como recibidos los cortes que envían las oficinas</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {/* Liberaciones de corte — solicitudes de cierre incompleto pendientes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
          <Inbox className="w-4 h-4 text-violet-500" />
          <p className="text-sm font-bold text-[#13193a]">Liberaciones de corte</p>
          {liberaciones.length > 0 && (
            <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {liberaciones.length}
            </span>
          )}
        </div>
        {errorLiberaciones && (
          <div className="mx-5 mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 flex items-center justify-between">
            {errorLiberaciones}
            <button onClick={() => setErrorLiberaciones(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
          </div>
        )}
        <div className="divide-y divide-gray-50">
          {liberacionesLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando…</span>
            </div>
          ) : liberaciones.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold">Sin solicitudes pendientes.</span>
            </div>
          ) : (
            liberaciones.map((row) => (
              <div key={row.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#13193a] truncate">
                    {oficinas.find((o) => o.id === row.oficina_id)?.nombre ?? "—"} · {fmt(row.fecha_corte)}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{nombreOperador(row.operador_id)}</p>
                  <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                    {row.incompletas} {row.incompletas === 1 ? "póliza incompleta" : "pólizas incompletas"}
                  </p>
                  {row.nota_operador_cierre && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">"{row.nota_operador_cierre}"</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => irACorte(row)}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Ver
                </button>
                <button
                  type="button"
                  onClick={() => handleLiberar(row)}
                  disabled={liberandoId === row.id}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-[11px] font-semibold hover:bg-violet-100 disabled:opacity-50 transition-colors"
                >
                  {liberandoId === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Liberar"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selector de oficina y fecha */}
      <div ref={detalleRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Oficina</label>
            <select
              value={oficinaSel ?? ""}
              onChange={(e) => setOficinaSel(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
            >
              {oficinas.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Fecha de corte</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Cargando…
        </div>
      ) : (
        <>
          {cortesOperador.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400">
              Sin actividad de ningún operador en {oficina?.nombre ?? "esta oficina"} el {fmt(fecha)}.
            </div>
          ) : (
            cortesOperador.map(({ operadorId, entrega, registros, totales: t }) => {
              const cerrado = !!entrega?.cerrado;
              const estatusRevision = entrega?.estatus_revision ?? "PENDIENTE";
              const revMeta = REVISION_META[estatusRevision] ?? REVISION_META.PENDIENTE;
              const guardando = guardandoId === entrega?.id;
              return (
                <div key={operadorId} className="space-y-0">
                  {/* Info del corte del operador + acciones */}
                  <div className="rounded-t-2xl border border-gray-100 border-b-0 bg-white p-4 flex items-center gap-4 flex-wrap">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cerrado ? "bg-emerald-500" : "bg-amber-500"}`}>
                      {cerrado ? (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[#13193a]">{nombreOperador(operadorId)}</p>
                        <span className="text-[11px] font-semibold text-gray-400">{cerrado ? "Corte cerrado" : "Corte en proceso"}</span>
                        {cerrado && (
                          <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${revMeta.cls}`}>
                            {revMeta.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {oficina?.nombre ?? "—"} · {fmt(fecha)}
                        {entrega?.cerrado_at && <> · Cerrado el {fmtDateTime(entrega.cerrado_at)}</>}
                      </p>
                      {entrega?.notas_admin && (
                        <p className="text-xs text-gray-500 mt-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 inline-block">
                          <strong className="text-gray-600">Nota admin:</strong> {entrega.notas_admin}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {!cerrado && (
                        <span className="text-xs text-gray-400 italic">Esperando a que cierre su corte</span>
                      )}
                      {cerrado && (
                        <>
                          <button type="button" onClick={() => handleAbrirNota(entrega)} disabled={guardando}
                            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                            Agregar nota
                          </button>
                          <button type="button" onClick={() => handleAbrirRegresar(entrega)} disabled={guardando}
                            className="px-3.5 py-2 rounded-xl border border-red-200 bg-white text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40">
                            Regresar con observaciones
                          </button>
                          {estatusRevision === "PENDIENTE" && (
                            <button type="button" onClick={() => handleAprobar(entrega)} disabled={guardando}
                              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-40">
                              Dar el visto bueno
                            </button>
                          )}
                          {estatusRevision === "APROBADO" && (
                            <button type="button" onClick={() => handleRecibido(entrega)} disabled={guardando}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40">
                              Dar de recibido
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tabla de pólizas del operador */}
                  <div className="bg-white rounded-b-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
                    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-[#13193a]">
                      <p className="text-sm font-bold text-white">Pólizas</p>
                      <span className="text-white/50 text-xs">{registros.length} registros</span>
                    </div>

                    {registros.length === 0 ? (
                      <div className="text-center py-10 text-sm text-gray-400">Sin pólizas registradas en este corte.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="text-xs" style={{ minWidth: "1500px", width: "100%" }}>
                          <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                              {["No.", "Aseguradora", "Póliza", "Folio", "Asegurado", "Vendedor", "Cobertura", "F. Pago", "Efectivo", "Cheque", "TDC", "Vale", "P. Anual", "P. Neta", "1er Pago", "Observaciones", "Pago (admin)"].map((h) => (
                                <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide px-3 py-2.5 border-r border-gray-100 last:border-r-0 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {registros.map((r, i) => {
                              const pagoMeta = PAGO_ADMIN_META[r.estatus_pago_admin ?? "DESCONOCIDO"];
                              return (
                                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                                  <td className="px-3 py-2.5 font-bold text-[#13193a]">{i + 1}</td>
                                  <td className="px-3 py-2.5 font-semibold text-gray-700 whitespace-nowrap">{r.aseguradora || "—"}</td>
                                  <td className="px-3 py-2.5 font-mono font-bold text-[#13193a] whitespace-nowrap">{r.numero_poliza || "—"}</td>
                                  <td className="px-3 py-2.5 font-mono text-gray-600">{r.folio || "—"}</td>
                                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{r.asegurado_nombre || "—"}</td>
                                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{r.vendedor_nombre || "—"}</td>
                                  <td className="px-3 py-2.5 text-gray-600 max-w-40 truncate">{r.cobertura || "—"}</td>
                                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.forma_pago || "—"}</td>
                                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">{n(r.efectivo) > 0 ? $(r.efectivo) : "—"}</td>
                                  <td className="px-3 py-2.5 text-right text-gray-600">
                                    {n(r.cheque) > 0 ? $(r.cheque) : "—"}
                                    {r.comprobante_cheque_url && (
                                      <button type="button" onClick={() => verComprobante(r.comprobante_cheque_url)} className="ml-1 align-middle text-[#13193a] hover:text-[#1e2a50] inline-flex"><Paperclip className="w-3.5 h-3.5" /></button>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-gray-600">
                                    {n(r.tdc) > 0 ? $(r.tdc) : "—"}
                                    {r.comprobante_tdc_url && (
                                      <button type="button" onClick={() => verComprobante(r.comprobante_tdc_url)} className="ml-1 align-middle text-[#13193a] hover:text-[#1e2a50] inline-flex"><Paperclip className="w-3.5 h-3.5" /></button>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-gray-600">
                                    {n(r.vale) > 0 ? $(r.vale) : "—"}
                                    {r.comprobante_vale_url && (
                                      <button type="button" onClick={() => verComprobante(r.comprobante_vale_url)} className="ml-1 align-middle text-[#13193a] hover:text-[#1e2a50] inline-flex"><Paperclip className="w-3.5 h-3.5" /></button>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-semibold text-[#13193a]">{$(r.prima_anual)}</td>
                                  <td className="px-3 py-2.5 text-right text-gray-700">{$(r.prima_neta)}</td>
                                  <td className="px-3 py-2.5 text-right font-bold text-emerald-700">{$(r.prima_primer_pago)}</td>
                                  <td className="px-3 py-2.5 text-gray-400 max-w-40 truncate">{r.observaciones || "—"}</td>
                                  <td className="px-3 py-2.5">
                                    <button
                                      type="button"
                                      onClick={() => handleCiclarPago(r)}
                                      title="Clic para cambiar"
                                      className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${pagoMeta.cls}`}
                                    >
                                      {pagoMeta.label}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}

                            <tr className="bg-[#13193a]/5 font-bold border-t-2 border-[#13193a]/20">
                              <td colSpan={8} className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">TOTALES</td>
                              <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">{$(t.efectivo)}</td>
                              <td className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">{$(t.cheque)}</td>
                              <td className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">{$(t.tdc)}</td>
                              <td className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">{$(t.vale)}</td>
                              <td className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">{$(t.primaAnual)}</td>
                              <td className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">{$(t.primaNeta)}</td>
                              <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">{$(t.primerPago)}</td>
                              <td colSpan={2} />
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Resumen multi-oficina */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-[#13193a] px-5 py-3.5">
              <p className="text-sm font-bold text-white">Resumen de {fmt(fecha)} — todas las oficinas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {["Oficina", "Operadores", "Pólizas", "1er pago total", "Pendientes de revisión"].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {oficinas.map((o) => {
                    const regs = registrosDia.filter((r) => r.oficina_id === o.id);
                    const entsOf = entregasDia.filter((e) => e.oficina_id === o.id);
                    const opsOf = new Set([
                      ...entsOf.map((e) => e.operador_id).filter(Boolean),
                      ...regs.map((r) => r.creado_por).filter(Boolean),
                    ]);
                    const pendientes = entsOf.filter((e) => e.cerrado && (e.estatus_revision ?? "PENDIENTE") === "PENDIENTE").length;
                    const to = totalesDe(regs);
                    return (
                      <tr key={o.id} className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${o.id === oficinaSel ? "bg-blue-50/40" : ""}`} onClick={() => setOficinaSel(o.id)}>
                        <td className="px-5 py-3.5 text-sm font-semibold text-[#13193a]">{o.nombre}</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-[#13193a]">{opsOf.size}</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-[#13193a]">{regs.length}</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-emerald-700 tabular-nums">{$(to.primerPago)}</td>
                        <td className="px-5 py-3.5">
                          {pendientes > 0 ? (
                            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                              {pendientes}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: regresar con observaciones */}
      {modalRegresar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <p className="text-sm font-bold text-[#13193a] mb-2">Regresar corte con observaciones</p>
            <p className="text-xs text-gray-500 mb-3">Esto reabre el corte para que el operador pueda corregirlo. Describe qué falta o está mal.</p>
            <textarea
              value={textoObservacion}
              onChange={(e) => setTextoObservacion(e.target.value)}
              placeholder="Ej. Falta comprobante de la póliza 3413167, revisar folio T0455…"
              className="w-full h-28 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none"
            />
            <div className="flex items-center justify-end gap-3 mt-5">
              <button type="button" onClick={() => setModalRegresar(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button type="button" onClick={handleConfirmarRegresar} disabled={!textoObservacion.trim() || guardandoId != null}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-40">
                Regresar corte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: nota administrativa */}
      {modalNota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <p className="text-sm font-bold text-[#13193a] mb-2">Nota administrativa</p>
            <p className="text-xs text-gray-500 mb-3">Visible solo para administración/analista — no cambia el estatus del corte.</p>
            <textarea
              value={textoNota}
              onChange={(e) => setTextoNota(e.target.value)}
              placeholder="Comentario interno sobre este corte…"
              className="w-full h-28 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] resize-none"
            />
            <div className="flex items-center justify-end gap-3 mt-5">
              <button type="button" onClick={() => setModalNota(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button type="button" onClick={handleGuardarNota} disabled={guardandoId != null}
                className="px-5 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40">
                Guardar nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
