import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const HOY_ISO = new Date().toISOString().split("T")[0];
const HOY_LABEL = new Date().toLocaleDateString("es-MX", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric",
});

const FORMA_PAGO_OPT = ["CONTADO", "4 PARCIALES", "TRIMESTRAL", "SEMESTRAL", "ANUAL"];
const TIPO_OPT         = ["COCHE", "MOTO", "CAMIONETA", "PICKUP", "OTRO"];

const FORM_VACIO = {
  aseguradora: "", numero_poliza: "", folio: "",
  cobertura: "", forma_pago: "CONTADO",
  fecha_emision: HOY_ISO, vigencia_inicio: HOY_ISO, vigencia_fin: "",
  asegurado_nombre: "", telefono: "", vendedor_nombre: "",
  placas: "", tipo: "COCHE",
  prima_anual: "", prima_neta: "", prima_primer_pago: "",
  vale: "", pol_pend_pago: "",
  efectivo: "", cheque: "", tdc: "", autorizacion: "",
  fotos: false, factura: false, t_circ: false,
  identif: false, pol_ant: false, otro: false,
  observaciones: "",
};

const inpCls = "w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
const lblCls = "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";
const n = (v) => parseFloat(v) || 0;
const fmt = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const $ = (v) => `$${n(v).toFixed(2)}`;

function SeccionHeader({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{children}</p>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

export default function PoliciasDia({ usuario }) {
  const [polizas,      setPolizas]      = useState([]);
  const [aseguradoras, setAseguradoras] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [vista,        setVista]        = useState("lista"); // "lista" | "form"
  const [form,         setForm]         = useState({ ...FORM_VACIO });
  const [guardando,    setGuardando]    = useState(false);
  const [errorMsg,     setErrorMsg]     = useState(null);

  const oficina = usuario?.oficinas?.nombre ?? "OFICINA";

  useEffect(() => { cargar(); cargarAseguradoras(); }, []);

  async function cargarAseguradoras() {
    const { data } = await supabase
      .from("aseguradoras")
      .select("id, nombre")
      .order("nombre", { ascending: true });
    if (data) setAseguradoras(data.map((a) => a.nombre).filter(Boolean));
  }

  async function cargar() {
    try {
      let query = supabase
        .from("polizas_cofisem")
        .select("*")
        .eq("fecha_corte", HOY_ISO)
        .order("created_at", { ascending: false });
      if (usuario?.oficina_id) query = query.eq("oficina_id", usuario.oficina_id);
      const { data, error } = await query;
      if (error) throw error;
      setPolizas(data ?? []);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  function handleNueva() {
    setForm({ ...FORM_VACIO });
    setErrorMsg(null);
    setVista("form");
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    try {
      const { data, error } = await supabase
        .from("polizas_cofisem")
        .insert({
          ...form,
          fecha_corte:       HOY_ISO,
          oficina_id:        usuario?.oficina_id ?? null,
          creado_por:        usuario?.id ?? null,
          prima_anual:       n(form.prima_anual),
          prima_neta:        n(form.prima_neta),
          prima_primer_pago: n(form.prima_primer_pago),
          vale:              n(form.vale),
          pol_pend_pago:     n(form.pol_pend_pago),
          efectivo:          n(form.efectivo),
          cheque:            n(form.cheque),
          tdc:               n(form.tdc),
        })
        .select()
        .single();
      if (error) throw error;
      setPolizas(prev => [data, ...prev]);
      setVista("lista");
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (!window.confirm("¿Eliminar este registro?")) return;
    try {
      const { error } = await supabase.from("polizas_dia").delete().eq("id", id);
      if (error) throw error;
      setPolizas(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      setErrorMsg(e.message);
    }
  }

  // ── VISTA FORMULARIO ─────────────────────────────────────────
  if (vista === "form") return (
    <div className="p-6 min-h-full bg-gray-50">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setVista("lista")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Cancelar
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#13193a]">Nueva póliza</h1>
          <p className="text-xs text-gray-400 mt-0.5">{oficina} · {HOY_LABEL}</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      <form onSubmit={handleGuardar} className="space-y-6">

        {/* ── S1: Póliza ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SeccionHeader>Datos de la póliza</SeccionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={lblCls}>Aseguradora <span className="text-red-400">*</span></label>
              <select value={form.aseguradora} onChange={e => setF("aseguradora", e.target.value)} required className={inpCls}>
                <option value="">Selecciona...</option>
                {aseguradoras.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={lblCls}>No. Póliza <span className="text-red-400">*</span></label>
              <input value={form.numero_poliza} onChange={e => setF("numero_poliza", e.target.value.toUpperCase())} required placeholder="Ej. 3413241" className={inpCls} />
            </div>
            <div>
              <label className={lblCls}>Folio</label>
              <input value={form.folio} onChange={e => setF("folio", e.target.value.toUpperCase())} placeholder="Ej. T0455" className={inpCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={lblCls}>Cobertura</label>
              <input value={form.cobertura} onChange={e => setF("cobertura", e.target.value.toUpperCase())} placeholder="Ej. TAXI BÁSICA 2500" className={inpCls} />
            </div>
            <div>
              <label className={lblCls}>Forma de pago</label>
              <select value={form.forma_pago} onChange={e => setF("forma_pago", e.target.value)} className={inpCls}>
                {FORMA_PAGO_OPT.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── S2: Vigencia ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SeccionHeader>Vigencia</SeccionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={lblCls}>Fecha de emisión</label>
              <input type="date" value={form.fecha_emision} onChange={e => setF("fecha_emision", e.target.value)} className={inpCls} />
            </div>
            <div>
              <label className={lblCls}>Inicio de vigencia</label>
              <input type="date" value={form.vigencia_inicio} onChange={e => setF("vigencia_inicio", e.target.value)} className={inpCls} />
            </div>
            <div>
              <label className={lblCls}>Fin de vigencia</label>
              <input type="date" value={form.vigencia_fin} onChange={e => setF("vigencia_fin", e.target.value)} className={inpCls} />
            </div>
          </div>
        </div>

        {/* ── S3: Asegurado ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SeccionHeader>Asegurado y vendedor</SeccionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className={lblCls}>Asegurado <span className="text-red-400">*</span></label>
              <input value={form.asegurado_nombre} onChange={e => setF("asegurado_nombre", e.target.value.toUpperCase())} required placeholder="Nombre completo" className={inpCls} />
            </div>
            <div>
              <label className={lblCls}>Teléfono</label>
              <input type="tel" value={form.telefono} onChange={e => setF("telefono", e.target.value)} placeholder="777 000 0000" className={inpCls} />
            </div>
            <div>
              <label className={lblCls}>Vendedor</label>
              <input value={form.vendedor_nombre} onChange={e => setF("vendedor_nombre", e.target.value.toUpperCase())} placeholder="Nombre del vendedor" className={inpCls} />
            </div>
          </div>
        </div>

        {/* ── S4: Vehículo ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SeccionHeader>Vehículo</SeccionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={lblCls}>Placas</label>
              <input value={form.placas} onChange={e => setF("placas", e.target.value.toUpperCase())} placeholder="Ej. ABC-123 o TRÁMITE" className={inpCls} />
            </div>
            <div>
              <label className={lblCls}>Tipo de vehículo</label>
              <select value={form.tipo} onChange={e => setF("tipo", e.target.value)} className={inpCls}>
                {TIPO_OPT.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── S5: Cobro ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SeccionHeader>Montos y cobro</SeccionHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { k: "prima_anual",       label: "Prima T. Anual"   },
              { k: "prima_neta",        label: "Prima Neta Anual" },
              { k: "prima_primer_pago", label: "Prima 1er Pago"   },
              { k: "vale",              label: "Vale ($)"          },
            ].map(f => (
              <div key={f.k}>
                <label className={lblCls}>{f.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={form[f.k]} onChange={e => setF(f.k, e.target.value)} placeholder="0.00" className={inpCls + " pl-7"} />
                </div>
              </div>
            ))}
            {[
              { k: "efectivo",     label: "Efectivo"        },
              { k: "cheque",       label: "Cheque / Dep."   },
              { k: "tdc",          label: "T. Crédito/Déb." },
              { k: "pol_pend_pago",label: "Pól. Pend. Pago" },
            ].map(f => (
              <div key={f.k}>
                <label className={lblCls}>{f.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={form[f.k]} onChange={e => setF(f.k, e.target.value)} placeholder="0.00" className={inpCls + " pl-7"} />
                </div>
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className={lblCls}>Autorización</label>
              <input value={form.autorizacion} onChange={e => setF("autorizacion", e.target.value.toUpperCase())} placeholder="Código de autorización" className={inpCls} />
            </div>
          </div>
        </div>

        {/* ── S6: Documentación ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SeccionHeader>Documentación recibida</SeccionHeader>
          <div className="flex flex-wrap gap-5">
            {[
              { k: "fotos",    label: "Fotos"       },
              { k: "factura",  label: "Factura"     },
              { k: "t_circ",   label: "T. Circulación" },
              { k: "identif",  label: "Identificación" },
              { k: "pol_ant",  label: "Póliza anterior" },
              { k: "otro",     label: "Otro"        },
            ].map(d => (
              <label key={d.k} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${form[d.k] ? "bg-[#13193a] border-[#13193a]" : "border-gray-300 group-hover:border-gray-400"}`}
                  onClick={() => setF(d.k, !form[d.k])}>
                  {form[d.k] && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-600 font-medium select-none">{d.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── S7: Observaciones ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SeccionHeader>Observaciones</SeccionHeader>
          <textarea
            rows={3}
            value={form.observaciones}
            onChange={e => setF("observaciones", e.target.value)}
            placeholder="Notas adicionales, irregularidades, comentarios..."
            className={inpCls + " resize-none"}
          />
        </div>

        {/* ── Acciones ── */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => setVista("lista")}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-50 transition-all shadow-sm shadow-[#13193a]/15">
            {guardando ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Guardando...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Registrar póliza</>
            )}
          </button>
        </div>

      </form>
    </div>
  );

  // ── VISTA LISTA ───────────────────────────────────────────────
  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Pólizas del día</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{oficina}</span>
            <span className="text-xs text-gray-400">{HOY_LABEL}</span>
            <span className="text-xs text-gray-400">{polizas.length} registros</span>
          </div>
        </div>
        <button onClick={handleNueva}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva póliza
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Cargando...
          </div>
        ) : polizas.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
            <p className="text-sm text-gray-400">Sin pólizas registradas hoy.</p>
            <button onClick={handleNueva}
              className="mt-4 flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl bg-[#13193a] text-white text-xs font-semibold hover:bg-[#1e2a50] transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              Registrar primera póliza
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["#","Aseguradora","Póliza","Folio","Asegurado","Vendedor","Cobertura","Forma Pago","1er Pago","Efectivo","F. Emisión",""].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {polizas.map((p, i) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#13193a]">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{p.aseguradora || "—"}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[#13193a]">{p.numero_poliza || "—"}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{p.folio || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[160px] truncate">{p.asegurado_nombre || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.vendedor_nombre || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[130px] truncate">{p.cobertura || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.forma_pago || "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{$(p.prima_primer_pago)}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#13193a]">{$(p.efectivo)}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmt(p.fecha_emision)}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => handleEliminar(p.id)}
                        className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totales */}
              <tfoot>
                <tr className="bg-[#13193a]/5 border-t-2 border-[#13193a]/20">
                  <td colSpan={8} className="px-4 py-3 text-right text-xs font-bold text-[#13193a]">TOTALES</td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-emerald-700">
                    {$(polizas.reduce((s, p) => s + n(p.prima_primer_pago), 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-[#13193a]">
                    {$(polizas.reduce((s, p) => s + n(p.efectivo), 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
