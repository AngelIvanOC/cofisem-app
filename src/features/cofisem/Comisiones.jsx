// ============================================================
// src/features/cofisem/Comisiones.jsx
// Vales de comisión del vendedor, UNO POR CADA PAGO (cuota) de las pólizas
// que vendió. Solo pólizas con vendedor real (vendedor_id distinto de NULL
// y de 1=COFISEM, "sin vendedor").
//
// Cada pago aparece desde que se crea la póliza. El MONTO lo calcula el
// sistema (comisionesCalculo.js): % de la regla × prima neta de ESE pago.
// Un pago solo se puede capturar cuando ya se cobró y tiene prima total y
// neta; entonces la encargada solo agrega folio, fecha de pago y
// comprobante. El monto queda fijo (se guarda con su % y prima neta).
//
//   · Pólizas anteriores a comisiones_auto_desde a las que les falta algún
//     dato: se capturan a mano, como antes (origen MANUAL).
//   · Monto distinto al calculado: se pide a administración una "solicitud
//     de monto manual"; si la aprueba, se captura con ese monto (SOLICITUD).
//
// La tabla va UNA FILA POR PÓLIZA (como /pagos); el modal es en dos pasos:
// 1) elegir el pago, 2) capturar su vale (o pedir monto manual).
// ============================================================
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  HandCoins,
  CheckCircle2,
  Loader2,
  Search,
  X,
  Trash2,
  ChevronLeft,
  Pencil,
  Paperclip,
  Lock,
} from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { ComprobanteField } from "../corte/CompletarPolizaModal";
import {
  subirComprobante,
  verComprobante,
  MAX_COMPROBANTE_BYTES,
  COMPROBANTE_BUCKET,
} from "../../services/comprobantesPago";
import { hoyISO } from "../../utils/fecha";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import { cuotasDePoliza } from "../pagos/cuotasCofisem";
import {
  SELECT_POLIZA_COMISION,
  cargarContextoComisiones,
  calcularComisionCuota,
  esEsquemaAutomatico,
} from "./comisionesCalculo";

const n = (v) => parseFloat(v) || 0;
const $ = (v) =>
  `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";
const pctTxt = (p) =>
  `${Number(p).toLocaleString("es-MX", { maximumFractionDigits: 3 })}%`;

const FILTROS = [
  { k: "PENDIENTE", label: "Por capturar" },
  { k: "CAPTURADO", label: "Al corriente" },
  { k: "TODAS", label: "Todas" },
];

const arreglo = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// Cómo se puede capturar el vale de un pago.
//   CAPTURADA  ya tiene vale.
//   AUTO       monto calculado por el sistema (lo normal).
//   SOLICITUD  administración aprobó un monto manual.
//   MANUAL     póliza del esquema anterior a la que le falta algún dato.
//   EN_REVISION hay una solicitud de monto manual sin resolver: se espera
//              a administración antes de capturar.
//   BLOQUEADA  aún no se puede (falta cobro, prima, tipo o regla).
function modoCaptura(calc, comision, aprobada, esAuto, pendiente) {
  if (comision) return "CAPTURADA";
  if (!calc.cobrada) return "BLOQUEADA";
  if (pendiente) return "EN_REVISION";
  if (aprobada) return "SOLICITUD";
  if (calc.estado === "LISTA") return "AUTO";
  if (!esAuto) return "MANUAL";
  return "BLOQUEADA";
}
const CAPTURABLE = ["AUTO", "SOLICITUD", "MANUAL"];

function agruparPoliza(p, ctx) {
  const comisiones = arreglo(p.comisiones_cofisem);
  const solicitudes = arreglo(p.comision_solicitudes).sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? ""),
  );
  const esAuto = esEsquemaAutomatico(p, ctx.autoDesde);
  const cuotas = cuotasDePoliza(p)
    .sort((a, b) => a.num_cuota - b.num_cuota)
    .map((c) => {
      const calc = calcularComisionCuota(p, c, ctx);
      const comision = comisiones.find((x) => x.num_cuota === c.num_cuota) ?? null;
      const deCuota = solicitudes.filter((s) => s.num_cuota === c.num_cuota);
      const pendiente = deCuota.find((s) => s.estatus === "PENDIENTE") ?? null;
      const aprobada = deCuota.find((s) => s.estatus === "APROBADA") ?? null;
      const rechazada =
        !pendiente && !aprobada ? (deCuota.find((s) => s.estatus === "RECHAZADA") ?? null) : null;
      return {
        numCuota: c.num_cuota,
        calc,
        comision,
        pendiente,
        aprobada,
        rechazada,
        modo: modoCaptura(calc, comision, aprobada, esAuto, pendiente),
      };
    });
  const porCapturar = cuotas.filter((c) => CAPTURABLE.includes(c.modo));
  const cobradas = cuotas.filter((c) => c.calc.cobrada);
  return {
    poliza: p,
    esAuto,
    cuotas,
    porCapturar,
    cobradas,
    conVale: cuotas.filter((c) => c.comision).length,
    totalVales: cuotas.reduce((s, c) => s + n(c.comision?.monto), 0),
    ultimoCobro:
      cobradas
        .map((c) => c.calc.fechaCobro)
        .sort()
        .at(-1) ?? null,
  };
}

// Verde = vale capturado · ámbar = listo para capturar · rojo = cobrado
// pero le falta un dato · gris = aún no se cobra.
function colorCuota(c) {
  if (c.comision) return "bg-emerald-500";
  if (CAPTURABLE.includes(c.modo)) return "bg-amber-400";
  if (c.modo === "EN_REVISION") return "bg-blue-300";
  if (c.calc.cobrada) return "bg-rose-400";
  return "bg-gray-200";
}
function estadoCuotaTxt(c) {
  if (c.comision) return `vale ${$(c.comision.monto)}`;
  if (CAPTURABLE.includes(c.modo)) return "lista para capturar";
  if (c.modo === "EN_REVISION") return "monto manual en revisión";
  return c.calc.motivo.toLowerCase();
}

function CuotasDots({ cuotas }) {
  return (
    <div className="flex items-center gap-1">
      {cuotas.map((c) => (
        <div
          key={c.numCuota}
          className={`w-2 h-2 rounded-full ${colorCuota(c)}`}
          title={`Pago ${c.numCuota}: ${estadoCuotaTxt(c)}`}
        />
      ))}
    </div>
  );
}

export default function Comisiones({ usuario }) {
  const [polizas, setPolizas] = useState([]);
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filtro, setFiltro] = useState("PENDIENTE");
  const [busqueda, setBusqueda] = useState("");
  const [modalPolizaId, setModalPolizaId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("polizas_cofisem")
        .select(
          `${SELECT_POLIZA_COMISION},
          comisiones_cofisem(id, num_cuota, monto, fecha_pago, comprobante_url, folio, porcentaje, prima_neta_base, origen),
          comision_solicitudes(id, num_cuota, monto, motivo, estatus, nota_resolucion, created_at)`,
        )
        .not("vendedor_id", "is", null)
        .neq("vendedor_id", 1);
      // Comisiones de toda la oficina (las lleva la encargada).
      if (usuario?.oficina_id)
        query = query.eq("oficina_id", usuario.oficina_id);
      const [{ data, error }, contexto] = await Promise.all([
        query,
        cargarContextoComisiones(),
      ]);
      if (error) throw error;
      setPolizas(data ?? []);
      setCtx(contexto);
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, [usuario?.oficina_id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Todas las pólizas con vendedor: sus pagos aparecen desde que se crean.
  // Primero las que tienen algo por capturar, luego por cobro más reciente.
  const grupos = useMemo(
    () =>
      ctx
        ? polizas
            .map((p) => agruparPoliza(p, ctx))
            .sort(
              (a, b) =>
                (b.porCapturar.length > 0) - (a.porCapturar.length > 0) ||
                (b.ultimoCobro ?? "").localeCompare(a.ultimoCobro ?? "") ||
                b.poliza.id - a.poliza.id,
            )
        : [],
    [polizas, ctx],
  );

  const porFiltro = grupos.filter((g) => {
    if (filtro === "TODAS") return true;
    return filtro === "CAPTURADO"
      ? g.porCapturar.length === 0 && g.conVale > 0
      : g.porCapturar.length > 0;
  });
  const q = busqueda.trim().toLowerCase();
  const visibles = q
    ? porFiltro.filter((g) =>
        [
          g.poliza.aseguradora,
          g.poliza.numero_poliza,
          g.poliza.vendedor_nombre,
          g.poliza.asegurado_nombre,
        ]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q)),
      )
    : porFiltro;

  const pendientesCount = grupos.filter((g) => g.porCapturar.length > 0).length;
  const totalCapturado = grupos.reduce((s, g) => s + g.totalVales, 0);
  const grupoAbierto = grupos.find((g) => g.poliza.id === modalPolizaId) ?? null;

  const {
    page,
    setPage,
    totalPages,
    paginated: visiblesPag,
    total,
  } = usePagination(visibles, 10);

  // Reemplaza (o quita) el vale de UN pago dentro de la póliza.
  function ponerComision(polizaId, numCuota, comision) {
    setPolizas((prev) =>
      prev.map((p) => {
        if (p.id !== polizaId) return p;
        const otras = arreglo(p.comisiones_cofisem).filter((c) => c.num_cuota !== numCuota);
        return { ...p, comisiones_cofisem: comision ? [...otras, comision] : otras };
      }),
    );
  }

  function agregarSolicitud(polizaId, solicitud) {
    setPolizas((prev) =>
      prev.map((p) =>
        p.id === polizaId
          ? { ...p, comision_solicitudes: [...arreglo(p.comision_solicitudes), solicitud] }
          : p,
      ),
    );
  }

  async function eliminarComision(p, c) {
    const v = c.comision;
    if (!v) return;
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar este vale?",
      html: `Se borrará el vale de <strong>${$(v.monto)}</strong> del pago <strong>${c.numCuota}</strong> de la póliza <strong>${p.numero_poliza || "—"}</strong> y su comprobante (si tenía).`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    try {
      const { error } = await supabase
        .from("comisiones_cofisem")
        .delete()
        .eq("poliza_cofisem_id", p.id)
        .eq("num_cuota", c.numCuota);
      if (error) throw error;
      if (v.comprobante_url) {
        await supabase.storage.from(COMPROBANTE_BUCKET).remove([v.comprobante_url]);
      }
      ponerComision(p.id, c.numCuota, null);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: e.message,
        confirmButtonColor: "#13193a",
      });
    }
  }

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1447e6] flex items-center gap-2">
          <HandCoins className="w-6 h-6" />
          Comisiones
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Un vale por cada pago cobrado de pólizas con vendedor. El monto lo
          calcula el sistema; solo se captura folio, fecha y comprobante.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-600 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por aseguradora, póliza, vendedor o asegurado…"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] bg-white"
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100 w-fit">
              {FILTROS.map((f) => (
                <button
                  key={f.k}
                  type="button"
                  onClick={() => setFiltro(f.k)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    filtro === f.k
                      ? "bg-[#1447e6] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f.label}
                  {f.k === "PENDIENTE" && pendientesCount > 0 && (
                    <span
                      className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filtro === f.k ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}
                    >
                      {pendientesCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">
              Total capturado:{" "}
              <strong className="text-[#1447e6]">{$(totalCapturado)}</strong>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando…
          </div>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
            <span className="text-sm font-semibold">
              Sin pólizas en este filtro.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Póliza",
                    "Aseguradora",
                    "Vendedor",
                    "Asegurado",
                    "Pagos",
                    "Vales",
                    "Último cobro",
                    "Acción",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 py-2 whitespace-nowrap ${h === "Vales" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visiblesPag.map((g) => {
                  const p = g.poliza;
                  const pendientes = g.porCapturar.length;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-2 font-mono font-bold text-[#1447e6] whitespace-nowrap">
                        {p.numero_poliza || "—"}
                      </td>
                      <td className="px-4 py-2 font-semibold text-gray-700 whitespace-nowrap">
                        {p.aseguradora || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                        {p.vendedor_nombre || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700 whitespace-nowrap max-w-[160px] truncate">
                        {p.asegurado_nombre || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <CuotasDots cuotas={g.cuotas} />
                          <span className="text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                            {g.conVale}/{g.cuotas.length} con vale
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {g.totalVales > 0 ? (
                          $(g.totalVales)
                        ) : (
                          <span className="text-gray-300 font-normal">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                        {fmt(g.ultimoCobro)}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => setModalPolizaId(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                            pendientes > 0
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "border border-[#1447e6]/20 text-[#1447e6] hover:bg-[#1447e6]/5"
                          }`}
                        >
                          {pendientes > 0
                            ? `Capturar vale${pendientes > 1 ? ` (${pendientes})` : ""}`
                            : "Ver pagos"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Paginator
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={10}
              onPage={setPage}
            />
          </div>
        )}
      </div>

      <ModalVales
        key={modalPolizaId ?? "cerrado"}
        grupo={grupoAbierto}
        usuario={usuario}
        onClose={() => setModalPolizaId(null)}
        onGuardado={ponerComision}
        onEliminar={eliminarComision}
        onSolicitud={agregarSolicitud}
      />
    </div>
  );
}

// Modal en pasos: lista de pagos → vale de un pago (o solicitud de monto
// manual). Si solo hay un pago por capturar abre directo en su vale. Al
// guardar vuelve a la lista.
function ModalVales({ grupo, usuario, onClose, onGuardado, onEliminar, onSolicitud }) {
  const [vista, setVista] = useState(() =>
    grupo && grupo.porCapturar.length === 1 && grupo.cobradas.length === 1
      ? { cuota: grupo.porCapturar[0].numCuota, paso: "vale" }
      : null,
  );
  // Esc: en un paso regresa a la lista; en la lista cierra.
  useEffect(() => {
    if (!grupo) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (vista) setVista(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [grupo, vista, onClose]);
  if (!grupo) return null;
  const p = grupo.poliza;
  const cuota = vista ? (grupo.cuotas.find((c) => c.numCuota === vista.cuota) ?? null) : null;

  let titulo = "Vales de comisión";
  if (cuota && vista.paso === "vale")
    titulo = `${cuota.comision ? "Editar" : "Capturar"} vale · Pago ${cuota.numCuota}`;
  if (cuota && vista.paso === "solicitud")
    titulo = `Solicitar monto manual · Pago ${cuota.numCuota}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 min-w-0">
            {cuota && (
              <button
                type="button"
                onClick={() => setVista(null)}
                title="Volver a los pagos"
                className="w-8 h-8 -ml-2 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#1447e6]">{titulo}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                <span className="font-mono font-bold text-gray-600">
                  {p.numero_poliza || "—"}
                </span>{" "}
                · {p.asegurado_nombre || "—"} · {p.vendedor_nombre || "—"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {cuota && vista.paso === "vale" ? (
          <FormVale
            poliza={p}
            cuota={cuota}
            usuario={usuario}
            onCancel={() => setVista(null)}
            onSaved={(data) => {
              onGuardado(p.id, cuota.numCuota, data);
              setVista(null);
            }}
            onSolicitar={() => setVista({ cuota: cuota.numCuota, paso: "solicitud" })}
          />
        ) : cuota && vista.paso === "solicitud" ? (
          <FormSolicitud
            poliza={p}
            cuota={cuota}
            usuario={usuario}
            onCancel={() => setVista(null)}
            onSaved={(sol) => {
              onSolicitud(p.id, sol);
              setVista(null);
            }}
          />
        ) : (
          <ListaCuotas
            grupo={grupo}
            onVale={(c) => setVista({ cuota: c.numCuota, paso: "vale" })}
            onSolicitar={(c) => setVista({ cuota: c.numCuota, paso: "solicitud" })}
            onEliminar={(c) => onEliminar(p, c)}
          />
        )}
      </div>
    </div>
  );
}

// "10% de $1,500.00 de prima neta = $150.00"
function DetalleCalculo({ calc }) {
  if (calc.porcentaje == null || !calc.primaNeta) return null;
  return (
    <span>
      {pctTxt(calc.porcentaje)} de {$(calc.primaNeta)} de prima neta ={" "}
      <strong className="text-gray-700">{$(calc.monto)}</strong>
    </span>
  );
}

function ListaCuotas({ grupo, onVale, onSolicitar, onEliminar }) {
  return (
    <div className="p-5 space-y-3">
      {/* Resumen en una línea */}
      <div className="flex items-center justify-between gap-3 px-1 text-xs text-gray-500">
        <span>
          <strong className="text-gray-700">{grupo.cobradas.length}</strong> de{" "}
          {grupo.cuotas.length} pagos cobrados ·{" "}
          <strong className="text-gray-700">{grupo.conVale}</strong> con vale
        </span>
        <span>
          Pagado <strong className="text-[#1447e6]">{$(grupo.totalVales)}</strong>
        </span>
      </div>

      <div className="space-y-2">
        {grupo.cuotas.map((c) => {
          const v = c.comision;
          const capturable = CAPTURABLE.includes(c.modo);
          const bloqueadaCobrada = !v && !capturable && c.calc.cobrada && c.modo !== "EN_REVISION";
          const circulo = v
            ? "bg-emerald-100 text-emerald-700"
            : capturable
              ? "bg-amber-100 text-amber-700"
              : bloqueadaCobrada
                ? "bg-rose-100 text-rose-600"
                : "bg-gray-100 text-gray-400";
          const monto = v ? v.monto : c.aprobada ? c.aprobada.monto : c.calc.monto;
          const pct = v ? v.porcentaje : c.aprobada ? null : c.calc.porcentaje;
          const base = v ? v.prima_neta_base : c.calc.primaNeta;
          // Línea secundaria: un solo dato, el más útil según el estado.
          let sub;
          if (v) sub = <>Pagado {fmt(v.fecha_pago)}{v.folio && <> · <span className="font-mono">{v.folio}</span></>}</>;
          else if (c.pendiente) sub = <span className="text-amber-700">Monto manual de {$(c.pendiente.monto)} en revisión</span>;
          else if (c.rechazada) sub = <span className="text-red-600">Monto manual rechazado{c.rechazada.nota_resolucion ? `: ${c.rechazada.nota_resolucion}` : ""}</span>;
          else if (bloqueadaCobrada) sub = <span className="text-rose-600">{c.calc.motivo}</span>;
          else if (c.calc.cobrada) sub = <>Cobrado {fmt(c.calc.fechaCobro)}{c.aprobada && " · monto autorizado"}</>;
          else sub = "Aún no se cobra";
          return (
            <div
              key={c.numCuota}
              className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl border ${
                c.calc.cobrada || v ? "border-gray-200" : "border-dashed border-gray-200 bg-gray-50/60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${circulo}`}>
                  {c.numCuota}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#13193a] truncate">
                    {monto != null ? $(monto) : <span className="text-gray-400 font-semibold">Sin monto</span>}
                    {pct != null && base ? (
                      <span className="ml-1.5 text-[11px] font-normal text-gray-400">
                        {pctTxt(pct)} de {$(base)}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {v?.comprobante_url && (
                  <button
                    type="button"
                    onClick={() => verComprobante(v.comprobante_url)}
                    title="Ver comprobante"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1447e6] hover:bg-[#1447e6]/5"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                )}
                {v ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onVale(c)}
                      title="Editar folio, fecha o comprobante"
                      className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Eliminar vale"
                      onClick={() => onEliminar(c)}
                      className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : capturable ? (
                  <button
                    type="button"
                    onClick={() => onVale(c)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold whitespace-nowrap"
                  >
                    Capturar
                  </button>
                ) : bloqueadaCobrada && !c.pendiente ? (
                  // Bloqueado por un dato faltante: la única salida desde aquí
                  // es pedir un monto manual a administración.
                  <button
                    type="button"
                    onClick={() => onSolicitar(c)}
                    className="px-3 py-1.5 rounded-lg border border-[#1447e6]/20 text-[#1447e6] hover:bg-[#1447e6]/5 text-[11px] font-bold whitespace-nowrap"
                  >
                    Pedir monto
                  </button>
                ) : (
                  <span title={c.calc.motivo} className="text-gray-300">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Vale de UN pago: el monto lo pone el sistema (AUTO) o la solicitud
// aprobada (SOLICITUD); solo en el esquema anterior (MANUAL) se escribe.
// Al editar un vale ya capturado solo cambian folio, fecha y comprobante
// (salvo los MANUAL viejos, que conservan su edición de monto).
function FormVale({ poliza, cuota, usuario, onCancel, onSaved, onSolicitar }) {
  const existente = cuota.comision;
  const origen = existente?.origen ?? (cuota.modo === "SOLICITUD" ? "SOLICITUD" : cuota.modo === "AUTO" ? "AUTO" : "MANUAL");
  const montoEditable = origen === "MANUAL";
  const montoFijo = existente
    ? n(existente.monto)
    : origen === "SOLICITUD"
      ? n(cuota.aprobada?.monto)
      : origen === "AUTO"
        ? n(cuota.calc.monto)
        : null;

  const [valor, setValor] = useState(existente?.monto ?? "");
  // Folio propio del vale — el vale es un movimiento aparte del registro
  // de la póliza y cae en el corte de su fecha_pago, así que lleva su
  // propio folio (ver migracion_folio_por_transaccion.sql).
  const [folio, setFolio] = useState(existente?.folio ?? "");
  const [intento, setIntento] = useState(false);
  const [fechaPago, setFechaPago] = useState(existente?.fecha_pago || hoyISO());
  const [comprobante, setComprobante] = useState(existente?.comprobante_url ?? null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function handleComprobante(file) {
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setError("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setError(null);
    setSubiendo(true);
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/comisiones/${poliza.id}/cuota-${cuota.numCuota}/vale`;
      setComprobante(await subirComprobante(basePath, file));
    } catch (e) {
      setError("No se pudo subir el comprobante: " + e.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    if (!folio.trim()) {
      setIntento(true);
      setError("Captura el folio del vale — con él se ubica este movimiento en el corte.");
      return;
    }
    const monto = montoEditable ? n(valor) : montoFijo;
    if (!(monto > 0)) {
      setError(montoEditable ? "Captura el monto del vale." : "No hay monto calculado para este pago.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      // Con qué se calculó: en uno nuevo AUTO, el % y la prima neta del
      // momento; en uno existente se conservan los que ya tenía.
      const porcentaje = existente
        ? existente.porcentaje
        : origen === "AUTO"
          ? cuota.calc.porcentaje
          : null;
      const base = existente
        ? existente.prima_neta_base
        : origen === "AUTO"
          ? cuota.calc.primaNeta
          : (cuota.calc.primaNeta ?? null);
      const { data, error: err } = await supabase
        .from("comisiones_cofisem")
        .upsert(
          {
            poliza_cofisem_id: poliza.id,
            num_cuota: cuota.numCuota,
            folio: folio.trim(),
            monto,
            porcentaje,
            prima_neta_base: base,
            origen,
            fecha_pago: fechaPago || hoyISO(),
            comprobante_url: comprobante,
            capturado_por: usuario?.id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "poliza_cofisem_id,num_cuota" },
        )
        .select()
        .single();
      if (err) throw err;
      onSaved(data);
    } catch (e) {
      setError("No se pudo guardar la comisión: " + e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <p className="text-xs text-gray-500">
        Pago {cuota.numCuota}
        {cuota.calc.primaTotal ? ` de ${$(cuota.calc.primaTotal)}` : ""} · cobrado el{" "}
        <strong className="text-gray-700">{fmt(cuota.calc.fechaCobro)}</strong>
      </p>
      {origen === "MANUAL" && !existente && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          Póliza anterior al cálculo automático ({cuota.calc.motivo.toLowerCase()}): el
          monto se captura a mano.
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
          Folio del vale{" "}
          <span className={intento && !folio.trim() ? "text-red-500" : "text-gray-300"}>*</span>
        </label>
        <input
          value={folio}
          onChange={(e) => setFolio(e.target.value.toUpperCase())}
          placeholder="Ej. EZ43134"
          autoFocus
          className={`w-full px-3 py-2.5 rounded-xl border bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] ${intento && !folio.trim() ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"}`}
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Distinto al de la póliza — identifica este vale en el corte.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
            Monto {!montoEditable && <Lock className="inline w-3 h-3 -mt-0.5" />}
          </label>
          {montoEditable ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
              />
            </div>
          ) : (
            <div className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-700">
              {$(montoFijo)}
            </div>
          )}
          {!montoEditable && (
            <p className="text-[11px] text-gray-400 mt-1">
              {origen === "SOLICITUD" ? (
                "Autorizado por administración"
              ) : (
                <DetalleCalculo calc={existente ? { porcentaje: existente.porcentaje, primaNeta: existente.prima_neta_base, monto: existente.monto } : cuota.calc} />
              )}
            </p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
            Fecha de pago
          </label>
          <input
            type="date"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
          />
          <p className="text-[11px] text-gray-400 mt-1">Sale restado en el corte de ese día.</p>
        </div>
      </div>

      {origen === "AUTO" && !existente && !cuota.pendiente && (
        <button
          type="button"
          onClick={onSolicitar}
          className="-mt-1 text-[11px] font-semibold text-[#1447e6] hover:underline"
        >
          ¿Debe pagarse otro monto? Pedirlo a administración
        </button>
      )}

      <ComprobanteField
        obligatorio={false}
        label="Comprobante del vale"
        path={comprobante}
        subiendo={subiendo}
        onFile={handleComprobante}
        onVer={() => verComprobante(comprobante)}
      />

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={guardando}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || subiendo}
          className="px-5 py-2.5 rounded-xl bg-[#1447e6] hover:bg-[#0f36b3] text-white text-sm font-bold disabled:opacity-50 transition-all"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

// Solicitud de monto manual para UN pago — la resuelve administración
// desde su panel de comisiones.
function FormSolicitud({ poliza, cuota, usuario, onCancel, onSaved }) {
  const [monto, setMonto] = useState(cuota.calc.monto ?? "");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function enviar() {
    if (!(n(monto) > 0)) return setError("Captura el monto que se quiere pagar.");
    if (!motivo.trim()) return setError("Explica el motivo — administración lo necesita para decidir.");
    setGuardando(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("comision_solicitudes")
        .insert({
          poliza_cofisem_id: poliza.id,
          num_cuota: cuota.numCuota,
          monto: n(monto),
          motivo: motivo.trim(),
          solicitado_por: usuario?.id ?? null,
        })
        .select("id, num_cuota, monto, motivo, estatus, nota_resolucion, created_at")
        .single();
      if (err) throw err;
      onSaved(data);
    } catch (e) {
      setError(
        e.code === "23505"
          ? "Ya hay una solicitud pendiente para este pago."
          : "No se pudo enviar la solicitud: " + e.message,
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <p className="text-xs text-gray-500">
        {cuota.calc.monto != null ? (
          <>
            El sistema calcula <strong>{$(cuota.calc.monto)}</strong> para este pago. Si
            debe pagarse otro monto, pídelo aquí; administración lo autoriza o lo rechaza.
          </>
        ) : (
          <>
            El sistema no puede calcular este pago ({cuota.calc.motivo.toLowerCase()}).
            Puedes pedir a administración que autorice un monto manual.
          </>
        )}
      </p>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
          Monto solicitado
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
          Motivo
        </label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej. acuerdo especial con el vendedor…"
          className="w-full h-20 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]"
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={guardando}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={enviar}
          disabled={guardando}
          className="px-5 py-2.5 rounded-xl bg-[#1447e6] hover:bg-[#0f36b3] text-white text-sm font-bold disabled:opacity-50"
        >
          {guardando ? "Enviando…" : "Enviar solicitud"}
        </button>
      </div>
    </div>
  );
}
