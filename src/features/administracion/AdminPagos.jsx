import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Check, Loader2, Search } from "lucide-react";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";

// Puntos de progreso de cuotas
function CuotaDots({ numCuota, totalCuotas, estatus }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalCuotas }, (_, i) => {
        const n = i + 1;
        let cls;
        if (n < numCuota)        cls = "bg-emerald-400";
        else if (n === numCuota) cls = estatus === "PAGADO" ? "bg-emerald-500" : "bg-blue-400";
        else                     cls = "bg-gray-200";
        return <div key={n} className={`w-2 h-2 rounded-full ${cls}`} />;
      })}
      <span className="text-[10px] text-gray-400 ml-0.5 tabular-nums">{numCuota}/{totalCuotas}</span>
    </div>
  );
}

function fmt$(n) {
  return `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

function fmtFecha(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
}

export default function AdminPagos({ usuario }) {
  const [pagos,      setPagos]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [busqueda,   setBusqueda]   = useState("");
  const [filtroOf,   setFiltroOf]   = useState("Todas");
  const [filtroEst,  setFiltroEst]  = useState("ADEUDO");

  const cargar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pagos")
        .select(`
          id, poliza_id, monto, fecha_pago, estatus, num_cuota,
          operador:usuarios!pagos_recibido_por_fkey(nombre, apellido, id_muestra),
          polizas(constancia, numero_poliza, forma_pago, estatus,
            clientes(nombre, apellido),
            oficinas(nombre))
        `)
        .in("estatus", ["ADEUDO", "PAGADO"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPagos(
        (data ?? []).map((a) => {
          const pol        = a.polizas;
          const op         = a.operador;
          const totalCuotas = pol?.forma_pago === "CONTADO" ? 1 : 4;
          const opNombre   = op
            ? `${op.nombre ?? ""} ${op.apellido ?? ""}`.trim() || op.id_muestra
            : "—";
          return {
            id:          a.id,
            constancia:  pol?.constancia || pol?.numero_poliza || "—",
            asegurado:   pol ? `${pol.clientes?.nombre ?? ""} ${pol.clientes?.apellido ?? ""}`.trim() : "—",
            oficina:     pol?.oficinas?.nombre ?? "—",
            formaPago:   pol?.forma_pago ?? "—",
            numCuota:    a.num_cuota ?? 1,
            totalCuotas,
            monto:       a.monto,
            fecha:       a.fecha_pago,
            operador:    opNombre,
            estatus:     a.estatus,
            estatusPol:  pol?.estatus ?? "",
          };
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const aplicar = async (pagoId) => {
    setProcesando(pagoId);
    try {
      const { error } = await supabase
        .from("pagos")
        .update({ estatus: "PAGADO", aplicado_por: usuario?.id ?? null })
        .eq("id", pagoId);
      if (error) throw error;
      await cargar();
    } catch (e) {
      console.error(e);
    } finally {
      setProcesando(null);
    }
  };

  // Stats
  const nAdeudo    = pagos.filter((p) => p.estatus === "ADEUDO").length;
  const nPagado    = pagos.filter((p) => p.estatus === "PAGADO").length;
  const montoPend  = pagos.filter((p) => p.estatus === "ADEUDO").reduce((s, p) => s + (p.monto || 0), 0);

  // Oficinas para filtro
  const oficinas = ["Todas", ...new Set(pagos.map((p) => p.oficina).filter(Boolean))];

  // Filtrado
  const filtrados = pagos.filter((p) => {
    const q = busqueda.toLowerCase();
    const mQ  = !q || p.constancia.toLowerCase().includes(q) || p.asegurado.toLowerCase().includes(q);
    const mOf = filtroOf  === "Todas"  || p.oficina  === filtroOf;
    const mEs = filtroEst === "Todos"  || p.estatus  === filtroEst;
    return mQ && mOf && mEs;
  });

  const { page, setPage, paginated, totalPages, total } = usePagination(filtrados, 10);

  const selCls = "px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white";

  return (
    <div className="p-4 md:p-6 space-y-4 min-h-full bg-gray-50">
      {/* Encabezado + stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#13193a]">Pagos</h1>
          <p className="text-xs text-gray-400 mt-0.5">Aplicación de pagos confirmados</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Por aplicar</p>
            <p className="text-lg font-bold text-amber-500 tabular-nums">{nAdeudo}</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-right">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Monto pendiente</p>
            <p className="text-lg font-bold text-[#13193a] tabular-nums">{fmt$(montoPend)}</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-right">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Aplicados</p>
            <p className="text-lg font-bold text-emerald-600 tabular-nums">{nPagado}</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
              placeholder="Póliza o asegurado..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"
            />
          </div>

          <select
            value={filtroOf}
            onChange={(e) => { setFiltroOf(e.target.value); setPage(1); }}
            className={selCls}
          >
            {oficinas.map((o) => <option key={o}>{o}</option>)}
          </select>

          {/* Toggle estado */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {[
              { val: "ADEUDO", label: "Por aplicar" },
              { val: "PAGADO", label: "Aplicados"   },
              { val: "Todos",  label: "Todos"        },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => { setFiltroEst(opt.val); setPage(1); }}
                className={`px-4 py-2 text-xs font-medium transition-all ${
                  filtroEst === opt.val
                    ? "bg-[#13193a] text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Póliza", "Asegurado", "Oficina", "Cuotas", "Monto", "Recibido", "Estatus", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                    No se encontraron pagos.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-50/60 transition-colors ${
                      p.estatus === "ADEUDO" ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <td className="px-5 py-2 font-mono text-xs font-bold text-[#13193a]">
                      {p.constancia}
                    </td>
                    <td className="px-5 py-2 text-xs font-semibold text-gray-700">
                      {p.asegurado}
                    </td>
                    <td className="px-5 py-2 text-xs text-gray-500">
                      {p.oficina}
                    </td>
                    <td className="px-5 py-2">
                      <CuotaDots
                        numCuota={p.numCuota}
                        totalCuotas={p.totalCuotas}
                        estatus={p.estatus}
                      />
                    </td>
                    <td className="px-5 py-2 text-xs font-semibold text-emerald-600 tabular-nums">
                      {fmt$(p.monto)}
                    </td>
                    <td className="px-5 py-2">
                      <p className="text-xs text-gray-700">{fmtFecha(p.fecha)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.operador}</p>
                    </td>
                    <td className="px-5 py-2">
                      <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        p.estatus === "PAGADO"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {p.estatus === "PAGADO" ? "Aplicado" : "Por aplicar"}
                      </span>
                    </td>
                    <td className="px-5 py-2">
                      {p.estatus === "ADEUDO" && (
                        <button
                          onClick={() => aplicar(p.id)}
                          disabled={procesando === p.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all"
                        >
                          {procesando === p.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Check className="w-3.5 h-3.5" />
                          }
                          Aplicar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Paginator
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={10}
          onPage={setPage}
        />
      </div>
    </div>
  );
}
