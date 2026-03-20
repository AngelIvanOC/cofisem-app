// ============================================================
// src/pages/ventas/VentasMetas.jsx
// Ventas: Metas mensuales con termómetro de avance
// Vista por oficina y por vendedor individual
// ============================================================
import { useState } from "react";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const MES_ACT = new Date().getMonth(); // 0-indexed

// ── Datos mock ────────────────────────────────────────────────
const OFICINAS_METAS = [
  {
    nombre: "COFISEM AV. E.ZAPATA",
    meta: 25,
    actual: 22,
    metaPrima: 60000,
    primaNeta: 50600,
    vendedores: [
      {
        id: "V-01",
        nombre: "Luis Martínez",
        folio: "T0312",
        meta: 20,
        actual: 22,
        metaPrima: 48000,
        primaNeta: 50600,
        historial: [15, 18, 22, 19, 21, 22, 0, 0, 0, 0, 0, 0],
      },
      {
        id: "V-02",
        nombre: "Juan Reyes",
        folio: "T0289",
        meta: 5,
        actual: 0,
        metaPrima: 12000,
        primaNeta: 0,
        historial: [3, 4, 5, 4, 5, 0, 0, 0, 0, 0, 0, 0],
      },
    ],
  },
  {
    nombre: "OFICINA CIVAC",
    meta: 30,
    actual: 30,
    metaPrima: 72000,
    primaNeta: 72000,
    vendedores: [
      {
        id: "V-03",
        nombre: "Laura Rosher",
        folio: "T0455",
        meta: 20,
        actual: 18,
        metaPrima: 48000,
        primaNeta: 41400,
        historial: [14, 16, 18, 15, 18, 18, 0, 0, 0, 0, 0, 0],
      },
      {
        id: "V-04",
        nombre: "Sofía Torres",
        folio: "T0501",
        meta: 10,
        actual: 12,
        metaPrima: 24000,
        primaNeta: 30600,
        historial: [8, 9, 12, 10, 11, 12, 0, 0, 0, 0, 0, 0],
      },
    ],
  },
  {
    nombre: "COFISEM TEMIXCO",
    meta: 15,
    actual: 10,
    metaPrima: 36000,
    primaNeta: 23000,
    vendedores: [
      {
        id: "V-05",
        nombre: "Carlos Soto",
        folio: "T0601",
        meta: 10,
        actual: 7,
        metaPrima: 24000,
        primaNeta: 16100,
        historial: [9, 8, 7, 8, 9, 7, 0, 0, 0, 0, 0, 0],
      },
      {
        id: "V-06",
        nombre: "Ana López",
        folio: "T0602",
        meta: 5,
        actual: 3,
        metaPrima: 12000,
        primaNeta: 6900,
        historial: [4, 3, 3, 4, 3, 3, 0, 0, 0, 0, 0, 0],
      },
    ],
  },
  {
    nombre: "COFISEM CUAUTLA",
    meta: 10,
    actual: 6,
    metaPrima: 24000,
    primaNeta: 13800,
    vendedores: [
      {
        id: "V-07",
        nombre: "Patricia Morales",
        folio: "T0701",
        meta: 10,
        actual: 6,
        metaPrima: 24000,
        primaNeta: 13800,
        historial: [8, 7, 6, 7, 8, 6, 0, 0, 0, 0, 0, 0],
      },
    ],
  },
];

// Días del mes para proyección
const DIA_HOY = 17;
const DIAS_MES = 31;
const PROYECCION_FACTOR = DIAS_MES / DIA_HOY;

// ── Termómetro vertical ───────────────────────────────────────
function Termometro({ pct, color, label, height = 120 }) {
  const pctClamped = Math.min(Math.max(pct, 0), 100);
  const bgFill =
    color === "emerald"
      ? "#10b981"
      : color === "blue"
        ? "#3b82f6"
        : color === "amber"
          ? "#f59e0b"
          : color === "red"
            ? "#ef4444"
            : "#13193a";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[11px] font-bold text-gray-700 tabular-nums">{pct}%</p>
      <div className="relative" style={{ width: 20, height }}>
        {/* Fondo */}
        <div className="absolute inset-0 rounded-full bg-gray-100" />
        {/* Relleno */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-700"
          style={{ height: `${pctClamped}%`, background: bgFill }}
        />
        {/* Línea de meta */}
        <div
          className="absolute left-0 right-0 border-t-2 border-dashed border-gray-400"
          style={{ bottom: "100%", transform: "translateY(1px)" }}
        />
      </div>
      <p className="text-[10px] text-gray-400 text-center leading-tight max-w-12">
        {label}
      </p>
    </div>
  );
}

// ── Barra de avance con proyección ────────────────────────────
function BarraAvance({ actual, meta, showProyeccion = true }) {
  const pct = Math.round((actual / meta) * 100);
  const proyecc = Math.round(((actual * PROYECCION_FACTOR) / meta) * 100);
  const color =
    pct >= 100
      ? "bg-emerald-500"
      : pct >= 80
        ? "bg-blue-500"
        : pct >= 50
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-gray-500">
          {actual} / {meta} pólizas
        </span>
        <div className="flex gap-3">
          {showProyeccion && (
            <span className="text-blue-500 font-semibold">
              ~{Math.min(proyecc, 150)}% proyectado
            </span>
          )}
          <span
            className={`font-bold ${pct >= 100 ? "text-emerald-600" : pct < 50 ? "text-red-500" : "text-[#13193a]"}`}
          >
            {pct}%
          </span>
        </div>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        {/* Proyección (fondo semitransparente) */}
        {showProyeccion && proyecc > pct && (
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-blue-200 transition-all"
            style={{ width: `${Math.min(proyecc, 100)}%` }}
          />
        )}
        {/* Actual */}
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ── Mini historial de barras ──────────────────────────────────
function MiniHistorial({ historial }) {
  const max = Math.max(...historial.filter((v) => v > 0), 1);
  return (
    <div className="flex items-end gap-px h-10">
      {historial.map((v, i) => {
        const esFuturo = i > MES_ACT;
        const esActual = i === MES_ACT;
        return (
          <div
            key={i}
            className="flex-1 flex items-end"
            style={{ height: "100%" }}
          >
            <div
              className={`w-full rounded-t transition-all ${
                esFuturo
                  ? "bg-gray-100"
                  : esActual
                    ? "bg-[#13193a]"
                    : "bg-gray-300"
              }`}
              style={{
                height: esFuturo ? 4 : `${Math.max((v / max) * 100, 8)}%`,
              }}
              title={esFuturo ? "—" : `${MESES[i]}: ${v} pól.`}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Estado badge ──────────────────────────────────────────────
function EstadoBadge({ pct }) {
  if (pct >= 100)
    return (
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        ✓ Meta alcanzada
      </span>
    );
  if (pct >= 80)
    return (
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50    text-blue-700    border border-blue-200   ">
        En camino
      </span>
    );
  if (pct >= 50)
    return (
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50   text-amber-700   border border-amber-200  ">
        En riesgo
      </span>
    );
  return (
    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50     text-red-600     border border-red-200    ">
      Rezagado
    </span>
  );
}

// ── Página ────────────────────────────────────────────────────
export default function VentasMetas() {
  const [vista, setVista] = useState("oficinas"); // oficinas | vendedores
  const [ofSel, setOfSel] = useState(null);

  const todasOfs = OFICINAS_METAS;
  const metaTotal = todasOfs.reduce((s, o) => s + o.meta, 0);
  const actTotal = todasOfs.reduce((s, o) => s + o.actual, 0);
  const pctGlobal = Math.round((actTotal / metaTotal) * 100);
  const proyecGlobal = Math.round(
    ((actTotal * PROYECCION_FACTOR) / metaTotal) * 100,
  );

  const todos_vendedores = todasOfs.flatMap((o) =>
    o.vendedores.map((v) => ({ ...v, oficina: o.nombre })),
  );

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Metas</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {MESES[MES_ACT]} {new Date().getFullYear()} · Día {DIA_HOY} de{" "}
            {DIAS_MES}
          </p>
        </div>
        {/* Toggle vista */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {[
            { k: "oficinas", l: "Por oficina" },
            { k: "vendedores", l: "Por vendedor" },
          ].map((v) => (
            <button
              key={v.k}
              onClick={() => {
                setVista(v.k);
                setOfSel(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                vista === v.k
                  ? "bg-[#13193a] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {v.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Termómetro global ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Termómetro grande */}
          <div className="flex items-end gap-4">
            <Termometro
              pct={pctGlobal}
              color={
                pctGlobal >= 100
                  ? "emerald"
                  : pctGlobal >= 80
                    ? "blue"
                    : pctGlobal >= 50
                      ? "amber"
                      : "red"
              }
              label="Actual"
              height={140}
            />
            <Termometro
              pct={Math.min(proyecGlobal, 150)}
              color="blue"
              label="Proyect."
              height={140}
            />
          </div>
          {/* Info global */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-4xl font-black text-[#13193a] tabular-nums">
                {pctGlobal}%
              </p>
              <EstadoBadge pct={pctGlobal} />
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-bold text-[#13193a]">{actTotal}</span> de{" "}
              <span className="font-bold">{metaTotal}</span> pólizas · Prima
              neta:{" "}
              <span className="font-bold text-emerald-700">
                $
                {todasOfs
                  .reduce((s, o) => s + o.primaNeta, 0)
                  .toLocaleString("es-MX")}
              </span>
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Avance global</span>
                <span className="text-blue-600 font-semibold">
                  ~{Math.min(proyecGlobal, 150)}% al cierre proyectado
                </span>
              </div>
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-blue-200"
                  style={{ width: `${Math.min(proyecGlobal, 100)}%` }}
                />
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-[#13193a] transition-all duration-700"
                  style={{ width: `${Math.min(pctGlobal, 100)}%` }}
                />
              </div>
              <div className="flex gap-4 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2 rounded-sm bg-[#13193a] inline-block" />
                  Actual
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2 rounded-sm bg-blue-200 inline-block" />
                  Proyectado al cierre
                </span>
              </div>
            </div>
          </div>
          {/* Mini termómetros por oficina */}
          <div className="flex items-end gap-4 border-l border-gray-100 pl-6">
            {todasOfs.map((o) => {
              const p = Math.round((o.actual / o.meta) * 100);
              const c =
                p >= 100
                  ? "emerald"
                  : p >= 80
                    ? "blue"
                    : p >= 50
                      ? "amber"
                      : "red";
              const ab = o.nombre.split(" ").pop().slice(0, 6);
              return (
                <Termometro
                  key={o.nombre}
                  pct={p}
                  color={c}
                  label={ab}
                  height={90}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Vista por OFICINAS ──────────────────────────────────── */}
      {vista === "oficinas" && (
        <div className="space-y-3">
          {OFICINAS_METAS.map((o) => {
            const pct = Math.round((o.actual / o.meta) * 100);
            const isOpen = ofSel === o.nombre;
            return (
              <div
                key={o.nombre}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Header de oficina */}
                <button
                  onClick={() => setOfSel(isOpen ? null : o.nombre)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-bold text-[#13193a]">
                        {o.nombre}
                      </p>
                      <EstadoBadge pct={pct} />
                    </div>
                    <BarraAvance actual={o.actual} meta={o.meta} />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-[#13193a] tabular-nums">
                      {pct}%
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      ${(o.primaNeta / 1000).toFixed(0)}k prima
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Vendedores de la oficina */}
                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {o.vendedores.map((v) => {
                      const vPct = Math.round((v.actual / v.meta) * 100);
                      return (
                        <div
                          key={v.id}
                          className="flex items-center gap-4 px-6 py-4"
                        >
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-[#13193a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {v.nombre
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-bold text-[#13193a]">
                                {v.nombre}
                              </p>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {v.folio}
                              </span>
                              <EstadoBadge pct={vPct} />
                            </div>
                            <BarraAvance
                              actual={v.actual}
                              meta={v.meta}
                              showProyeccion={false}
                            />
                          </div>
                          {/* Mini historial */}
                          <div className="w-28 shrink-0">
                            <p className="text-[10px] text-gray-400 mb-1">
                              Últimos 12 meses
                            </p>
                            <MiniHistorial historial={v.historial} />
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-[#13193a]">
                              {vPct}%
                            </p>
                            <p className="text-[11px] text-emerald-600">
                              ${(v.primaNeta / 1000).toFixed(0)}k
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Vista por VENDEDORES ────────────────────────────────── */}
      {vista === "vendedores" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#13193a]">
                  {[
                    "#",
                    "Vendedor",
                    "Oficina",
                    "Folio",
                    "Pólizas",
                    "Meta",
                    "Avance",
                    "Prima neta",
                    "Historial 12m",
                    "Estado",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-white px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...todos_vendedores]
                  .sort((a, b) => b.actual - a.actual)
                  .map((v, i) => {
                    const pct = Math.round((v.actual / v.meta) * 100);
                    return (
                      <tr
                        key={v.id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-bold text-gray-400">
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#13193a] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                              {v.nombre
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)}
                            </div>
                            <p className="text-xs font-semibold text-[#13193a] whitespace-nowrap">
                              {v.nombre}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 max-w-28 truncate">
                          {v.oficina}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                          {v.folio}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold text-[#13193a] tabular-nums">
                          {v.actual}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 tabular-nums">
                          {v.meta}
                        </td>
                        <td className="px-4 py-3.5 w-36">
                          <div className="space-y-0.5">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${pct >= 100 ? "bg-emerald-500" : pct >= 80 ? "bg-blue-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-500 text-right font-semibold">
                              {pct}%
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-bold text-emerald-700 tabular-nums">
                          ${v.primaNeta.toLocaleString("es-MX")}
                        </td>
                        <td className="px-4 py-3.5 w-28">
                          <MiniHistorial historial={v.historial} />
                        </td>
                        <td className="px-4 py-3.5">
                          <EstadoBadge pct={pct} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
