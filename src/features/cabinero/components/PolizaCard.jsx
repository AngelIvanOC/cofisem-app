import DatoCard from "./DatoCard";

export default function PolizaCard({ poliza, onConfirmar, onLimpiar }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-[#13193a]/15 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#13193a] px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
              Póliza encontrada · Vigente
            </span>
            <p className="text-white text-lg font-bold font-mono leading-none">{poliza.numero}</p>
            <p className="text-white/60 text-sm mt-1.5 leading-snug max-w-md">{poliza.titular}</p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-white/40 text-xs">Prima total</p>
            <p className="text-white text-2xl font-bold">{poliza.prima}</p>
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-5 space-y-5">
        {poliza.siniestros.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              Siniestros relacionados a este certificado
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-amber-200">
                  {["# Reporte", "# Folio", "Fecha", "Ajustador", "Estatus"].map((h) => (
                    <th key={h} className="text-left pb-2 text-amber-600 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {poliza.siniestros.map((s, i) => (
                  <tr key={i}>
                    <td className="py-1.5 font-mono text-amber-800 font-semibold">{s.reporte}</td>
                    <td className="py-1.5 font-mono text-amber-800">{s.folio}</td>
                    <td className="py-1.5 text-amber-700">{s.fecha}</td>
                    <td className="py-1.5 text-amber-700">{s.ajustador}</td>
                    <td className="py-1.5">
                      <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        {s.estatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <DatoCard label="Agencia"        value={poliza.agencia} />
          <DatoCard label="Vigencia desde" value={poliza.vigenciaDesde} />
          <DatoCard label="Vigencia hasta" value={poliza.vigenciaHasta} />
          <DatoCard label="Saldo"          value={poliza.saldo} highlight />
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Cuotas de Pago</p>
          <div className="grid grid-cols-4 gap-2">
            {poliza.cuotas.map((c) => (
              <div key={c.num} className="bg-white rounded-xl border border-gray-100 p-2.5 text-center">
                <p className="text-[10px] text-gray-400 mb-1">Cuota {c.num}</p>
                <p className="text-sm font-bold text-[#13193a]">{c.monto}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 mb-1.5">{c.vto}</p>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {c.estatus}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vehículo Asegurado</p>
          <p className="text-sm font-bold text-[#13193a] mb-3">{poliza.vehiculo.descripcion}</p>
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { k: "Modelo", v: poliza.vehiculo.modelo    },
              { k: "Placas", v: poliza.vehiculo.placas    },
              { k: "Serie",  v: poliza.vehiculo.serie     },
              { k: "Motor",  v: poliza.vehiculo.motor     },
              { k: "Capac.", v: poliza.vehiculo.capacidad },
            ].map((f) => (
              <DatoCard key={f.k} label={f.k} value={f.v} mono={f.k === "Serie"} />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Coberturas</p>
            <p className="text-sm font-bold text-[#13193a] mt-0.5">{poliza.cobertura}</p>
          </div>
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#13193a]">
                  <th className="text-left  px-4 py-2.5 font-semibold text-white">Descripción</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-white">Monto Máx.</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-white hidden sm:table-cell">% Ded.</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-white hidden sm:table-cell">Imp. Ded.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {poliza.coberturas.map((c, i) => (
                  <tr key={i} className={c.sub ? "bg-gray-50/60" : "hover:bg-gray-50"}>
                    <td className={`px-4 py-2.5 ${c.sub ? "text-gray-400 pl-7" : "text-gray-700 font-medium"}`}>{c.desc}</td>
                    <td className={`px-4 py-2.5 text-right ${c.sub ? "text-gray-400" : "font-semibold text-[#13193a]"}`}>{c.monto}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400 hidden sm:table-cell">{c.ded}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400 hidden sm:table-cell">{c.imp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="px-5 pb-5 pt-1 flex gap-3">
        <button
          onClick={onLimpiar}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
        >
          Buscar otra póliza
        </button>
        <button
          onClick={onConfirmar}
          className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#13193a]/15"
        >
          Continuar con esta póliza
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
