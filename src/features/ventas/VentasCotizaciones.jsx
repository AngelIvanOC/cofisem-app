// ============================================================
// src/pages/ventas/VentasCotizaciones.jsx
// Ventas: Seguimiento de cotizaciones — tasa de conversión
// Cotizaciones guardadas sin tramitar, próximas a expirar
// ============================================================
import { useState } from "react";

const OFICINAS = [
  "Todas",
  "COFISEM AV. E.ZAPATA",
  "OFICINA CIVAC",
  "COFISEM TEMIXCO",
  "COFISEM CUAUTLA",
];
const VENDEDORES = [
  "Todos",
  "Luis Martínez",
  "Laura Rosher",
  "Sofía Torres",
  "Carlos Soto",
  "Ana López",
  "Patricia Morales",
];

const STATUS_CLS = {
  Pendiente: "bg-amber-50   text-amber-700   border-amber-200",
  Tramitada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Expirada: "bg-red-50     text-red-600     border-red-200",
  Descartada: "bg-gray-100   text-gray-500    border-gray-200",
};

const COTIZACIONES = [
  {
    id: "COT-0341",
    fecha: "17/03/2026",
    cliente: "Jorge Vásquez",
    telefono: "777 900 1122",
    cobertura: "COBERTURA APP (UBER, DIDI)",
    prima: 3142.8,
    oficina: "OFICINA CIVAC",
    vendedor: "Laura Rosher",
    expira: "24/03/2026",
    diasRestantes: 7,
    estatus: "Pendiente",
  },
  {
    id: "COT-0340",
    fecha: "17/03/2026",
    cliente: "Mariana Solís",
    telefono: "777 900 3344",
    cobertura: "TAXI BÁSICA 2500",
    prima: 2200.0,
    oficina: "COFISEM AV. E.ZAPATA",
    vendedor: "Luis Martínez",
    expira: "24/03/2026",
    diasRestantes: 7,
    estatus: "Pendiente",
  },
  {
    id: "COT-0339",
    fecha: "16/03/2026",
    cliente: "Ramón Gutiérrez",
    telefono: "777 900 5566",
    cobertura: "SERV. PÚB. 50/50 GAMAN 2",
    prima: 2548.0,
    oficina: "COFISEM TEMIXCO",
    vendedor: "Carlos Soto",
    expira: "23/03/2026",
    diasRestantes: 6,
    estatus: "Pendiente",
  },
  {
    id: "COT-0338",
    fecha: "15/03/2026",
    cliente: "Beatriz Luna",
    telefono: "777 900 7788",
    cobertura: "TAXI BÁSICA PAGOS 2700",
    prima: 2320.0,
    oficina: "OFICINA CIVAC",
    vendedor: "Sofía Torres",
    expira: "22/03/2026",
    diasRestantes: 5,
    estatus: "Pendiente",
  },
  {
    id: "COT-0335",
    fecha: "12/03/2026",
    cliente: "Eduardo Ríos",
    telefono: "777 900 9900",
    cobertura: "TAXI BÁSICA 2500",
    prima: 2200.0,
    oficina: "COFISEM CUAUTLA",
    vendedor: "Patricia Morales",
    expira: "19/03/2026",
    diasRestantes: 2,
    estatus: "Pendiente",
  },
  {
    id: "COT-0330",
    fecha: "10/03/2026",
    cliente: "Carmen Vela",
    telefono: "777 100 2211",
    cobertura: "COBERTURA APP (UBER, DIDI)",
    prima: 3142.8,
    oficina: "COFISEM AV. E.ZAPATA",
    vendedor: "Luis Martínez",
    expira: "17/03/2026",
    diasRestantes: 0,
    estatus: "Pendiente",
  },
  {
    id: "COT-0328",
    fecha: "09/03/2026",
    cliente: "Felipe Mora",
    telefono: "777 100 4433",
    cobertura: "TAXI BÁSICA 2500",
    prima: 2200.0,
    oficina: "OFICINA CIVAC",
    vendedor: "Laura Rosher",
    expira: "16/03/2026",
    diasRestantes: -1,
    estatus: "Expirada",
  },
  {
    id: "COT-0312",
    fecha: "01/03/2026",
    cliente: "Rosa Salinas",
    telefono: "777 100 6655",
    cobertura: "SERV. PÚB. 50/50 GAMAN 2",
    prima: 2548.0,
    oficina: "COFISEM TEMIXCO",
    vendedor: "Carlos Soto",
    expira: "08/03/2026",
    diasRestantes: -9,
    estatus: "Tramitada",
  },
  {
    id: "COT-0310",
    fecha: "28/02/2026",
    cliente: "Tomás Herrera",
    telefono: "777 100 8877",
    cobertura: "TAXI BÁSICA PAGOS 2700",
    prima: 2320.0,
    oficina: "COFISEM AV. E.ZAPATA",
    vendedor: "Luis Martínez",
    expira: "07/03/2026",
    diasRestantes: -10,
    estatus: "Tramitada",
  },
  {
    id: "COT-0305",
    fecha: "25/02/2026",
    cliente: "Irene Castillo",
    telefono: "777 200 1100",
    cobertura: "TAXI BÁSICA 2500",
    prima: 2200.0,
    oficina: "OFICINA CIVAC",
    vendedor: "Sofía Torres",
    expira: "04/03/2026",
    diasRestantes: -13,
    estatus: "Descartada",
  },
];

export default function VentasCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState(COTIZACIONES);
  const [busqueda, setBusqueda] = useState("");
  const [filtroOficina, setFiltroOficina] = useState("Todas");
  const [filtroVendedor, setFiltroVendedor] = useState("Todos");
  const [filtroEstatus, setFiltroEstatus] = useState("Todos");

  const filtradas = cotizaciones.filter((c) => {
    const mb =
      c.id.includes(busqueda) ||
      c.cliente.toLowerCase().includes(busqueda.toLowerCase());
    const mo = filtroOficina === "Todas" || c.oficina === filtroOficina;
    const mv = filtroVendedor === "Todos" || c.vendedor === filtroVendedor;
    const me = filtroEstatus === "Todos" || c.estatus === filtroEstatus;
    return mb && mo && mv && me;
  });

  const pendientes = cotizaciones.filter((c) => c.estatus === "Pendiente");
  const tramitadas = cotizaciones.filter((c) => c.estatus === "Tramitada");
  const expiradas = cotizaciones.filter((c) => c.estatus === "Expirada");
  const total = cotizaciones.filter((c) => c.estatus !== "Descartada");
  const conversion =
    total.length > 0 ? Math.round((tramitadas.length / total.length) * 100) : 0;

  const marcarTramitada = (id) => {
    setCotizaciones((cs) =>
      cs.map((c) => (c.id === id ? { ...c, estatus: "Tramitada" } : c)),
    );
  };

  const selCls =
    "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Cotizaciones</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Seguimiento de cotizaciones guardadas y tasa de conversión
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { l: "Pendientes de tramitar", v: pendientes.length, a: "amber" },
          {
            l: "Por vencer hoy",
            v: pendientes.filter(
              (c) => c.diasRestantes <= 1 && c.diasRestantes >= 0,
            ).length,
            a: "red",
          },
          { l: "Tramitadas", v: tramitadas.length, a: "emerald" },
          { l: "Expiradas sin tramitar", v: expiradas.length, a: "red" },
          { l: "Tasa de conversión", v: `${conversion}%`, a: "blue" },
        ].map((m) => {
          const c = {
            amber: "bg-amber-50 border-amber-200 text-amber-700",
            red: "bg-red-50 border-red-200 text-red-600",
            emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
            blue: "bg-blue-50 border-blue-200 text-blue-700",
          };
          return (
            <div key={m.l} className={`${c[m.a]} border rounded-2xl p-4`}>
              <p className="text-2xl font-bold tabular-nums">{m.v}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80 leading-tight">
                {m.l}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative">
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="ID o cliente..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"
            />
          </div>
          <select
            value={filtroOficina}
            onChange={(e) => setFiltroOficina(e.target.value)}
            className={selCls}
          >
            {OFICINAS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select
            value={filtroVendedor}
            onChange={(e) => setFiltroVendedor(e.target.value)}
            className={selCls}
          >
            {VENDEDORES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
            className={selCls}
          >
            {["Todos", "Pendiente", "Tramitada", "Expirada", "Descartada"].map(
              (o) => (
                <option key={o}>{o}</option>
              ),
            )}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {[
                  "ID",
                  "Fecha",
                  "Cliente",
                  "Cobertura",
                  "Prima",
                  "Oficina",
                  "Vendedor",
                  "Expira",
                  "Estatus",
                  "Acción",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-12 text-sm text-gray-400"
                  >
                    No hay cotizaciones con esos filtros.
                  </td>
                </tr>
              ) : (
                filtradas.map((c, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-gray-50/60 transition-colors ${
                      c.diasRestantes <= 0 && c.estatus === "Pendiente"
                        ? "bg-red-50/30"
                        : c.diasRestantes <= 2 && c.estatus === "Pendiente"
                          ? "bg-amber-50/30"
                          : ""
                    }`}
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#13193a]">
                      {c.id}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">
                      {c.fecha}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      {c.cliente}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 max-w-36 truncate">
                      {c.cobertura}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-emerald-700">
                      ${c.prima.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 max-w-24 truncate">
                      {c.oficina}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {c.vendedor}
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                      {c.estatus === "Pendiente" ? (
                        <span
                          className={`font-semibold ${
                            c.diasRestantes <= 0
                              ? "text-red-600"
                              : c.diasRestantes <= 2
                                ? "text-amber-700"
                                : "text-gray-600"
                          }`}
                        >
                          {c.diasRestantes <= 0
                            ? "¡Vence hoy!"
                            : `${c.diasRestantes}d restantes`}
                        </span>
                      ) : (
                        <span className="text-gray-400">{c.expira}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[c.estatus]}`}
                      >
                        {c.estatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {c.estatus === "Pendiente" && (
                        <button
                          onClick={() => marcarTramitada(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#13193a] hover:bg-[#1e2a50] text-white text-[11px] font-bold transition-all"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Tramitar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-between">
          <p className="text-xs text-gray-400">
            {filtradas.length} cotizaciones
          </p>
          <p className="text-xs text-gray-400">
            Conversión:{" "}
            <strong
              className={`${conversion >= 50 ? "text-emerald-600" : "text-amber-600"}`}
            >
              {conversion}%
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}
