import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import Swal from "sweetalert2";
import {
  Sliders, X, Plus, DollarSign, Percent, ChevronDown,
  ChevronRight, Loader2, Settings,
} from "lucide-react";
import { fetchPermitirFechasPasadas, setPermitirFechasPasadas, fetchPermitirNumeroManual, setPermitirNumeroManual } from "../../services/configuracion";

// ── Helpers ───────────────────────────────────────────────────
function fmtFecha(str) {
  if (!str) return "—";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

function fmt$(n) {
  if (n == null) return "—";
  return `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

function hoy() {
  return new Date().toISOString().split("T")[0];
}

// ── Modal: Actualizar costos de emisión ──────────────────────
function ModalNuevoCosto({ onClose, onGuardado, usuario }) {
  const [derechos, setDerechos]   = useState("");
  const [iva,      setIva]        = useState("");
  const [desde,    setDesde]      = useState(hoy());
  const [guardando, setGuardando] = useState(false);

  const valido = derechos !== "" && iva !== "" && desde;

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const rows = [
        { clave: "derechos_emision", valor: String(derechos), tipo: "number",  descripcion: "Derechos de emisión por póliza (MXN)", vigente_desde: desde, updated_by: usuario?.id ?? null },
        { clave: "iva_pct",          valor: String(iva),      tipo: "percent", descripcion: "Porcentaje de IVA aplicado a la prima", vigente_desde: desde, updated_by: usuario?.id ?? null },
      ];
      const { error } = await supabase.from("configuracion_costos").insert(rows);
      if (error) throw error;
      onGuardado();
      Swal.fire({
        icon: "success", title: "Costos actualizados",
        text: `Los nuevos valores entran en vigor el ${fmtFecha(desde)}.`,
        confirmButtonColor: "#13193a", timer: 4000, timerProgressBar: true,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message, confirmButtonColor: "#13193a" });
    } finally {
      setGuardando(false);
    }
  };

  const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5 text-[#13193a]" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#13193a]">Programar nuevos costos</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ingresa ambos valores y la fecha de entrada en vigor</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
            Solo afectará a pólizas emitidas a partir de la fecha seleccionada. Las pólizas anteriores conservan sus valores originales.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Derechos de emisión (MXN) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                <input type="number" min="0" step="0.01" value={derechos} onChange={(e) => setDerechos(e.target.value)} className={`${inp} pl-7`} placeholder="400.00" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                IVA (%) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input type="number" min="0" max="100" step="0.01" value={iva} onChange={(e) => setIva(e.target.value)} className={`${inp} pr-7`} placeholder="16" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              Vigente desde <span className="text-red-400">*</span>
            </label>
            <input type="date" min={hoy()} value={desde} onChange={(e) => setDesde(e.target.value)} className={inp} />
          </div>

          {derechos && iva && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-1.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Vista previa — cálculo de prima</p>
              {[
                ["Prima neta (ej. GAMAN 2)", "1,755.17"],
                ["+ Derechos de emisión", Number(derechos).toFixed(2)],
                ["= Subtotal", (1755.17 + Number(derechos)).toFixed(2)],
                ["+ IVA " + iva + "%", ((1755.17 + Number(derechos)) * Number(iva) / 100).toFixed(2)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-xs">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-mono font-semibold text-[#13193a]">${v}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs pt-1.5 border-t border-gray-200 mt-1">
                <span className="font-bold text-[#13193a]">= Prima total</span>
                <span className="font-mono font-bold text-emerald-700">
                  ${((1755.17 + Number(derechos)) * (1 + Number(iva) / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleGuardar} disabled={!valido || guardando}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-lg shadow-[#13193a]/15 flex items-center justify-center gap-2">
            {guardando ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando…</> : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Nueva versión de cobertura ────────────────────────
function ModalNuevaVersionCobertura({ cobertura, onClose, onGuardado }) {
  const [primaNeta,  setPrimaNeta]  = useState(String(cobertura.prima_neta));
  const [primaTotal, setPrimaTotal] = useState(String(cobertura.prima_total));
  const [desde,      setDesde]      = useState(hoy());
  const [guardando,  setGuardando]  = useState(false);

  const valido = primaNeta && primaTotal && desde;

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const { error: e1 } = await supabase.from("coberturas").update({ activa: false, activa_hasta: desde }).eq("id", cobertura.id);
      if (e1) throw e1;
      const { data: nueva, error: e2 } = await supabase.from("coberturas").insert({
        nombre: cobertura.nombre, grupo_id: cobertura.grupo_id, oficina_id: cobertura.oficina_id ?? null,
        duracion_meses: cobertura.duracion_meses, prima_neta: Number(primaNeta), prima_total: Number(primaTotal),
        activa: true, vigente_desde: desde,
      }).select().single();
      if (e2) throw e2;
      const { data: rubros } = await supabase.from("cobertura_rubros").select("rubro, prima_neta, monto_maximo, es_sublimite, orden").eq("cobertura_id", cobertura.id);
      if (rubros?.length) await supabase.from("cobertura_rubros").insert(rubros.map((r) => ({ ...r, cobertura_id: nueva.id })));
      onGuardado();
      Swal.fire({ icon: "success", title: "Nueva versión creada", text: `Nuevos precios vigentes desde ${fmtFecha(desde)}.`, confirmButtonColor: "#13193a", timer: 5000, timerProgressBar: true });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message, confirmButtonColor: "#13193a" });
    } finally {
      setGuardando(false);
    }
  };

  const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#13193a]">Nueva versión de cobertura</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs font-mono">{cobertura.nombre}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
            Solo afecta pólizas emitidas a partir de la fecha elegida. Los rubros se copian automáticamente.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Prima neta actual</p>
              <p className="text-sm font-bold text-gray-400 mt-0.5">{fmt$(cobertura.prima_neta)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Prima total actual</p>
              <p className="text-sm font-bold text-gray-400 mt-0.5">{fmt$(cobertura.prima_total)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Nueva prima neta <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                <input type="number" min="0" step="0.01" value={primaNeta} onChange={(e) => setPrimaNeta(e.target.value)} className={`${inp} pl-7`} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Nueva prima total <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                <input type="number" min="0" step="0.01" value={primaTotal} onChange={(e) => setPrimaTotal(e.target.value)} className={`${inp} pl-7`} />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Vigente desde <span className="text-red-400">*</span></label>
            <input type="date" min={hoy()} value={desde} onChange={(e) => setDesde(e.target.value)} className={inp} />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleGuardar} disabled={!valido || guardando}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-lg shadow-[#13193a]/15 flex items-center justify-center gap-2">
            {guardando ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando…</> : "Crear nueva versión"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function AdminConfiguracion({ usuario }) {
  const [tab,            setTab]            = useState("costos");
  const [histCostos,     setHistCostos]     = useState([]);
  const [coberturas,     setCoberturas]     = useState([]);
  const [grupos,         setGrupos]         = useState([]);
  const [cargandoCostos, setCargandoCostos] = useState(true);
  const [cargandoCob,    setCargandoCob]    = useState(true);
  const [modalCostos,    setModalCostos]    = useState(false);
  const [cobModal,       setCobModal]       = useState(null);
  const [rubrosAbiertos, setRubrosAbiertos] = useState({});
  const [permitirFechas,   setPermitirFechas]   = useState(false);
  const [permitirNumMan,   setPermitirNumMan]   = useState(false);
  const [guardandoSist,    setGuardandoSist]    = useState(false);

  const cargarCostos = useCallback(async () => {
    setCargandoCostos(true);
    const { data } = await supabase.from("configuracion_costos").select("clave, valor, tipo, descripcion, vigente_desde, updated_at").order("vigente_desde", { ascending: false });
    setHistCostos(data ?? []);
    setCargandoCostos(false);
  }, []);

  const cargarCoberturas = useCallback(async () => {
    setCargandoCob(true);
    const [{ data: cobs }, { data: grps }] = await Promise.all([
      supabase.from("coberturas").select("*, grupos_coberturas(nombre), cobertura_rubros(id, rubro, prima_neta, monto_maximo, es_sublimite, orden)").order("nombre"),
      supabase.from("grupos_coberturas").select("id, nombre").order("nombre"),
    ]);
    setCoberturas(cobs ?? []);
    setGrupos(grps ?? []);
    setCargandoCob(false);
  }, []);

  useEffect(() => {
    cargarCostos();
    cargarCoberturas();
    fetchPermitirFechasPasadas().then(setPermitirFechas).catch(console.error);
    fetchPermitirNumeroManual().then(setPermitirNumMan).catch(console.error);
  }, [cargarCostos, cargarCoberturas]);

  const h = hoy();
  const currentCostos = {};
  for (const row of histCostos) {
    if (row.vigente_desde <= h && !(row.clave in currentCostos)) currentCostos[row.clave] = row;
  }
  const derechosActual = currentCostos["derechos_emision"];
  const ivaActual      = currentCostos["iva_pct"];

  const activasPorGrupo = grupos.map((g) => ({
    grupo: g,
    items: coberturas.filter((c) => c.activa && c.grupo_id === g.id),
  })).filter((g) => g.items.length > 0);

  const inactivas = coberturas.filter((c) => !c.activa);

  const toggleRubros = (id) => setRubrosAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Precios y coberturas</h1>
        <p className="text-gray-400 text-sm mt-0.5">Los cambios solo aplican a pólizas emitidas después de la fecha programada</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-gray-100 px-2">
          {[{ k: "costos", l: "Costos de emisión" }, { k: "coberturas", l: "Coberturas" }, { k: "sistema", l: "Sistema" }].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${tab === t.k ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── Tab: Costos ──────────────────────────────────────── */}
        {tab === "costos" && (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Valores vigentes hoy</p>
                <button onClick={() => setModalCostos(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/20">
                  <Plus className="w-3.5 h-3.5" />
                  Programar nuevo valor
                </button>
              </div>

              {cargandoCostos ? (
                <div className="h-24 flex items-center justify-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" /> Cargando…
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-100 p-5 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Derechos de emisión</p>
                        <p className="text-3xl font-bold text-[#13193a] mt-1 tabular-nums">{derechosActual ? fmt$(derechosActual.valor) : "—"}</p>
                        <p className="text-xs text-gray-400 mt-1">Vigente desde {derechosActual ? fmtFecha(derechosActual.vigente_desde) : "—"}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-5 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Porcentaje de IVA</p>
                        <p className="text-3xl font-bold text-[#13193a] mt-1 tabular-nums">{ivaActual ? `${ivaActual.valor}%` : "—"}</p>
                        <p className="text-xs text-gray-400 mt-1">Vigente desde {ivaActual ? fmtFecha(ivaActual.vigente_desde) : "—"}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Percent className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Historial de cambios</p>
              {cargandoCostos ? null : histCostos.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">Sin historial de cambios.</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        {["Concepto", "Valor", "Vigente desde"].map((h) => (
                          <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {histCostos.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50/60">
                          <td className="px-4 py-2.5 text-xs text-gray-700 font-medium">{r.descripcion || r.clave}</td>
                          <td className="px-4 py-2.5 text-xs font-bold text-[#13193a] tabular-nums font-mono">
                            {r.tipo === "percent" ? `${r.valor}%` : fmt$(r.valor)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">{fmtFecha(r.vigente_desde)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Coberturas ──────────────────────────────────── */}
        {tab === "coberturas" && (
          <div className="p-6 space-y-6">
            {cargandoCob ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando coberturas…</span>
              </div>
            ) : (
              <div className="space-y-6">
                {activasPorGrupo.map(({ grupo, items }) => (
                  <div key={grupo.id}>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{grupo.nombre}</p>
                    <div className="space-y-2">
                      {items.map((cob) => {
                        const rubros = (cob.cobertura_rubros ?? []).sort((a, b) => a.orden - b.orden);
                        const abierto = rubrosAbiertos[cob.id];
                        return (
                          <div key={cob.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                            <div className="flex items-center gap-4 px-5 py-3.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#13193a] truncate">{cob.nombre}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {cob.duracion_meses === 6 ? "6 meses" : "Anual"} · Vigente desde {fmtFecha(cob.vigente_desde)}
                                  {cob.oficina_id && " · Solo una oficina"}
                                </p>
                              </div>
                              <div className="flex items-center gap-6 shrink-0">
                                <div className="text-right">
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Prima neta</p>
                                  <p className="text-sm font-bold text-[#13193a] tabular-nums">{fmt$(cob.prima_neta)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Prima total</p>
                                  <p className="text-sm font-bold text-emerald-700 tabular-nums">{fmt$(cob.prima_total)}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => toggleRubros(cob.id)}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-all whitespace-nowrap">
                                    {abierto ? "Ocultar" : "Rubros"}
                                    <ChevronDown className={`w-3 h-3 transition-transform ${abierto ? "rotate-180" : ""}`} />
                                  </button>
                                  <button onClick={() => setCobModal(cob)}
                                    className="flex items-center gap-1 text-[11px] font-bold text-[#13193a] border border-[#13193a]/20 px-2.5 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all whitespace-nowrap">
                                    <Plus className="w-3 h-3" />
                                    Nueva versión
                                  </button>
                                </div>
                              </div>
                            </div>

                            {abierto && rubros.length > 0 && (
                              <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-3">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-gray-400 uppercase tracking-wide text-[10px]">
                                      <th className="text-left pb-2 font-semibold">Rubro</th>
                                      <th className="text-right pb-2 font-semibold">Suma asegurada</th>
                                      <th className="text-right pb-2 font-semibold">Prima neta</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {rubros.map((r) => (
                                      <tr key={r.id} className={r.es_sublimite ? "opacity-60" : ""}>
                                        <td className={`py-1.5 text-gray-700 ${r.es_sublimite ? "pl-4" : "font-medium"}`}>
                                          {r.es_sublimite ? "↳ " : ""}{r.rubro}
                                        </td>
                                        <td className="py-1.5 text-right text-gray-500">{r.monto_maximo || "—"}</td>
                                        <td className="py-1.5 text-right font-mono text-[#13193a]">{r.prima_neta > 0 ? fmt$(r.prima_neta) : "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {abierto && rubros.length === 0 && (
                              <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 text-xs text-gray-400 text-center">Sin rubros registrados.</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {inactivas.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer text-[11px] font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-widest list-none flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                      Versiones anteriores ({inactivas.length})
                    </summary>
                    <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50/80 border-b border-gray-100">
                            {["Cobertura", "Prima neta", "Prima total", "Vigente desde", "Reemplazada"].map((h) => (
                              <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {inactivas.map((c) => (
                            <tr key={c.id} className="opacity-60 hover:opacity-80 transition-opacity">
                              <td className="px-4 py-2.5 text-xs text-gray-700">{c.nombre}</td>
                              <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{fmt$(c.prima_neta)}</td>
                              <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{fmt$(c.prima_total)}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500">{fmtFecha(c.vigente_desde)}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500">{fmtFecha(c.activa_hasta)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
        {/* ── Tab: Sistema ───────────────────────────────────────── */}
        {tab === "sistema" && (
          <div className="p-6 space-y-6">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Configuración de emisión</p>

              {/* Toggle: número manual */}
              <div className="flex items-start justify-between bg-white rounded-2xl border border-gray-100 px-5 py-4 gap-6 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="w-4 h-4 text-[#13193a]" />
                    <p className="text-sm font-bold text-[#13193a]">Permitir número de póliza manual</p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Cuando está <span className="font-semibold text-[#13193a]">activado</span>, el operador puede escribir manualmente el número de constancia al cotizar.
                    El sistema verifica que no esté duplicado. Si se deja vacío, el sistema lo asigna automáticamente.
                  </p>
                  {permitirNumMan && (
                    <span className="inline-block mt-2 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                      Activo — número manual habilitado
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const nuevo = !permitirNumMan;
                    setGuardandoSist(true);
                    try {
                      await setPermitirNumeroManual(nuevo, usuario?.id ?? null);
                      setPermitirNumMan(nuevo);
                      Swal.fire({
                        icon: "success",
                        title: nuevo ? "Número manual habilitado" : "Número manual deshabilitado",
                        text: nuevo
                          ? "Los operadores pueden ingresar el número de póliza manualmente."
                          : "El sistema asignará el número de póliza automáticamente.",
                        confirmButtonColor: "#13193a",
                        timer: 3500,
                        timerProgressBar: true,
                      });
                    } catch (e) {
                      Swal.fire({ icon: "error", title: "Error", text: e.message, confirmButtonColor: "#13193a" });
                    } finally {
                      setGuardandoSist(false);
                    }
                  }}
                  disabled={guardandoSist}
                  className={`relative inline-flex h-7 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${permitirNumMan ? "bg-[#13193a]" : "bg-gray-300"}`}
                  style={{ minWidth: 52 }}
                >
                  {guardandoSist
                    ? <Loader2 className="w-4 h-4 animate-spin text-white mx-auto" />
                    : <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${permitirNumMan ? "translate-x-[26px]" : "translate-x-[3px]"}`} />
                  }
                </button>
              </div>

              {/* Toggle: fechas pasadas */}
              <div className="flex items-start justify-between bg-white rounded-2xl border border-gray-100 px-5 py-4 gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="w-4 h-4 text-[#13193a]" />
                    <p className="text-sm font-bold text-[#13193a]">Permitir fechas de inicio anteriores a hoy</p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Cuando está <span className="font-semibold text-[#13193a]">activado</span>, el operador puede emitir pólizas con cualquier fecha de inicio (incluidas fechas pasadas).
                    Cuando está <span className="font-semibold">desactivado</span> (por defecto), solo se permiten fechas desde hoy hasta 30 días en el futuro.
                  </p>
                  {permitirFechas && (
                    <span className="inline-block mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                      Activo — se permiten fechas pasadas
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const nuevo = !permitirFechas;
                    setGuardandoSist(true);
                    try {
                      await setPermitirFechasPasadas(nuevo, usuario?.id ?? null);
                      setPermitirFechas(nuevo);
                      Swal.fire({
                        icon: "success",
                        title: nuevo ? "Fechas pasadas habilitadas" : "Fechas pasadas deshabilitadas",
                        text: nuevo
                          ? "Los operadores ahora pueden seleccionar cualquier fecha de inicio."
                          : "Solo se permiten fechas desde hoy hasta 30 días adelante.",
                        confirmButtonColor: "#13193a",
                        timer: 3500,
                        timerProgressBar: true,
                      });
                    } catch (e) {
                      Swal.fire({ icon: "error", title: "Error", text: e.message, confirmButtonColor: "#13193a" });
                    } finally {
                      setGuardandoSist(false);
                    }
                  }}
                  disabled={guardandoSist}
                  className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${permitirFechas ? "bg-[#13193a]" : "bg-gray-300"}`}
                  style={{ minWidth: 52 }}
                >
                  {guardandoSist
                    ? <Loader2 className="w-4 h-4 animate-spin text-white mx-auto" />
                    : <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${permitirFechas ? "translate-x-[26px]" : "translate-x-[3px]"}`} />
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {modalCostos && <ModalNuevoCosto usuario={usuario} onClose={() => setModalCostos(false)} onGuardado={() => { setModalCostos(false); cargarCostos(); }} />}
      {cobModal && <ModalNuevaVersionCobertura cobertura={cobModal} onClose={() => setCobModal(null)} onGuardado={() => { setCobModal(null); cargarCoberturas(); }} />}
    </div>
  );
}
