// ============================================================
// src/pages/ventas/VentasVendedores.jsx
// Ventas: Rendimiento individual de vendedores
// Perfil detallado con historial, coberturas más vendidas, ranking
// ============================================================
import { useState } from "react";

const OFICINAS = [
  "Todas",
  "COFISEM AV. E.ZAPATA",
  "OFICINA CIVAC",
  "COFISEM TEMIXCO",
  "COFISEM CUAUTLA",
];
const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const MES_ACT = 2; // Marzo (0-indexed)

const VENDEDORES = [
  {
    id: "V-01",
    folio: "T0312",
    nombre: "Luis Martínez",
    oficina: "COFISEM AV. E.ZAPATA",
    telefono: "777 444 5566",
    email: "luis@cofisem.mx",
    activo: true,
    meta: 20,
    actual: 22,
    primaNeta: 50600,
    historial: [15, 18, 22, 19, 21, 22, 0, 0, 0, 0, 0, 0],
    coberturas: {
      "TAXI BÁSICA 2500": 10,
      "TAXI BÁSICA PAGOS 2700": 8,
      "SERV. PÚB. 50/50 GAMAN 2": 4,
    },
    tendencia: "up",
  },
  {
    id: "V-02",
    folio: "T0289",
    nombre: "Juan Reyes",
    oficina: "COFISEM AV. E.ZAPATA",
    telefono: "777 777 8899",
    email: "juan@cofisem.mx",
    activo: true,
    meta: 5,
    actual: 0,
    primaNeta: 0,
    historial: [3, 4, 5, 4, 5, 0, 0, 0, 0, 0, 0, 0],
    coberturas: {},
    tendencia: "down",
  },
  {
    id: "V-03",
    folio: "T0455",
    nombre: "Laura Rosher",
    oficina: "OFICINA CIVAC",
    telefono: "777 111 2233",
    email: "laura@cofisem.mx",
    activo: true,
    meta: 20,
    actual: 18,
    primaNeta: 41400,
    historial: [14, 16, 18, 15, 18, 18, 0, 0, 0, 0, 0, 0],
    coberturas: {
      "TAXI BÁSICA 2500": 8,
      "TAXI BÁSICA PAGOS 2700": 6,
      "COBERTURA APP (UBER, DIDI)": 4,
    },
    tendencia: "stable",
  },
  {
    id: "V-04",
    folio: "T0501",
    nombre: "Sofía Torres",
    oficina: "OFICINA CIVAC",
    telefono: "777 200 3344",
    email: "sofia@cofisem.mx",
    activo: true,
    meta: 10,
    actual: 12,
    primaNeta: 30600,
    historial: [8, 9, 12, 10, 11, 12, 0, 0, 0, 0, 0, 0],
    coberturas: {
      "COBERTURA APP (UBER, DIDI)": 6,
      "SERV. PÚB. 50/50 GAMAN 2": 4,
      "TAXI BÁSICA 2500": 2,
    },
    tendencia: "up",
  },
  {
    id: "V-05",
    folio: "T0601",
    nombre: "Carlos Soto",
    oficina: "COFISEM TEMIXCO",
    telefono: "777 600 1122",
    email: "carlos@cofisem.mx",
    activo: true,
    meta: 10,
    actual: 7,
    primaNeta: 16100,
    historial: [9, 8, 7, 8, 9, 7, 0, 0, 0, 0, 0, 0],
    coberturas: { "TAXI BÁSICA 2500": 5, "SERV. PÚB. 50/50 GAMAN 2": 2 },
    tendencia: "down",
  },
  {
    id: "V-06",
    folio: "T0602",
    nombre: "Ana López",
    oficina: "COFISEM TEMIXCO",
    telefono: "777 600 3344",
    email: "ana@cofisem.mx",
    activo: true,
    meta: 5,
    actual: 3,
    primaNeta: 6900,
    historial: [4, 3, 3, 4, 3, 3, 0, 0, 0, 0, 0, 0],
    coberturas: { "TAXI BÁSICA 2500": 3 },
    tendencia: "stable",
  },
  {
    id: "V-07",
    folio: "T0701",
    nombre: "Patricia Morales",
    oficina: "COFISEM CUAUTLA",
    telefono: "777 200 3344",
    email: "patricia@cofisem.mx",
    activo: true,
    meta: 10,
    actual: 6,
    primaNeta: 13800,
    historial: [8, 7, 6, 7, 8, 6, 0, 0, 0, 0, 0, 0],
    coberturas: { "TAXI BÁSICA 2500": 4, "TAXI BÁSICA PAGOS 2700": 2 },
    tendencia: "down",
  },
];

const TEND_ICON = {
  up: { icon: "↑", cls: "text-emerald-600", label: "Tendencia positiva" },
  down: { icon: "↓", cls: "text-red-500", label: "Tendencia negativa" },
  stable: { icon: "→", cls: "text-amber-600", label: "Estable" },
};

function MiniHistorialV({ historial, meta }) {
  const max = Math.max(...historial.filter((v) => v > 0), meta, 1);
  return (
    <div className="flex items-end gap-0.5 h-12">
      {historial.map((v, i) => {
        const esFuturo = i > MES_ACT;
        const esActual = i === MES_ACT;
        const metaH = meta / 12;
        const sobreMeta = v >= metaH;
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
                    ? sobreMeta
                      ? "bg-emerald-500"
                      : "bg-[#13193a]"
                    : sobreMeta
                      ? "bg-emerald-300"
                      : "bg-gray-300"
              }`}
              style={{
                height: esFuturo ? 3 : `${Math.max((v / max) * 100, 8)}%`,
              }}
              title={esFuturo ? "" : `${MESES[i]}: ${v}`}
            />
          </div>
        );
      })}
    </div>
  );
}

function PerfilModal({ v, onClose }) {
  const pct = Math.round((v.actual / v.meta) * 100);
  const mejorMes =
    MESES[v.historial.indexOf(Math.max(...v.historial.filter((x) => x > 0)))];
  const cobList = Object.entries(v.coberturas).sort((a, b) => b[1] - a[1]);
  const maxCob = cobList.length > 0 ? cobList[0][1] : 1;
  const t = TEND_ICON[v.tendencia];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(10,15,40,0.55)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-[#13193a] text-white flex items-center justify-center text-sm font-bold shrink-0">
            {v.nombre
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm font-bold text-[#13193a]">{v.nombre}</h2>
              <span className="font-mono text-[11px] text-gray-400">
                {v.folio}
              </span>
              <span className={`text-sm font-bold ${t.cls}`} title={t.label}>
                {t.icon} {t.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {v.oficina} · {v.telefono}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Progreso del mes */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Mes actual
            </p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-black text-[#13193a] tabular-nums">
                {v.actual}
              </p>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  Meta: <strong className="text-[#13193a]">{v.meta}</strong>
                </p>
                <p className="text-xs text-emerald-600 font-bold">
                  ${v.primaNeta.toLocaleString("es-MX")} prima neta
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Avance</span>
                <span
                  className={`font-bold ${pct >= 100 ? "text-emerald-600" : pct >= 80 ? "text-blue-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}
                >
                  {pct}%
                </span>
              </div>
              <div className="h-3 bg-white border border-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${pct >= 100 ? "bg-emerald-500" : pct >= 80 ? "bg-blue-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Historial anual */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Historial anual
              </p>
              <p className="text-[11px] text-gray-400">
                Mejor mes:{" "}
                <strong className="text-[#13193a]">
                  {mejorMes} ({Math.max(...v.historial)} pól.)
                </strong>
              </p>
            </div>
            <MiniHistorialV historial={v.historial} meta={v.meta} />
            <div className="flex mt-1">
              {MESES.map((m, i) => (
                <div key={i} className="flex-1 text-center">
                  <p
                    className={`text-[8px] font-medium ${i === MES_ACT ? "text-[#13193a] font-bold" : "text-gray-300"}`}
                  >
                    {m}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Coberturas más vendidas */}
          {cobList.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Coberturas más vendidas (mes actual)
              </p>
              <div className="space-y-2">
                {cobList.map(([cob, n], i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-700 truncate max-w-56">
                        {cob}
                      </span>
                      <span className="font-bold text-[#13193a] shrink-0 ml-2">
                        {n} pól.
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-[#13193a] transition-all"
                        style={{
                          width: `${(n / maxCob) * 100}%`,
                          opacity: 0.85 - i * 0.15,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datos de contacto */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Contacto
            </p>
            <div className="flex gap-4 text-xs text-gray-600">
              <span>📞 {v.telefono}</span>
              <span>✉️ {v.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────
export default function VentasVendedores() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroOficina, setFiltroOficina] = useState("Todas");
  const [seleccionado, setSeleccionado] = useState(null);
  const [orden, setOrden] = useState("actual"); // actual | meta | nombre

  const filtrados = VENDEDORES.filter((v) => {
    const mb =
      v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.folio.toLowerCase().includes(busqueda.toLowerCase());
    const mo = filtroOficina === "Todas" || v.oficina === filtroOficina;
    return mb && mo;
  }).sort((a, b) => {
    if (orden === "actual") return b.actual - a.actual;
    if (orden === "meta") return b.meta - a.meta;
    return a.nombre.localeCompare(b.nombre);
  });

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Vendedores</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Rendimiento individual y desglose de ventas
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            l: "Vendedores activos",
            v: VENDEDORES.filter((v) => v.activo).length,
            a: "blue",
          },
          {
            l: "Meta global alcanzada",
            v: `${Math.round((VENDEDORES.reduce((s, v) => s + v.actual, 0) / VENDEDORES.reduce((s, v) => s + v.meta, 0)) * 100)}%`,
            a: "emerald",
          },
          {
            l: "Sobre su meta",
            v: VENDEDORES.filter((v) => v.actual >= v.meta).length,
            a: "emerald",
          },
          {
            l: "Sin ventas este mes",
            v: VENDEDORES.filter((v) => v.actual === 0).length,
            a: "red",
          },
        ].map((m) => {
          const c = {
            blue: "bg-blue-50 border-blue-200 text-blue-700",
            emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
            red: "bg-red-50 border-red-200 text-red-600",
          };
          return (
            <div key={m.l} className={`${c[m.a]} border rounded-2xl p-4`}>
              <p className="text-2xl font-bold tabular-nums">{m.v}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.l}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
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
              placeholder="Nombre o folio..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"
            />
          </div>
          <select
            value={filtroOficina}
            onChange={(e) => setFiltroOficina(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none"
          >
            {OFICINAS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none"
          >
            <option value="actual">Ordenar: más pólizas</option>
            <option value="meta">Ordenar: mayor meta</option>
            <option value="nombre">Ordenar: nombre</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {[
                  "#",
                  "Vendedor",
                  "Oficina",
                  "Folio",
                  "Este mes",
                  "Meta",
                  "Avance",
                  "Prima neta",
                  "Tendencia",
                  "Historial",
                  "",
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
              {filtrados.map((v, i) => {
                const pct = Math.round((v.actual / v.meta) * 100);
                const t = TEND_ICON[v.tendencia];
                return (
                  <tr
                    key={v.id}
                    onClick={() => setSeleccionado(v)}
                    className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${v.actual === 0 ? "bg-red-50/20" : ""}`}
                  >
                    <td className="px-4 py-3.5 text-xs font-bold text-gray-400">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#13193a] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
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
                    <td className="px-4 py-3.5 text-sm font-black text-[#13193a] tabular-nums">
                      {v.actual === 0 ? (
                        <span className="text-red-400">—</span>
                      ) : (
                        v.actual
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 tabular-nums">
                      {v.meta}
                    </td>
                    <td className="px-4 py-3.5 w-32">
                      <div className="space-y-0.5">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : pct >= 80 ? "bg-blue-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <p
                          className={`text-[10px] font-bold text-right ${pct >= 100 ? "text-emerald-600" : pct >= 80 ? "text-blue-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}
                        >
                          {pct}%
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-emerald-700 tabular-nums">
                      {v.primaNeta ? (
                        `$${v.primaNeta.toLocaleString("es-MX")}`
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-sm font-bold ${t.cls}`}
                        title={t.label}
                      >
                        {t.icon}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 w-24">
                      <MiniHistorialV historial={v.historial} meta={v.meta} />
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSeleccionado(v);
                        }}
                        className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center"
                      >
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
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{filtrados.length} vendedores</p>
        </div>
      </div>

      {seleccionado && (
        <PerfilModal v={seleccionado} onClose={() => setSeleccionado(null)} />
      )}
    </div>
  );
}
