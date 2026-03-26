// ============================================================
// src/features/operador/polizas/Comparador.jsx
// Comparador de hasta 3 coberturas lado a lado
// ============================================================
import { useState } from "react";
import { COBERTURAS_CATALOGO, TIPOS_COBERTURA } from "../../../shared/constants/coberturas";

const COBERTURAS_COMUNES = [
  "Resp. Civil a Terceros Bienes y Personas",
  "Resp. Civil Complementaria Personas",
  "Gastos Médicos Conductor y Familiares",
  "Muerte de Conductor x/AA",
  "Gastos Legales",
  "Resp. Civil Viajero",
];

export default function Comparador({ onCerrar, onSeleccionar }) {
  const [seleccion, setSeleccion] = useState([TIPOS_COBERTURA[0], TIPOS_COBERTURA[1]]);

  const toggle = (tipo) => {
    if (seleccion.includes(tipo)) {
      if (seleccion.length > 1) setSeleccion((s) => s.filter((t) => t !== tipo));
    } else {
      if (seleccion.length < 3) setSeleccion((s) => [...s, tipo]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#13193a]">Comparar coberturas</h2>
          <p className="text-sm text-gray-400 mt-0.5">Selecciona hasta 3 coberturas para comparar</p>
        </div>
        <button onClick={onCerrar} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Volver
        </button>
      </div>

      {/* Selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TIPOS_COBERTURA.map((t) => (
          <button
            key={t}
            onClick={() => toggle(t)}
            className={[
              "px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all",
              seleccion.includes(t)
                ? "bg-[#13193a] text-white border-[#13193a]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
        <p className="text-xs text-gray-400 self-center ml-2">({seleccion.length}/3 seleccionadas)</p>
      </div>

      {/* Tabla comparativa */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#13193a]">
                <th className="text-left px-4 py-3 font-semibold text-white">Cobertura</th>
                {seleccion.map((s) => (
                  <th key={s} className="text-right px-4 py-3 font-semibold text-white whitespace-nowrap">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* Totales destacados */}
              <tr className="bg-blue-50">
                <td className="px-4 py-3 font-bold text-[#13193a]">Total a pagar</td>
                {seleccion.map((s) => (
                  <td key={s} className="px-4 py-3 text-right font-bold text-[#13193a] text-sm">
                    ${COBERTURAS_CATALOGO[s].total.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50/60">
                <td className="px-4 py-3 font-semibold text-gray-600">Prima neta</td>
                {seleccion.map((s) => (
                  <td key={s} className="px-4 py-3 text-right font-semibold text-gray-700">
                    ${COBERTURAS_CATALOGO[s].primaNeta.toFixed(2)}
                  </td>
                ))}
              </tr>
              {/* Coberturas individuales */}
              {COBERTURAS_COMUNES.map((desc) => (
                <tr key={desc} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-600">{desc}</td>
                  {seleccion.map((s) => {
                    const cob = COBERTURAS_CATALOGO[s].coberturas.find((c) => c.desc === desc);
                    return (
                      <td key={s} className="px-4 py-3 text-right text-gray-700">
                        {cob ? cob.monto : <span className="text-gray-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botones de selección */}
      <div className="flex gap-3 mt-5">
        {seleccion.map((s) => (
          <button
            key={s}
            onClick={() => onSeleccionar(s)}
            className="flex-1 py-2.5 rounded-xl border-2 border-[#13193a] text-sm font-bold text-[#13193a] hover:bg-[#13193a]/5 transition-all"
          >
            Cotizar con "{s}"
          </button>
        ))}
      </div>
    </div>
  );
}
