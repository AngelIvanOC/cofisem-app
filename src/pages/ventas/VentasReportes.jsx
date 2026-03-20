// ============================================================
// src/pages/ventas/VentasReportes.jsx
// Ventas: Reportes comparativos y estadísticas
// Vistas: Producción · Comparativo oficinas · Coberturas · Tendencia
// ============================================================
import { useState } from "react";

const PERIODOS = [
  "Este mes",
  "Mes anterior",
  "Últimos 3 meses",
  "Este año",
  "Año anterior",
];
const OFICINAS = [
  "Todas",
  "COFISEM AV. E.ZAPATA",
  "OFICINA CIVAC",
  "COFISEM TEMIXCO",
  "COFISEM CUAUTLA",
];

// ── Datos mock ────────────────────────────────────────────────
const PRODUCCION = [
  {
    oficina: "COFISEM AV. E.ZAPATA",
    vendedor: "Luis Martínez",
    polizas: 22,
    primaNeta: 50600,
    vales: 880,
    formasPago: { contado: 8, parciales: 14 },
  },
  {
    oficina: "COFISEM AV. E.ZAPATA",
    vendedor: "Juan Reyes",
    polizas: 0,
    primaNeta: 0,
    vales: 0,
    formasPago: { contado: 0, parciales: 0 },
  },
  {
    oficina: "OFICINA CIVAC",
    vendedor: "Laura Rosher",
    polizas: 18,
    primaNeta: 41400,
    vales: 720,
    formasPago: { contado: 6, parciales: 12 },
  },
  {
    oficina: "OFICINA CIVAC",
    vendedor: "Sofía Torres",
    polizas: 12,
    primaNeta: 30600,
    vales: 480,
    formasPago: { contado: 5, parciales: 7 },
  },
  {
    oficina: "COFISEM TEMIXCO",
    vendedor: "Carlos Soto",
    polizas: 7,
    primaNeta: 16100,
    vales: 280,
    formasPago: { contado: 3, parciales: 4 },
  },
  {
    oficina: "COFISEM TEMIXCO",
    vendedor: "Ana López",
    polizas: 3,
    primaNeta: 6900,
    vales: 120,
    formasPago: { contado: 1, parciales: 2 },
  },
  {
    oficina: "COFISEM CUAUTLA",
    vendedor: "Patricia Morales",
    polizas: 6,
    primaNeta: 13800,
    vales: 240,
    formasPago: { contado: 2, parciales: 4 },
  },
];

const COBERTURAS_DIST = [
  { cobertura: "TAXI BÁSICA 2500", polizas: 32, primaNeta: 73600, pct: 40 },
  {
    cobertura: "TAXI BÁSICA PAGOS 2700",
    polizas: 21,
    primaNeta: 48720,
    pct: 26,
  },
  {
    cobertura: "SERV. PÚB. 50/50 GAMAN 2",
    polizas: 18,
    primaNeta: 45864,
    pct: 22,
  },
  {
    cobertura: "COBERTURA APP (UBER, DIDI)",
    polizas: 10,
    primaNeta: 31428,
    pct: 12,
  },
];

const TENDENCIA_ANUAL = [
  { mes: "Ene", polizas: 62, primaNeta: 142640 },
  { mes: "Feb", polizas: 68, primaNeta: 156400 },
  { mes: "Mar", polizas: 81, primaNeta: 186400 },
  { mes: "Abr", polizas: 0, primaNeta: 0 },
  { mes: "May", polizas: 0, primaNeta: 0 },
  { mes: "Jun", polizas: 0, primaNeta: 0 },
  { mes: "Jul", polizas: 0, primaNeta: 0 },
  { mes: "Ago", polizas: 0, primaNeta: 0 },
  { mes: "Sep", polizas: 0, primaNeta: 0 },
  { mes: "Oct", polizas: 0, primaNeta: 0 },
  { mes: "Nov", polizas: 0, primaNeta: 0 },
  { mes: "Dic", polizas: 0, primaNeta: 0 },
];

const COMPARATIVO_MES_ANT = [
  { oficina: "COFISEM AV. E.ZAPATA", este: 22, anterior: 19, meta: 25 },
  { oficina: "OFICINA CIVAC", este: 30, anterior: 27, meta: 30 },
  { oficina: "COFISEM TEMIXCO", este: 10, anterior: 14, meta: 15 },
  { oficina: "COFISEM CUAUTLA", este: 6, anterior: 8, meta: 10 },
];

function MiniBar({
  data,
  valueKey,
  labelKey,
  color = "#13193a",
  height = 80,
  secondKey,
  secondColor = "#3b82f6",
}) {
  const vals = data.map((d) =>
    Math.max(d[valueKey] ?? 0, secondKey ? (d[secondKey] ?? 0) : 0),
  );
  const max = Math.max(...vals, 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: height + 24 }}>
      {data.map((d, i) => {
        const v1 = d[valueKey] ?? 0;
        const v2 = secondKey ? (d[secondKey] ?? 0) : null;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            <div
              className="relative w-full flex items-end gap-0.5"
              style={{ height }}
            >
              <div
                className="flex-1 rounded-t-md transition-all duration-700"
                style={{
                  height: `${Math.max((v1 / max) * 100, 2)}%`,
                  background: color,
                  opacity: v1 === 0 ? 0.2 : 0.85,
                }}
              />
              {v2 !== null && (
                <div
                  className="flex-1 rounded-t-md transition-all duration-700"
                  style={{
                    height: `${Math.max((v2 / max) * 100, 2)}%`,
                    background: secondColor,
                    opacity: v2 === 0 ? 0.2 : 0.7,
                  }}
                />
              )}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#13193a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {v1}
                {v2 !== null ? ` / ${v2}` : ""}
              </div>
            </div>
            <p className="text-[9px] text-gray-400 font-medium truncate w-full text-center">
              {d[labelKey]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function VentasReportes() {
  const [tab, setTab] = useState("produccion");
  const [periodo, setPeriodo] = useState("Este mes");
  const [filtroOficina, setFiltroOficina] = useState("Todas");

  const filtrados = PRODUCCION.filter(
    (p) => filtroOficina === "Todas" || p.oficina === filtroOficina,
  );

  const totalPolizas = filtrados.reduce((s, p) => s + p.polizas, 0);
  const totalPrimaNeta = filtrados.reduce((s, p) => s + p.primaNeta, 0);
  const totalVales = filtrados.reduce((s, p) => s + p.vales, 0);
  const totalContado = filtrados.reduce((s, p) => s + p.formasPago.contado, 0);
  const totalParciales = filtrados.reduce(
    (s, p) => s + p.formasPago.parciales,
    0,
  );

  // Agrupado por oficina para gráficas
  const porOficina = Object.values(
    PRODUCCION.reduce((acc, p) => {
      if (!acc[p.oficina])
        acc[p.oficina] = {
          label: p.oficina.split(" ").pop().slice(0, 7),
          polizas: 0,
          primaNeta: 0,
        };
      acc[p.oficina].polizas += p.polizas;
      acc[p.oficina].primaNeta += p.primaNeta;
      return acc;
    }, {}),
  );

  const TABS = [
    { k: "produccion", l: "Producción" },
    { k: "comparativo", l: "Comparativo oficinas" },
    { k: "coberturas", l: "Por cobertura" },
    { k: "tendencia", l: "Tendencia anual" },
  ];

  const thCls =
    "text-left text-[11px] font-semibold text-white px-4 py-3 whitespace-nowrap";
  const tdCls = "px-4 py-3 text-xs";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">
            Reportes de ventas
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Comparativas, estadísticas y análisis de producción
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none"
          >
            {PERIODOS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">
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

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { l: "Pólizas", v: totalPolizas, a: "blue" },
          {
            l: "Prima neta",
            v: `$${totalPrimaNeta.toLocaleString("es-MX")}`,
            a: "emerald",
          },
          {
            l: "Vales",
            v: `$${totalVales.toLocaleString("es-MX")}`,
            a: "amber",
          },
          { l: "Contado", v: totalContado, a: "blue" },
          { l: "A parciales", v: totalParciales, a: "blue" },
        ].map((m) => {
          const c = {
            blue: "bg-blue-50 border-blue-200 text-blue-700",
            emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
            amber: "bg-amber-50 border-amber-200 text-amber-700",
          };
          return (
            <div key={m.l} className={`${c[m.a]} border rounded-2xl p-4`}>
              <p className="text-xl font-bold tabular-nums truncate">{m.v}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.l}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                tab === t.k
                  ? "border-[#13193a] text-[#13193a]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* Filtro de oficina (solo en producción) */}
        {tab === "produccion" && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide shrink-0">
              Oficina
            </label>
            <select
              value={filtroOficina}
              onChange={(e) => setFiltroOficina(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none"
            >
              {OFICINAS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── TAB: Producción ── */}
        {tab === "produccion" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#13193a]">
                  {[
                    "Oficina",
                    "Vendedor",
                    "Pólizas",
                    "Prima neta",
                    "Vales $",
                    "Contado",
                    "Parciales",
                  ].map((h) => (
                    <th key={h} className={thCls}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-10 text-sm text-gray-400"
                    >
                      Sin datos.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td
                        className={`${tdCls} font-medium text-gray-700 max-w-32 truncate`}
                      >
                        {p.oficina}
                      </td>
                      <td className={`${tdCls} font-semibold text-[#13193a]`}>
                        {p.vendedor}
                      </td>
                      <td
                        className={`${tdCls} font-bold text-[#13193a] tabular-nums`}
                      >
                        {p.polizas || <span className="text-gray-300">—</span>}
                      </td>
                      <td
                        className={`${tdCls} font-bold text-emerald-700 tabular-nums`}
                      >
                        {p.primaNeta ? (
                          `$${p.primaNeta.toLocaleString("es-MX")}`
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className={`${tdCls} text-gray-600 tabular-nums`}>
                        {p.vales ? (
                          `$${p.vales.toLocaleString("es-MX")}`
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className={`${tdCls} text-gray-600 tabular-nums`}>
                        {p.formasPago.contado || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className={`${tdCls} text-gray-600 tabular-nums`}>
                        {p.formasPago.parciales || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-gray-50/60 border-t-2 border-gray-200 font-bold">
                  <td
                    colSpan={2}
                    className={`${tdCls} font-bold text-[#13193a]`}
                  >
                    TOTAL
                  </td>
                  <td
                    className={`${tdCls} font-bold text-[#13193a] tabular-nums`}
                  >
                    {totalPolizas}
                  </td>
                  <td
                    className={`${tdCls} font-bold text-emerald-700 tabular-nums`}
                  >
                    ${totalPrimaNeta.toLocaleString("es-MX")}
                  </td>
                  <td
                    className={`${tdCls} font-bold text-[#13193a] tabular-nums`}
                  >
                    ${totalVales.toLocaleString("es-MX")}
                  </td>
                  <td
                    className={`${tdCls} font-bold text-[#13193a] tabular-nums`}
                  >
                    {totalContado}
                  </td>
                  <td
                    className={`${tdCls} font-bold text-[#13193a] tabular-nums`}
                  >
                    {totalParciales}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: Comparativo oficinas ── */}
        {tab === "comparativo" && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-4">
                  Este mes vs mes anterior
                  <span className="ml-2 inline-flex gap-3">
                    <span className="text-[11px] text-gray-500">
                      █ Este mes
                    </span>
                    <span className="text-[11px] text-blue-400">
                      █ Mes anterior
                    </span>
                  </span>
                </p>
                <MiniBar
                  data={COMPARATIVO_MES_ANT.map((d) => ({
                    ...d,
                    label: d.oficina.split(" ").pop().slice(0, 7),
                  }))}
                  valueKey="este"
                  labelKey="label"
                  secondKey="anterior"
                  secondColor="#93c5fd"
                  height={100}
                />
              </div>
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#13193a]">
                      {[
                        "Oficina",
                        "Este mes",
                        "Mes ant.",
                        "Var.",
                        "Meta",
                        "Avance",
                      ].map((h) => (
                        <th key={h} className={thCls}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {COMPARATIVO_MES_ANT.map((d, i) => {
                      const variacion = d.este - d.anterior;
                      const pct = Math.round((d.este / d.meta) * 100);
                      return (
                        <tr key={i} className="hover:bg-gray-50/60">
                          <td
                            className={`${tdCls} font-medium text-gray-700 max-w-28 truncate`}
                          >
                            {d.oficina}
                          </td>
                          <td
                            className={`${tdCls} font-bold text-[#13193a] tabular-nums`}
                          >
                            {d.este}
                          </td>
                          <td className={`${tdCls} text-gray-500 tabular-nums`}>
                            {d.anterior}
                          </td>
                          <td className={tdCls}>
                            <span
                              className={`font-bold text-xs ${variacion > 0 ? "text-emerald-600" : variacion < 0 ? "text-red-500" : "text-gray-400"}`}
                            >
                              {variacion > 0 ? "+" : ""}
                              {variacion}
                            </span>
                          </td>
                          <td className={`${tdCls} text-gray-500 tabular-nums`}>
                            {d.meta}
                          </td>
                          <td className={tdCls}>
                            <span
                              className={`font-bold text-xs ${pct >= 100 ? "text-emerald-600" : pct >= 80 ? "text-blue-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}
                            >
                              {pct}%
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
        )}

        {/* ── TAB: Por cobertura ── */}
        {tab === "coberturas" && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Barra horizontal por cobertura */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500">
                  Distribución por cobertura — pólizas del mes
                </p>
                {COBERTURAS_DIST.map((c, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700 truncate max-w-52">
                        {c.cobertura}
                      </span>
                      <div className="flex gap-3 shrink-0">
                        <span className="font-bold text-[#13193a]">
                          {c.polizas} pól.
                        </span>
                        <span className="text-emerald-600 font-semibold">
                          ${(c.primaNeta / 1000).toFixed(0)}k
                        </span>
                        <span className="text-gray-400 w-8 text-right">
                          {c.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-700"
                        style={{
                          width: `${c.pct}%`,
                          background: `hsl(${220 + i * 20}, 55%, ${38 + i * 8}%)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100 self-start">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#13193a]">
                      {["Cobertura", "Pólizas", "Prima neta", "%"].map((h) => (
                        <th key={h} className={thCls}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {COBERTURAS_DIST.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td
                          className={`${tdCls} font-medium text-gray-700 max-w-40 truncate`}
                        >
                          {c.cobertura}
                        </td>
                        <td
                          className={`${tdCls} font-bold text-[#13193a] tabular-nums`}
                        >
                          {c.polizas}
                        </td>
                        <td
                          className={`${tdCls} font-semibold text-emerald-700 tabular-nums`}
                        >
                          ${c.primaNeta.toLocaleString("es-MX")}
                        </td>
                        <td
                          className={`${tdCls} text-gray-500 tabular-nums font-semibold`}
                        >
                          {c.pct}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50/60 border-t-2 border-gray-200">
                      <td className={`${tdCls} font-bold text-[#13193a]`}>
                        TOTAL
                      </td>
                      <td
                        className={`${tdCls} font-bold text-[#13193a] tabular-nums`}
                      >
                        {COBERTURAS_DIST.reduce((s, c) => s + c.polizas, 0)}
                      </td>
                      <td
                        className={`${tdCls} font-bold text-emerald-700 tabular-nums`}
                      >
                        $
                        {COBERTURAS_DIST.reduce(
                          (s, c) => s + c.primaNeta,
                          0,
                        ).toLocaleString("es-MX")}
                      </td>
                      <td className={`${tdCls} font-bold text-gray-500`}>
                        100%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Tendencia anual ── */}
        {tab === "tendencia" && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-4">
                  Pólizas por mes — año en curso
                </p>
                <MiniBar
                  data={TENDENCIA_ANUAL}
                  valueKey="polizas"
                  labelKey="mes"
                  height={110}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-4">
                  Prima neta mensual
                </p>
                <MiniBar
                  data={TENDENCIA_ANUAL}
                  valueKey="primaNeta"
                  labelKey="mes"
                  color="#10b981"
                  height={110}
                />
              </div>
            </div>
            {/* Tabla acumulado */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#13193a]">
                    {[
                      "Mes",
                      "Pólizas",
                      "Prima neta",
                      "Acum. pólizas",
                      "Acum. prima",
                    ].map((h) => (
                      <th key={h} className={thCls}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {TENDENCIA_ANUAL.filter((m) => m.polizas > 0)
                    .reduce((acc, m, i) => {
                      const prevPol = i > 0 ? acc[i - 1].acumPol : 0;
                      const prevPri = i > 0 ? acc[i - 1].acumPri : 0;
                      return [
                        ...acc,
                        {
                          ...m,
                          acumPol: prevPol + m.polizas,
                          acumPri: prevPri + m.primaNeta,
                        },
                      ];
                    }, [])
                    .map((m, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className={`${tdCls} font-semibold text-gray-700`}>
                          {m.mes}
                        </td>
                        <td
                          className={`${tdCls} font-bold text-[#13193a] tabular-nums`}
                        >
                          {m.polizas}
                        </td>
                        <td
                          className={`${tdCls} font-semibold text-emerald-700 tabular-nums`}
                        >
                          ${m.primaNeta.toLocaleString("es-MX")}
                        </td>
                        <td className={`${tdCls} text-gray-600 tabular-nums`}>
                          {m.acumPol}
                        </td>
                        <td className={`${tdCls} text-gray-600 tabular-nums`}>
                          ${m.acumPri.toLocaleString("es-MX")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
