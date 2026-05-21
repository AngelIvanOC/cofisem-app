import { useState, useEffect } from "react";
import { OFICINA } from "./constants/cobertura";
import { fetchPolizas } from "../../services/polizas";
import { fmt$ } from "./utils/fmt";
import Tab from "./components/Tab";
import StatusBadge from "./components/StatusBadge";
import TramiteExitoso from "./components/TramiteExitoso";
import FormCotizacion from "./components/FormCotizacion";

export default function Polizas({ usuario }) {
  const [tab,          setTab]          = useState("polizas");
  const [polizas,      setPolizas]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [busqueda,     setBusqueda]     = useState("");
  const [filtroEst,    setFiltroEst]    = useState("Todos");
  const [cotizaciones, setCotizaciones] = useState([]);
  const [tramiteOk,    setTramiteOk]    = useState(null);
  const [cotActiva,    setCotActiva]    = useState(null);

  const cargar = async () => {
    try {
      setLoading(true);
      setPolizas(await fetchPolizas());
      setError(null);
    } catch (e) {
      setError("Error cargando pólizas: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const ESTATUS_OPTS = ["Todos","VIGENTE","POR VENCER","VENCIDA","CANCELADA"];

  const polizasFiltradas = polizas.filter(p => {
    const asegurado = `${p.clientes?.nombre || ""} ${p.clientes?.apellido || ""}`.toLowerCase();
    const constancia = (p.constancia || p.numero_poliza || "").toLowerCase();
    const matchBusq = asegurado.includes(busqueda.toLowerCase()) || constancia.includes(busqueda.toLowerCase());
    const matchEst  = filtroEst === "Todos" || p.estatus === filtroEst;
    return matchBusq && matchEst;
  });

  const guardarCotizacion = (cot) => {
    setCotizaciones(cs => [{ ...cot, guardada: true }, ...cs.filter(c => c.id !== cot.id)]);
    setTab("cotizaciones");
  };

  const tramitarPoliza = async (poliza) => {
    setTramiteOk(poliza);
    setTab("exito");
    await cargar();
  };

  const abrirCotizacionGuardada = (cot) => { setCotActiva(cot); setTab("nueva"); };

  if (tab === "exito" && tramiteOk) {
    return (
      <div className="p-6 min-h-full bg-gray-50">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <TramiteExitoso
            poliza={tramiteOk}
            onNueva={() => { setTramiteOk(null); setCotActiva(null); setTab("nueva"); }}
            onVolver={() => { setTramiteOk(null); setTab("polizas"); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
          <p className="text-gray-400 text-sm mt-0.5">{OFICINA.nombre}</p>
        </div>
        <button onClick={() => { setCotActiva(null); setTab("nueva"); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva cotización
        </button>
      </div>

      {tab === "nueva" && (
        <FormCotizacion
          cotizacionInicial={cotActiva}
          onGuardar={guardarCotizacion}
          onTramitar={tramitarPoliza}
          onCancelar={() => { setCotActiva(null); setTab("polizas"); }}
          usuario={usuario}
        />
      )}

      {(tab === "polizas" || tab === "cotizaciones") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center border-b border-gray-100 px-2 overflow-x-auto">
            <Tab active={tab === "polizas"} onClick={() => setTab("polizas")}>Pólizas emitidas</Tab>
            <Tab active={tab === "cotizaciones"} onClick={() => setTab("cotizaciones")}>
              Cotizaciones guardadas
              {cotizaciones.length > 0 && (
                <span className="ml-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cotizaciones.length}
                </span>
              )}
            </Tab>
          </div>

          {tab === "polizas" && (
            <>
              {error && (
                <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
              )}
              <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-gray-100">
                <div className="relative">
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar póliza o asegurado..."
                    className="pl-9 pr-4 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] w-56 bg-white" />
                </div>
                <select value={filtroEst} onChange={e => setFiltroEst(e.target.value)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 text-gray-600 bg-white focus:outline-none">
                  {ESTATUS_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {["Constancia","Asegurado","Cobertura","Vendedor","Prima","Forma pago","Vence","Estatus"].map(h => (
                        <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={8} className="text-center py-12 text-sm text-gray-400">Cargando pólizas...</td></tr>
                    ) : polizasFiltradas.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-12 text-sm text-gray-400">No se encontraron pólizas.</td></tr>
                    ) : polizasFiltradas.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-[#13193a]">{p.constancia || p.numero_poliza}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                          {p.clientes?.nombre} {p.clientes?.apellido || ""}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{p.cobertura}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {p.vendedores?.nombre} {p.vendedores?.apellido || ""}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-emerald-700">{fmt$(p.prima_total)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.forma_pago}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.fecha_fin}</td>
                        <td className="px-4 py-3"><StatusBadge estatus={p.estatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "cotizaciones" && (
            cotizaciones.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">No hay cotizaciones guardadas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {["No. Cotización","Cliente","Cobertura","Vendedor","Total","Fecha",""].map(h => (
                        <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cotizaciones.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">{c.id}</td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">{c.cliente}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate">{c.cobertura}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{c.vendedor}</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-emerald-700">{fmt$(c.total)}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">{c.fecha}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => abrirCotizacionGuardada(c)}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Tramitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
