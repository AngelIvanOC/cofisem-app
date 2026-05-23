import { useState, useEffect } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import { fetchPolizas, fetchPolizaById, buildPolizaPDF, cancelarPoliza } from "../../services/polizas";
import Swal from "sweetalert2";
import { pdf } from "@react-pdf/renderer";
import EndosoCancelacionPDF from "../../components/pdf/EndosoCancelacionPDF";
import { generateQR } from "../../utils/generateQR";
import { fmt$ } from "./utils/fmt";
import Tab from "./components/Tab";
import StatusBadge from "./components/StatusBadge";
import TramiteExitoso from "./components/TramiteExitoso";
import FormCotizacion from "./components/FormCotizacion";
import ResumenPoliza from "./components/ResumenPoliza";
import PolizaPDF from "../../components/pdf/PolizaPDF";

export default function Polizas({ usuario }) {
  const [tab,          setTab]          = useState("polizas");
  const [polizas,      setPolizas]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [busqueda,     setBusqueda]     = useState("");
  const [filtroEst,    setFiltroEst]    = useState("Todos");
  const [cotizaciones,    setCotizaciones]    = useState([]);
  const [tramiteOk,       setTramiteOk]       = useState(null);
  const [cotActiva,       setCotActiva]       = useState(null);
  const [polizaViewer,    setPolizaViewer]    = useState(null);
  const [loadingViewerId, setLoadingViewerId] = useState(null);
  const [resumenData,     setResumenData]     = useState(null);
  const [menuAbierto,     setMenuAbierto]     = useState(null);
  const [modalCancelar,   setModalCancelar]   = useState(null);
  const [motivoCancel,    setMotivoCancel]    = useState("");
  const [cancelando,      setCancelando]      = useState(false);

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

  useEffect(() => {
    if (!menuAbierto) return;
    const cerrar = () => setMenuAbierto(null);
    document.addEventListener("click", cerrar);
    return () => document.removeEventListener("click", cerrar);
  }, [menuAbierto]);

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

  const abrirResumen = async (p) => {
    setTab("resumen");
    setResumenData(null);
    try {
      const full = await fetchPolizaById(p.id);
      setResumenData(full);
    } catch (e) {
      console.error(e);
      setTab("polizas");
    }
  };

  const verPDF = async (p) => {
    setLoadingViewerId(p.id);
    try {
      const full      = await fetchPolizaById(p.id);
      const base      = buildPolizaPDF(full, usuario?.oficinas);
      const qrDataUrl = await generateQR(base.codigoQR);
      setPolizaViewer({ ...base, qrDataUrl });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingViewerId(null);
    }
  };

  if (tab === "exito" && tramiteOk) {
    return (
      <div className="p-6 min-h-full bg-gray-50">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <TramiteExitoso
            poliza={tramiteOk}
            oficina={usuario?.oficinas}
            onNueva={() => { setTramiteOk(null); setCotActiva(null); setTab("nueva"); }}
            onVolver={() => { setTramiteOk(null); setTab("polizas"); }}
          />
        </div>
      </div>
    );
  }

  if (tab === "resumen") {
    return (
      <div className="p-6 min-h-full bg-gray-50">
        {resumenData ? (
          <ResumenPoliza
            poliza={resumenData}
            onVolver={() => { setResumenData(null); setTab("polizas"); }}
          />
        ) : (
          <div className="flex items-center justify-center py-24">
            <svg className="w-8 h-8 animate-spin text-[#13193a]/30" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
          <p className="text-gray-400 text-sm mt-0.5">{usuario?.oficinas?.nombre ?? "—"}</p>
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
                      {["Constancia","Asegurado","Cobertura","Vendedor","Prima","Forma pago","Vence","Estatus","",""].map((h, i) => (
                        <th key={i} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={10} className="text-center py-12 text-sm text-gray-400">Cargando pólizas...</td></tr>
                    ) : polizasFiltradas.length === 0 ? (
                      <tr><td colSpan={10} className="text-center py-12 text-sm text-gray-400">No se encontraron pólizas.</td></tr>
                    ) : polizasFiltradas.map(p => (
                      <tr
                        key={p.id}
                        onClick={() => abrirResumen(p)}
                        className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                      >
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
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => verPDF(p)}
                            disabled={loadingViewerId === p.id}
                            className="flex items-center gap-1 text-xs font-semibold text-[#13193a] border border-[#13193a]/20 px-2.5 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all disabled:opacity-40 whitespace-nowrap"
                          >
                            {loadingViewerId === p.id ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                            Ver PDF
                          </button>
                        </td>
                        <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                          <div className="relative flex justify-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === p.id ? null : p.id); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="12" cy="19" r="1.5" />
                              </svg>
                            </button>
                            {menuAbierto === p.id && (
                              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden min-w-[130px]">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setMenuAbierto(null); }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                  </svg>
                                  Editar
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setMenuAbierto(null); setMotivoCancel(""); setModalCancelar(p); }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors border-t border-gray-50"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
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

      {modalCancelar && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setModalCancelar(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-base font-bold text-[#13193a]">Cancelar póliza</p>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{modalCancelar.constancia || modalCancelar.numero_poliza}</p>
              </div>
              <button
                onClick={() => setModalCancelar(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex gap-3">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-red-700">
                  Esta acción cancelará la póliza. Por favor indica el motivo de la cancelación.
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Motivo de cancelación
                </label>
                <textarea
                  value={motivoCancel}
                  onChange={e => setMotivoCancel(e.target.value)}
                  placeholder="Describe el motivo de la cancelación..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setModalCancelar(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cerrar
              </button>
              <button
                disabled={cancelando}
                onClick={async () => {
                  setCancelando(true);
                  const constanciaLabel = modalCancelar.constancia || modalCancelar.numero_poliza;
                  try {
                    // 1. Obtener póliza completa para el PDF
                    const polizaCompleta = await fetchPolizaById(modalCancelar.id);
                    const polizaPDF = buildPolizaPDF(polizaCompleta, usuario?.oficinas);

                    // 2. Fecha del endoso = hoy en DD/MM/YYYY
                    const fechaEndoso = new Date().toLocaleDateString("es-MX", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    });

                    // 3. Generar y descargar PDF del endoso
                    const blob = await pdf(
                      <EndosoCancelacionPDF
                        poliza={polizaPDF}
                        motivo={motivoCancel}
                        fechaEndoso={fechaEndoso}
                      />
                    ).toBlob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `ENDOSO_CANCELACION-${constanciaLabel}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);

                    // 4. Cancelar en BD
                    await cancelarPoliza(modalCancelar.id, motivoCancel, usuario?.id);
                    setModalCancelar(null);
                    setMotivoCancel("");
                    await cargar();

                    Swal.fire({
                      icon: "success",
                      title: "Póliza cancelada",
                      text: `La póliza ${constanciaLabel} fue cancelada y se descargó el endoso.`,
                      confirmButtonColor: "#13193a",
                      confirmButtonText: "Aceptar",
                      timer: 5000,
                      timerProgressBar: true,
                    });
                  } catch (e) {
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: "No se pudo cancelar la póliza: " + e.message,
                      confirmButtonColor: "#13193a",
                    });
                  } finally {
                    setCancelando(false);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all shadow-sm shadow-red-600/20 disabled:opacity-50"
              >
                {cancelando ? "Cancelando..." : "Cancelar póliza"}
              </button>
            </div>
          </div>
        </div>
      )}

      {polizaViewer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <span className="text-sm font-bold text-[#13193a]">Vista previa de póliza</span>
              <button
                onClick={() => setPolizaViewer(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
                <PolizaPDF poliza={polizaViewer} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
