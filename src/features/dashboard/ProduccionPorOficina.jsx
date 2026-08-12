import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { BarChart3, Loader2 } from "lucide-react";

// Oficina E. Zapata: única oficina con dos operadoras; se desglosa una fila por operadora.
const OFICINA_EZAPATA_ID = 1;

// México Central no usa horario de verano desde 2022 → offset fijo. Se anexa a los
// límites de fecha para que la comparación contra created_at (timestamptz) no
// dependa de la zona horaria de la sesión de Postgres (que es UTC en Supabase).
const TZ_OFFSET = "-06:00";

const COLOR_VENTAS = "#13193a";
const COLOR_NUEVAS = "#059669";
const COLOR_RENOVADAS = "#3b82f6";

function fmt$(n) {
  return (
    "$" +
    new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(n ?? 0)
  );
}

function codigoOperador(nombre = "") {
  const c = nombre.trim().slice(0, 3).toUpperCase();
  return c || "???";
}

function esRenovada(constancia, numeroPoliza) {
  const m = (constancia || numeroPoliza || "").match(/-(\d+)$/);
  return !!(m && parseInt(m[1], 10) >= 2);
}

/**
 * Producción por oficina del mes en curso.
 * variant="real"       → cifras reales (admin): $ y cantidades de pólizas.
 * variant="porcentaje" → solo % de participación del mes (operador), sin montos ni cantidades.
 * fillHeight            → ocupa el 100% de su contenedor y hace scroll interno en la lista
 *                          (para paneles de altura fija, ej. dashboard de admin sin scroll de página).
 */
export default function ProduccionPorOficina({
  variant = "real",
  fillHeight = false,
}) {
  const [cargando, setCargando] = useState(true);
  const [grupos, setGrupos] = useState([]);
  const [metrica, setMetrica] = useState("ventas");

  const cargar = useCallback(async () => {
    setCargando(true);
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth() + 1;
    const ultimo = new Date(anio, mes, 0).getDate();
    const inicio = `${anio}-${String(mes).padStart(2, "0")}-01`;
    const fin = `${anio}-${String(mes).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("polizas")
      .select(
        `
        id, constancia, numero_poliza, oficina_id, creado_por,
        oficinas(nombre),
        coberturas(prima_total),
        usuarios!polizas_creado_por_fkey(nombre)
      `,
      )
      .gte("created_at", `${inicio}T00:00:00${TZ_OFFSET}`)
      .lte("created_at", `${fin}T23:59:59${TZ_OFFSET}`)
      .in("estatus", ["VIGENTE", "POR VENCER", "VENCIDA"]);

    if (error)
      console.error("Error cargando producción por oficina:", error.message);

    const mapa = new Map();
    for (const p of data ?? []) {
      const esZapata = p.oficina_id === OFICINA_EZAPATA_ID;
      const key = esZapata ? `z-${p.creado_por}` : p.oficina_id;
      const nombreOf = p.oficinas?.nombre ?? "Sin oficina";
      const label = esZapata
        ? `${nombreOf} - OP${codigoOperador(p.usuarios?.nombre)}`
        : nombreOf;

      if (!mapa.has(key))
        mapa.set(key, {
          key,
          label,
          ventas: 0,
          nuevas: 0,
          renovadas: 0,
          total: 0,
        });
      const g = mapa.get(key);
      g.ventas += Number(p.coberturas?.prima_total ?? 0);
      if (esRenovada(p.constancia, p.numero_poliza)) g.renovadas++;
      else g.nuevas++;
      g.total++;
    }

    setGrupos([...mapa.values()]);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totalVentas = useMemo(
    () => grupos.reduce((s, g) => s + g.ventas, 0),
    [grupos],
  );
  const totalPolizas = useMemo(
    () => grupos.reduce((s, g) => s + g.total, 0),
    [grupos],
  );
  const totalGlobal = metrica === "ventas" ? totalVentas : totalPolizas;

  const campo = metrica === "ventas" ? "ventas" : "total";
  const valor = (g) => g[campo];
  const ordenados = useMemo(
    () => [...grupos].sort((a, b) => b[campo] - a[campo]),
    [grupos, campo],
  );

  const toggleCls = (activo) =>
    `px-3 py-1 text-xs font-medium transition-all ${
      activo ? "bg-[#13193a] text-white" : "text-gray-500 hover:bg-gray-50"
    }`;

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${
        fillHeight ? "h-full flex flex-col" : ""
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4 pb-2 border-b border-gray-50 gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#13193a]" />
          <p className="text-sm font-bold text-[#13193a]">
            Producción por oficina — este mes
          </p>
        </div>

        <div className="flex items-center gap-3">
          {variant === "real" && !cargando && (
            <p className="text-xs text-gray-400 font-semibold">
              {totalPolizas} pól. · {fmt$(totalVentas)}
            </p>
          )}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden shrink-0">
            <button
              className={toggleCls(metrica === "ventas")}
              onClick={() => setMetrica("ventas")}
            >
              Ventas
            </button>
            <button
              className={toggleCls(metrica === "polizas")}
              onClick={() => setMetrica("polizas")}
            >
              Pólizas
            </button>
          </div>
        </div>
      </div>

      {metrica === "polizas" && !cargando && ordenados.length > 0 && (
        <div className="flex items-center gap-4 px-5 pt-1 text-[11px] text-gray-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: COLOR_NUEVAS }}
            />
            Nuevas
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: COLOR_RENOVADAS }}
            />
            Renovadas
          </span>
        </div>
      )}

      <div
        className={`p-5 pb-2 space-y-4 ${fillHeight ? "flex-1 min-h-0 overflow-y-auto" : ""}`}
      >
        {cargando ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Cargando…</span>
          </div>
        ) : ordenados.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">
            Sin producción registrada este mes.
          </p>
        ) : (
          ordenados.map((g) => {
            const pct = totalGlobal > 0 ? (valor(g) / totalGlobal) * 100 : 0;
            const nuevasPct =
              totalGlobal > 0 ? (g.nuevas / totalGlobal) * 100 : 0;
            const renovadasPct =
              totalGlobal > 0 ? (g.renovadas / totalGlobal) * 100 : 0;

            return (
              <div key={g.key}>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <p className="text-xs font-bold text-[#13193a] truncate">
                    {g.label}
                  </p>
                  <span className="text-xs text-gray-500 shrink-0 tabular-nums">
                    {variant === "porcentaje"
                      ? `${pct.toFixed(0)}%`
                      : metrica === "ventas"
                        ? fmt$(g.ventas)
                        : `${g.nuevas} nuevas · ${g.renovadas} ren.`}
                  </span>
                </div>

                {metrica === "ventas" ? (
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-r transition-all duration-700"
                      style={{ width: `${pct}%`, background: COLOR_VENTAS }}
                    />
                  </div>
                ) : (
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex gap-[2px]">
                    <div
                      className="h-2 rounded-r transition-all duration-700"
                      style={{
                        width: `${nuevasPct}%`,
                        background: COLOR_NUEVAS,
                      }}
                    />
                    <div
                      className="h-2 rounded-r transition-all duration-700"
                      style={{
                        width: `${renovadasPct}%`,
                        background: COLOR_RENOVADAS,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
