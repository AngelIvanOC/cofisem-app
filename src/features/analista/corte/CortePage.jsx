// ============================================================
// src/features/analista/corte/CortePage.jsx
// Analista: Visualización de corte diario — solo lectura
// Solo datos de pólizas, SIN datos de cobros/pagos
// ============================================================
import { useState } from "react";
import { FiltroSelect } from "../../../shared/ui/Buscador";
import { OFICINAS } from "../../../shared/constants/oficinas";

const CORTES_MOCK = {
  "COFISEM AV. E.ZAPATA": {
    fecha: "17/03/2026",
    generadoPor: "Laura Rosher",
    cerrado: true,
    polizas: [
      {
        no: 1,
        aseguradora: "QUALITAS",
        poliza: "3413198",
        fechaEmision: "17/03/2026",
        folio: "T0312",
        vendedor: "MARCO A. CRUZ",
        asegurado: "María García López",
        vale: 0,
        primaAnual: 5500.0,
        primaNeta: 4200.0,
        primerPago: 2200.0,
        cobertura: "TAXI BÁSICA 2500",
        placas: "VRM-123A",
        uso: "TAXI",
        tipo: "COCHE",
        noPago: 1,
        formaPago: "CONTADO",
        observaciones: "",
      },
      {
        no: 2,
        aseguradora: "GNP",
        poliza: "3413167",
        fechaEmision: "17/03/2026",
        folio: "T0455",
        vendedor: "LAURA ROSHER",
        asegurado: "Roberto Díaz Ramos",
        vale: 220,
        primaAnual: 6200.0,
        primaNeta: 4900.0,
        primerPago: 637.0,
        cobertura: "SERV. PÚB. 50/50 GAMAN 2",
        placas: "CHM-456B",
        uso: "TAXI",
        tipo: "COCHE",
        noPago: 1,
        formaPago: "4 PARCIALES",
        observaciones: "",
      },
    ],
  },
  "OFICINA CIVAC": {
    fecha: "17/03/2026",
    generadoPor: "Marco Antonio",
    cerrado: true,
    polizas: [
      {
        no: 1,
        aseguradora: "QUALITAS",
        poliza: "3413241",
        fechaEmision: "13/03/2026",
        folio: "T0455",
        vendedor: "LAURA ROSHER",
        asegurado: "Angel Ivan Ortega",
        vale: 400,
        primaAnual: 8385.69,
        primaNeta: 6318.92,
        primerPago: 2679.33,
        cobertura: "COBERTURA APP (UBER, DIDI)",
        placas: "TRAMITE",
        uso: "DIDI",
        tipo: "COCHE",
        noPago: 1,
        formaPago: "TRIMESTRAL",
        observaciones: "COMISION PAGADA POLIZA 960972454",
      },
    ],
  },
  "COFISEM TEMIXCO": {
    fecha: "17/03/2026",
    generadoPor: "Carlos Soto",
    cerrado: false,
    polizas: [
      {
        no: 1,
        aseguradora: "QUALITAS",
        poliza: "3414001",
        fechaEmision: "17/03/2026",
        folio: "T0455",
        vendedor: "LAURA ROSHER",
        asegurado: "Pedro Ramos Salinas",
        vale: 0,
        primaAnual: 6200.0,
        primaNeta: 4900.0,
        primerPago: 2548.0,
        cobertura: "SERV. PÚB. 50/50 GAMAN 2",
        placas: "BCD-111G",
        uso: "TAXI",
        tipo: "COCHE",
        noPago: 1,
        formaPago: "CONTADO",
        observaciones: "Enviada por operadora CIVAC",
      },
    ],
  },
  "COFISEM CUAUTLA": {
    fecha: "17/03/2026",
    generadoPor: "Patricia Morales",
    cerrado: true,
    polizas: [],
  },
};

const HEADERS = [
  "No.",
  "Aseguradora",
  "Póliza",
  "F. Emisión",
  "Folio",
  "Vendedor",
  "Asegurado",
  "Vale $",
  "Prima T. Anual",
  "Prima Neta Anual",
  "Prima 1er Pago",
  "Cobertura",
  "Placas",
  "Uso",
  "Tipo",
  "No. Pago",
  "Forma Pago",
  "Observaciones",
];

export default function AnalistaCorte() {
  const [oficinaSel, setOficinaSel] = useState(OFICINAS[0]);
  const corte = CORTES_MOCK[oficinaSel];

  const totalVales = corte.polizas.reduce((s, p) => s + p.vale, 0);
  const totalAnual = corte.polizas.reduce((s, p) => s + p.primaAnual, 0);
  const totalNeta = corte.polizas.reduce((s, p) => s + p.primaNeta, 0);
  const totalPrimerPago = corte.polizas.reduce((s, p) => s + p.primerPago, 0);

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">
          Corte Diario por Oficina
        </h1>
        <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-2">
          Consulta de pólizas emitidas
          <span className="inline-flex items-center text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
            Solo pólizas · Sin datos de cobro
          </span>
        </p>
      </div>

      {/* Selectores */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Oficina
            </label>
            <FiltroSelect
              value={oficinaSel}
              onChange={setOficinaSel}
              opciones={OFICINAS}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Fecha de corte
            </label>
            <input
              type="date"
              defaultValue="2026-03-17"
              readOnly
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Banner estado del corte */}
      <div
        className={`rounded-2xl border p-4 flex items-center gap-4 flex-wrap ${corte.cerrado ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${corte.cerrado ? "bg-emerald-500" : "bg-amber-500"}`}
        >
          {corte.cerrado ? (
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-bold ${corte.cerrado ? "text-emerald-800" : "text-amber-800"}`}
          >
            {corte.cerrado ? "Corte cerrado" : "Corte en proceso"}
          </p>
          <p
            className={`text-xs mt-0.5 ${corte.cerrado ? "text-emerald-600" : "text-amber-600"}`}
          >
            {oficinaSel} · {corte.fecha} · Generado por:{" "}
            <strong>{corte.generadoPor}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: "Pólizas", value: corte.polizas.length },
            { label: "1er pago", value: `$${totalPrimerPago.toFixed(2)}` },
            { label: "Prima anual", value: `$${totalAnual.toFixed(2)}` },
          ].map((k) => (
            <div
              key={k.label}
              className="text-center px-4 py-2 bg-white/60 rounded-xl border border-white/80"
            >
              <p className="text-sm font-bold text-[#13193a]">{k.value}</p>
              <p className="text-[10px] text-gray-500">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de pólizas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-[#13193a]">
          <p className="text-sm font-bold text-white">Pólizas emitidas</p>
          <span className="text-white/50 text-xs">·</span>
          <span className="text-white/50 text-xs">
            {corte.polizas.length} registros
          </span>
          <div className="ml-auto flex items-center gap-1.5 text-[11px] bg-white/10 text-white/70 px-3 py-1 rounded-full border border-white/20">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Solo lectura
          </div>
        </div>

        {corte.polizas.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            Sin pólizas registradas en este corte.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="text-xs"
              style={{ minWidth: "1100px", width: "100%" }}
            >
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {HEADERS.map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide px-3 py-2.5 border-r border-gray-100 last:border-r-0 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {corte.polizas.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-[#13193a]">
                      {p.no}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-700">
                      {p.aseguradora}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-[#13193a]">
                      {p.poliza}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {p.fechaEmision}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-600">
                      {p.folio}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                      {p.vendedor}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                      {p.asegurado}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-700">
                      {p.vale > 0 ? `$${p.vale.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[#13193a]">
                      ${p.primaAnual.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-700">
                      ${p.primaNeta.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                      ${p.primerPago.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-40 truncate">
                      {p.cobertura}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-600">
                      {p.placas}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{p.uso}</td>
                    <td className="px-3 py-2.5 text-gray-600">{p.tipo}</td>
                    <td className="px-3 py-2.5 text-center text-gray-600">
                      {p.noPago}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {p.formaPago}
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 max-w-40 truncate">
                      {p.observaciones || "—"}
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#13193a]/5 font-bold border-t-2 border-[#13193a]/20">
                  <td
                    colSpan={7}
                    className="px-3 py-3 text-right text-xs font-bold text-[#13193a]"
                  >
                    TOTALES
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">
                    ${totalVales.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">
                    ${totalAnual.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">
                    ${totalNeta.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">
                    ${totalPrimerPago.toFixed(2)}
                  </td>
                  <td colSpan={7} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumen multi-oficina */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#13193a] px-5 py-3.5">
          <p className="text-sm font-bold text-white">
            Resumen de hoy — todas las oficinas
          </p>
          <p className="text-white/50 text-xs mt-0.5">
            Solo datos de pólizas · Sin información de pagos
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {[
                  "Oficina",
                  "Pólizas",
                  "Prima anual total",
                  "Prima neta total",
                  "1er pago total",
                  "Vales",
                  "Estatus",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {OFICINAS.map((o) => {
                const c = CORTES_MOCK[o];
                const tv = c.polizas.reduce((s, p) => s + p.vale, 0);
                const ta = c.polizas.reduce((s, p) => s + p.primaAnual, 0);
                const tn = c.polizas.reduce((s, p) => s + p.primaNeta, 0);
                const tp = c.polizas.reduce((s, p) => s + p.primerPago, 0);
                return (
                  <tr
                    key={o}
                    onClick={() => setOficinaSel(o)}
                    className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${o === oficinaSel ? "bg-blue-50/40" : ""}`}
                  >
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#13193a]">
                      {o}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-[#13193a]">
                      {c.polizas.length}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700 tabular-nums">
                      ${ta.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 tabular-nums">
                      ${tn.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-emerald-700 tabular-nums">
                      ${tp.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 tabular-nums">
                      {tv > 0 ? `$${tv.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${c.cerrado ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                      >
                        {c.cerrado ? "Cerrado" : "En proceso"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
