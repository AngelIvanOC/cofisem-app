import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";

const OFICINAS_DEFAULT = ["Todas"];
const FORMAS           = ["Todas", "CONTADO", "4 PARCIALES"];

const STATUS_CLS = {
  ADEUDO: "bg-amber-50   text-amber-700   border-amber-200",
  PAGADO: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function isoAMX(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

export default function AnalistaPagos({ usuario }) {
  const [pagos,         setPagos]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [oficinas,      setOficinas]      = useState(OFICINAS_DEFAULT);
  const [busqueda,      setBusqueda]      = useState("");
  const [filtroOficina, setFiltroOficina] = useState("Todas");
  const [filtroForma,   setFiltroForma]   = useState("Todas");
  const [filtroEst,     setFiltroEst]     = useState("ADEUDO");
  const [procesando,    setProcesando]    = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data: pagosDB, error: e1 } = await supabase
        .from('pagos')
        .select(`
          id, poliza_id, monto, fecha_pago, estatus,
          operador:usuarios!pagos_recibido_por_fkey(nombre, apellido, id_muestra),
          polizas(
            constancia, numero_poliza, forma_pago,
            clientes(nombre, apellido),
            oficinas(nombre)
          )
        `)
        .in('estatus', ['ADEUDO', 'PAGADO'])
        .order('created_at', { ascending: false });

      if (e1) throw e1;

      const polizaIds = [...new Set((pagosDB ?? []).map(p => p.poliza_id))];
      let indexMap = {};
      if (polizaIds.length > 0) {
        const { data: todosDB } = await supabase
          .from('pagos')
          .select('id, poliza_id, fecha_vencimiento')
          .in('poliza_id', polizaIds)
          .order('fecha_vencimiento', { ascending: true });
        for (const p of (todosDB ?? [])) {
          if (!indexMap[p.poliza_id]) indexMap[p.poliza_id] = [];
          indexMap[p.poliza_id].push(p.id);
        }
      }

      const rowsBuilt = (pagosDB ?? []).map(a => {
        const siblings = indexMap[a.poliza_id] ?? [a.id];
        const pol      = a.polizas;
        const op       = a.operador;
        return {
          id:            a.id,
          poliza:        pol?.constancia ?? pol?.numero_poliza ?? String(a.poliza_id),
          asegurado:     [pol?.clientes?.nombre, pol?.clientes?.apellido].filter(Boolean).join(' '),
          oficina:       pol?.oficinas?.nombre ?? '',
          formaPago:     pol?.forma_pago ?? '',
          cuota:         `${siblings.indexOf(a.id) + 1}/${siblings.length}`,
          monto:         Number(a.monto),
          fecha:         a.fecha_pago ? isoAMX(a.fecha_pago) : '—',
          solicitadoPor: op ? `${op.nombre ?? ''} ${op.apellido ?? ''}`.trim() || `OP-${op.id_muestra}` : '—',
          estatus:       a.estatus,
        };
      });

      const oficinasSet = [...new Set(rowsBuilt.map(r => r.oficina).filter(Boolean))];
      setOficinas(["Todas", ...oficinasSet]);
      setPagos(rowsBuilt);
    } catch (err) {
      console.error('Error cargando pagos analista:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const aplicar = async (id) => {
    setProcesando(id);
    try {
      const { error } = await supabase.from('pagos').update({
        estatus:      'PAGADO',
        aplicado_por: usuario?.id ?? null,
      }).eq('id', id);
      if (error) throw error;
      await cargar();
    } catch (e) {
      alert("Error al aplicar pago: " + e.message);
    } finally {
      setProcesando(null);
    }
  };

  const porAplicar   = pagos.filter(p => p.estatus === 'ADEUDO');
  const aplicados    = pagos.filter(p => p.estatus === 'PAGADO');
  const montoPend    = porAplicar.reduce((s, p) => s + p.monto, 0);
  const montoAplic   = aplicados.reduce((s, p) => s + p.monto, 0);

  const filtrados = pagos.filter(p => {
    const mb = p.poliza.toLowerCase().includes(busqueda.toLowerCase())
      || p.asegurado.toLowerCase().includes(busqueda.toLowerCase());
    const mo = filtroOficina === "Todas"  || p.oficina   === filtroOficina;
    const mf = filtroForma   === "Todas"  || p.formaPago === filtroForma;
    const me = filtroEst     === "Todos"  || p.estatus   === filtroEst;
    return mb && mo && mf && me;
  });

  const selCls = "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pagos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Aplicación de pagos confirmados por operador</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l:"Por aplicar",    v: porAplicar.length,                                                            a:"blue",    f:"ADEUDO" },
          { l:"Monto pendiente",v:`$${montoPend.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,         a:"amber",   f:"ADEUDO" },
          { l:"Aplicados",      v: aplicados.length,                                                             a:"emerald", f:"PAGADO" },
          { l:"Monto aplicado", v:`$${montoAplic.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,        a:"gray",    f:"PAGADO" },
        ].map(m => {
          const c = {
            blue:   "bg-blue-50 border-blue-200 text-blue-700",
            amber:  "bg-amber-50 border-amber-200 text-amber-700",
            emerald:"bg-emerald-50 border-emerald-200 text-emerald-700",
            gray:   "bg-gray-100 border-gray-200 text-gray-600",
          };
          return (
            <button key={m.l} onClick={() => setFiltroEst(m.f)}
              className={`${c[m.a]} border rounded-2xl p-4 text-left hover:shadow-sm transition-all`}>
              <p className="text-2xl font-bold tabular-nums">{m.v}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.l}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Póliza o asegurado..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"/>
          </div>
          <select value={filtroOficina} onChange={e => setFiltroOficina(e.target.value)} className={selCls}>
            {oficinas.map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={filtroForma} onChange={e => setFiltroForma(e.target.value)} className={selCls}>
            {FORMAS.map(f => <option key={f}>{f}</option>)}
          </select>
          <select value={filtroEst} onChange={e => setFiltroEst(e.target.value)} className={selCls}>
            {["Todos", "ADEUDO", "PAGADO"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Póliza","Asegurado","Oficina","Forma pago","Cuota","Monto","Fecha","Solicitado por","Estatus","Acciones"].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-sm text-gray-400">Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-sm text-gray-400">No hay pagos con esos filtros.</td></tr>
              ) : filtrados.map((p, i) => (
                <tr key={i} className={`hover:bg-gray-50/60 transition-colors ${p.estatus === "ADEUDO" ? "bg-blue-50/20" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#13193a]">{p.poliza}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">{p.asegurado}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-24 truncate">{p.oficina}</td>
                  <td className="px-4 py-3"><span className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-medium">{p.formaPago || "—"}</span></td>
                  <td className="px-4 py-3 text-xs text-center text-gray-500 font-mono">{p.cuota}</td>
                  <td className="px-4 py-3 text-xs font-bold text-emerald-700">${p.monto.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.fecha}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.solicitadoPor}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[p.estatus] ?? STATUS_CLS.ADEUDO}`}>
                      {p.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.estatus === "ADEUDO" && (
                      <button onClick={() => aplicar(p.id)} disabled={procesando === p.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all disabled:opacity-50">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        {procesando === p.id ? "..." : "Aplicar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{filtrados.length} registros</p>
        </div>
      </div>
    </div>
  );
}
