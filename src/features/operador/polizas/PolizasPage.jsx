// ============================================================
// src/features/operador/polizas/PolizasPage.jsx
// Orquestador de pólizas: tabs + estado de vista activa
// Gestiona: lista de pólizas, cotizaciones guardadas,
// nueva cotización, comparador y confirmación de trámite
// ============================================================
import { useState } from "react";
import { TablaTabs } from "../../../shared/ui/TablaBase";
import { TablaPolizas, TablaCotizaciones } from "./TablaPolizas";
import FormCotizacion from "./FormCotizacion";
import Comparador from "./Comparador";
import { COTIZACIONES_MOCK } from "../../../shared/constants/mockData";

// ── Pantalla de éxito post-trámite ────────────────────────────
function TramiteExitoso({ cotizacion, onNueva, onVolver }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#13193a] mb-2">¡Póliza tramitada!</h2>
      <p className="text-gray-400 text-sm mb-1">
        La cotización <span className="font-mono font-bold text-[#13193a]">{cotizacion.id}</span> fue tramitada exitosamente.
      </p>
      <p className="text-gray-400 text-sm mb-8">
        Cliente: <strong className="text-gray-600">{cotizacion.cliente}</strong>
      </p>
      <div className="flex gap-3">
        <button onClick={onVolver} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          Ver pólizas
        </button>
        <button onClick={onNueva} className="px-6 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50]">
          Nueva cotización
        </button>
      </div>
    </div>
  );
}

const TABS = [
  { key: "polizas",      label: "Pólizas emitidas"     },
  { key: "cotizaciones", label: "Cotizaciones guardadas" },
];

export default function PolizasPage({ usuario }) {
  const [vista,        setVista]        = useState("polizas");  // polizas | cotizaciones | nueva | comparar | exito
  const [cotizaciones, setCotizaciones] = useState(COTIZACIONES_MOCK);
  const [cotActiva,    setCotActiva]    = useState(null);
  const [tramiteOk,    setTramiteOk]    = useState(null);

  const guardarCotizacion = (cot) => {
    setCotizaciones((cs) => [{ ...cot, guardada: true }, ...cs.filter((c) => c.id !== cot.id)]);
    setVista("cotizaciones");
  };

  const tramitarPoliza = (cot) => {
    setTramiteOk(cot);
    setVista("exito");
  };

  const abrirCotizacion = (cot) => {
    setCotActiva(cot);
    setVista("nueva");
  };

  // ── Vista de éxito ───────────────────────────────────────
  if (vista === "exito" && tramiteOk) {
    return (
      <div className="p-6 min-h-full bg-gray-50">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <TramiteExitoso
            cotizacion={tramiteOk}
            onNueva={() => { setTramiteOk(null); setCotActiva(null); setVista("nueva"); }}
            onVolver={() => { setTramiteOk(null); setVista("polizas"); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {usuario?.oficina ?? "COFISEM AV. E.ZAPATA"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVista("comparar")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z"/></svg>
            Comparar
          </button>
          <button
            onClick={() => { setCotActiva(null); setVista("nueva"); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Nueva cotización
          </button>
        </div>
      </div>

      {/* ── Comparador ── */}
      {vista === "comparar" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Comparador
            onCerrar={() => setVista("polizas")}
            onSeleccionar={(tipo) => { setCotActiva({ cobertura: tipo }); setVista("nueva"); }}
          />
        </div>
      )}

      {/* ── Nueva cotización / editar guardada ── */}
      {vista === "nueva" && (
        <FormCotizacion
          cotizacionInicial={cotActiva}
          onGuardar={guardarCotizacion}
          onTramitar={tramitarPoliza}
          onCancelar={() => { setCotActiva(null); setVista("polizas"); }}
        />
      )}

      {/* ── Tabs de lista ── */}
      {(vista === "polizas" || vista === "cotizaciones") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <TablaTabs
            tabs={[
              ...TABS.slice(0, 1),
              { key: "cotizaciones", label: "Cotizaciones guardadas", badge: cotizaciones.length, badgeCls: "bg-amber-100 text-amber-700" },
            ]}
            activeTab={vista}
            onTabChange={setVista}
          />
          {vista === "polizas" && (
            <TablaPolizas
              onDetalle={(p) => console.log("detalle", p)}
              onRenovar={(p) => console.log("renovar", p)}
            />
          )}
          {vista === "cotizaciones" && (
            <TablaCotizaciones cotizaciones={cotizaciones} onTramitar={abrirCotizacion} />
          )}
        </div>
      )}
    </div>
  );
}
