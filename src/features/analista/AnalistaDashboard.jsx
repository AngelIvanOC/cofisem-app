// ============================================================
// src/features/analista/AnalistaDashboard.jsx
// ============================================================
import { useNavigate } from "react-router-dom";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const OFICINAS = [
  { nombre: "CIVAC", polizas: 30, cobrado: 72000, pctMeta: 100 },
  { nombre: "ZAPATA", polizas: 22, cobrado: 50600, pctMeta: 88 },
  { nombre: "TEMIXCO", polizas: 10, cobrado: 23000, pctMeta: 67 },
  { nombre: "CUAUTLA", polizas: 6, cobrado: 13800, pctMeta: 60 },
];

const PENDIENTES = [
  {
    poliza: "3414001",
    asegurado: "Pedro Ramos",
    oficina: "TEMIXCO",
    tipo: "Pend. aplicar",
  },
  {
    poliza: "3414002",
    asegurado: "Rosa Mendoza",
    oficina: "CIVAC",
    tipo: "Pend. aplicar",
  },
  {
    poliza: "3410888",
    asegurado: "José Martínez",
    oficina: "CIVAC",
    tipo: "Pago vencido",
  },
  {
    poliza: "3411002",
    asegurado: "Carmen López",
    oficina: "TEMIXCO",
    tipo: "Por vencer",
  },
];

const COBROS_DIA = [
  {
    asegurado: "Angel Ivan Ortega",
    poliza: "3413241",
    monto: 785.7,
    forma: "Efectivo",
    hora: "09:13",
  },
  {
    asegurado: "María García López",
    poliza: "3413198",
    monto: 2200.0,
    forma: "Efectivo",
    hora: "10:42",
  },
  {
    asegurado: "Roberto Díaz",
    poliza: "3413167",
    monto: 637.0,
    forma: "Transferencia",
    hora: "11:30",
  },
];

const TIPO_CLS = {
  "Pend. aplicar": "bg-blue-50 text-blue-700",
  "Pago vencido": "bg-red-50 text-red-600",
  "Por vencer": "bg-amber-50 text-amber-700",
};

function BarHoriz({ pct, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
      </div>
      <span
        className="text-[11px] font-bold tabular-nums"
        style={{ color, minWidth: 32 }}
      >
        {pct}%
      </span>
    </div>
  );
}

export default function AnalistaDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo =
    h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  const totalPolizas = OFICINAS.reduce((s, o) => s + o.polizas, 0);
  const totalCobrado = OFICINAS.reduce((s, o) => s + o.cobrado, 0);

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa]">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 capitalize">{HOY}</p>
            <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">
              {saludo},{" "}
              <span className="font-light">
                {usuario?.nombre ?? "Analista"}
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Panel de analista · Todas las oficinas
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/polizas")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all"
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
                  d="M9 12h3.75M9 15h3.75m-5.25 6h12A2.25 2.25 0 0021 18.75V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12.75A2.25 2.25 0 005.25 21z"
                />
              </svg>
              Pólizas pendientes
            </button>
            <button
              onClick={() => navigate("/reportes")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Reportes
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Pólizas vigentes",
              value: "186",
              sub: "+5 esta semana",
              accent: "#059669",
              path: "/polizas",
            },
            {
              label: "Pend. de aplicar",
              value: "4",
              sub: "Requieren acción",
              accent: "#3b82f6",
              path: "/polizas",
            },
            {
              label: "Cuotas vencidas",
              value: "7",
              sub: "Sin cobrar",
              accent: "#ef4444",
              path: "/pagos",
            },
            {
              label: "Cortes pendientes",
              value: "1/4",
              sub: "1 oficina abierta",
              accent: "#d97706",
              path: "/corte-diario",
            },
          ].map((k) => (
            <button
              key={k.label}
              onClick={() => navigate(k.path)}
              className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div
                className="w-8 h-1 rounded-full mb-3"
                style={{ background: k.accent }}
              />
              <p className="text-2xl font-black text-[#13193a] tabular-nums">
                {k.value}
              </p>
              <p className="text-xs font-semibold text-gray-600 mt-1">
                {k.label}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>
            </button>
          ))}
        </div>

        {/* Fila 2: Oficinas + Pendientes */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Producción por oficina — 3/5 */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-[#13193a]">
                Producción mensual por oficina
              </p>
              <p className="text-xs text-gray-400">
                {totalPolizas} pólizas · ${(totalCobrado / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {OFICINAS.map((o) => (
                <div key={o.nombre} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-bold text-[#13193a]">
                      {o.nombre}
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-gray-500">{o.polizas} pól.</p>
                      <p className="text-xs font-bold text-emerald-700">
                        ${(o.cobrado / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>
                  <BarHoriz
                    pct={o.pctMeta}
                    color={
                      o.pctMeta >= 100
                        ? "#059669"
                        : o.pctMeta >= 80
                          ? "#3b82f6"
                          : o.pctMeta >= 60
                            ? "#d97706"
                            : "#ef4444"
                    }
                  />
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Promedio de meta global</p>
                <p className="text-sm font-black text-[#13193a]">78%</p>
              </div>
            </div>
          </div>

          {/* Acciones pendientes — 2/5 */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-[#13193a]">
                Requieren acción
              </p>
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {PENDIENTES.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {PENDIENTES.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#13193a] truncate">
                      {p.asegurado}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {p.poliza} · {p.oficina}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${TIPO_CLS[p.tipo]}`}
                  >
                    {p.tipo}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-50">
              <button
                onClick={() => navigate("/polizas")}
                className="w-full py-2 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] transition-all"
              >
                Ver todas las pólizas
              </button>
            </div>
          </div>
        </div>

        {/* Fila 3: Cobros del día + Corte */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cobros registrados hoy */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-[#13193a]">
                Cobros registrados hoy
              </p>
              <p className="text-xs font-bold text-emerald-700">
                ${COBROS_DIA.reduce((s, c) => s + c.monto, 0).toFixed(2)}
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {COBROS_DIA.map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#13193a]">
                      {c.asegurado}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {c.forma} · {c.hora}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-emerald-700 shrink-0">
                    ${c.monto.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Estado de cortes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-[#13193a] mb-4">
              Estado de cortes — hoy
            </p>
            <div className="space-y-3">
              {[
                { oficina: "COFISEM AV. E.ZAPATA", cerrado: true, polizas: 3 },
                { oficina: "OFICINA CIVAC", cerrado: true, polizas: 4 },
                { oficina: "COFISEM TEMIXCO", cerrado: false, polizas: 2 },
                { oficina: "COFISEM CUAUTLA", cerrado: true, polizas: 1 },
              ].map((c) => (
                <div key={c.oficina} className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${c.cerrado ? "bg-emerald-500" : "bg-amber-500"}`}
                  />
                  <p className="text-xs text-gray-700 flex-1">{c.oficina}</p>
                  <p className="text-[11px] text-gray-400">{c.polizas} pól.</p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.cerrado ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {c.cerrado ? "Cerrado" : "Abierto"}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/corte-diario")}
              className="w-full mt-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Ver corte completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
