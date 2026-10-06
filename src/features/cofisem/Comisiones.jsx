// ============================================================
// src/features/cofisem/Comisiones.jsx
// Captura la comisión (vale) de un vendedor POR CADA CUOTA COBRADA de las
// pólizas que él vendió (decisión del cliente 2026-10-05: se paga por
// pago, no un solo vale por póliza). Se captura aparte del formulario de
// la póliza porque normalmente se calcula días después del cobro. Solo
// aplican pólizas con un vendedor real (vendedor_id distinto de NULL y
// distinto de 1=COFISEM, que es "sin vendedor específico").
//
// La tabla va UNA FILA POR PÓLIZA (como /pagos): los puntos de "Cuotas"
// dicen cuáles ya tienen vale. "Capturar vale" abre un modal en dos pasos:
// 1) elegir la cuota, 2) el formulario del vale de esa cuota.
//
// El vale se guarda en su propia tabla (comisiones_cofisem, UNIQUE
// poliza_cofisem_id + num_cuota) en vez de vivir en polizas_cofisem/
// pagos_cofisem — eso permite seguir editándolo aunque el corte del día
// del cobro ya esté cerrado. Se liga por num_cuota (no por FK a
// pagos_cofisem) porque la cuota 1 de pólizas que no son de GAMAN no tiene
// fila en pagos_cofisem. "Cobrada" y su fecha salen de la misma lógica que
// /pagos (cuotasCofisem.js).
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

const FILTROS = [
  { k: "PENDIENTE", label: "Pendientes" },
  { k: "CAPTURADO", label: "Al corriente" },
  { k: "TODAS", label: "Todas" },
];

const comisionesDe = (p) =>
  Array.isArray(p.comisiones_cofisem)
    ? p.comisiones_cofisem
    : p.comisiones_cofisem
      ? [p.comisiones_cofisem]
      : [];

const tieneVale = (c) => n(c.comision?.monto) > 0;

// Todas las cuotas de la póliza (cobradas o no — las no cobradas se
// muestran para dar contexto, pero no aceptan vale), cada una con su vale.
function agruparPoliza(p) {
  const comisiones = comisionesDe(p);
  const cuotas = cuotasDePoliza(p)
    .sort((a, b) => a.num_cuota - b.num_cuota)
    .map((c) => ({
      numCuota: c.num_cuota,
      cobrada:
        (c._info.bucket === "RECIBIDO" || c._info.bucket === "APLICADO") &&
        !!c._info.fecha,
      fechaCobro: c._info.fecha,
      monto: c._info.primaTotal,
      comision: comisiones.find((x) => x.num_cuota === c.num_cuota) ?? null,
    }));
  const cobradas = cuotas.filter((c) => c.cobrada);
  const sinVale = cobradas.filter((c) => !tieneVale(c));
  return {
    poliza: p,
    cuotas,
    cobradas,
    sinVale,
    totalVales: cuotas.reduce((s, c) => s + n(c.comision?.monto), 0),
    conVale: cuotas.filter(tieneVale).length,
    ultimoCobro:
      cobradas
        .map((c) => c.fechaCobro)
        .sort()
        .at(-1) ?? null,
  };
}

// Verde = vale capturado · ámbar = cobrada sin vale · gris = aún no cobrada.
function CuotasDots({ cuotas }) {
  return (
    <div className="flex items-center gap-1">
      {cuotas.map((c) => {
        const cls = tieneVale(c)
          ? "bg-emerald-500"
          : c.cobrada
            ? "bg-amber-400"
            : "bg-gray-200";
        const estado = tieneVale(c)
          ? `vale ${$(c.comision.monto)}`
          : c.cobrada
            ? "cobrada, sin vale"
            : "aún no cobrada";
        return (
          <div
            key={c.numCuota}
            className={`w-2 h-2 rounded-full ${cls}`}
            title={`Cuota ${c.numCuota}: ${estado}`}
          />
        );
      })}
    </div>
  );
}

export default function Comisiones({ usuario }) {
  const [polizas, setPolizas] = useState([]);
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
          `
          id, poliza_id, aseguradora, numero_poliza, asegurado_nombre,
          fecha_emision, fecha_corte, prima_primer_pago, prima_primer_pago_neta,
          efectivo, cheque, tdc, pol_pend_pago, registro_parcial, num_cuota_pago,
          comprobante_cheque_url, comprobante_tdc_url,
          vendedor_id, vendedor_nombre,
          comisiones_cofisem(id, num_cuota, monto, fecha_pago, comprobante_url, folio),
          pagos_cofisem(*, pago_gaman:pagos(monto, estatus, fecha_pago, fecha_vencimiento))
        `,
        )
        .not("vendedor_id", "is", null)
        .neq("vendedor_id", 1);
      // Comisiones de toda la oficina (las lleva la encargada).
      if (usuario?.oficina_id)
        query = query.eq("oficina_id", usuario.oficina_id);
      const { data, error } = await query;
      if (error) throw error;
      setPolizas(data ?? []);
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

  // Pólizas con al menos una cuota cobrada, o que ya tengan algún vale
  // (p. ej. GAMAN cuya cuota 1 quedó "pendiente de pago" en COFISEM pero
  // ya se le pagó el vale — no debe desaparecer de aquí). Cobro más
  // reciente primero.
  const grupos = useMemo(
    () =>
      polizas
        .map(agruparPoliza)
        .filter((g) => g.cobradas.length > 0 || g.conVale > 0)
        .sort((a, b) => (b.ultimoCobro ?? "").localeCompare(a.ultimoCobro ?? "")),
    [polizas],
  );

  const porFiltro = grupos.filter((g) => {
    if (filtro === "TODAS") return true;
    return filtro === "CAPTURADO" ? g.sinVale.length === 0 : g.sinVale.length > 0;
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

  const pendientesCount = grupos.filter((g) => g.sinVale.length > 0).length;
  const totalCapturado = grupos.reduce((s, g) => s + g.totalVales, 0);
  const grupoAbierto = grupos.find((g) => g.poliza.id === modalPolizaId) ?? null;

  const {
    page,
    setPage,
    totalPages,
    paginated: visiblesPag,
    total,
  } = usePagination(visibles, 10);

  // Reemplaza (o agrega / quita) el vale de UNA cuota dentro de la póliza.
  function ponerComision(polizaId, numCuota, comision) {
    setPolizas((prev) =>
      prev.map((p) => {
        if (p.id !== polizaId) return p;
        const otras = comisionesDe(p).filter((c) => c.num_cuota !== numCuota);
        return {
          ...p,
          comisiones_cofisem: comision ? [...otras, comision] : otras,
        };
      }),
    );
  }

  async function eliminarComision(p, c) {
    const v = c.comision;
    if (!v) return false;
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar este vale?",
      html: `Se borrará el vale de <strong>${$(v.monto)}</strong> de la cuota <strong>${c.numCuota}</strong> de la póliza <strong>${p.numero_poliza || "—"}</strong> y su comprobante (si tenía).`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return false;
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
      return true;
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: e.message,
        confirmButtonColor: "#13193a",
      });
      return false;
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
          Captura el vale de cada cuota cobrada de pólizas con vendedor — se
          puede editar aunque el corte de ese cobro ya esté cerrado.
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
                    "Cuotas",
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
                  const pendientes = g.sinVale.length;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
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
                            {g.conVale}/{Math.max(g.cobradas.length, g.conVale)} con vale
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
                            : "Ver vales"}
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
      />
    </div>
  );
}

// Modal en dos pasos: 1) lista de cuotas de la póliza para elegir a cuál
// se le captura/edita el vale; 2) el formulario del vale de esa cuota.
// Si la póliza solo tiene una cuota cobrada y sin vale, abre directo en
// el formulario (con "Cuotas" para regresar). Al guardar vuelve a la
// lista, para capturar el de otra cuota sin cerrar.
function ModalVales({ grupo, usuario, onClose, onGuardado, onEliminar }) {
  const [cuotaSel, setCuotaSel] = useState(() =>
    grupo && grupo.cobradas.length === 1 && grupo.sinVale.length === 1
      ? grupo.sinVale[0].numCuota
      : null,
  );
  // Esc: en el formulario regresa a la lista de cuotas; en la lista cierra.
  useEffect(() => {
    if (!grupo) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (cuotaSel != null) setCuotaSel(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [grupo, cuotaSel, onClose]);
  if (!grupo) return null;
  const p = grupo.poliza;
  const cuota = grupo.cuotas.find((c) => c.numCuota === cuotaSel) ?? null;

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
                onClick={() => setCuotaSel(null)}
                title="Volver a las cuotas"
                className="w-8 h-8 -ml-2 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#1447e6]">
                {cuota
                  ? `${tieneVale(cuota) ? "Editar" : "Capturar"} vale · Cuota ${cuota.numCuota}`
                  : "Vales de comisión"}
              </p>
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

        {cuota ? (
          <FormVale
            poliza={p}
            cuota={cuota}
            usuario={usuario}
            onCancel={() => setCuotaSel(null)}
            onSaved={(data) => {
              onGuardado(p.id, cuota.numCuota, data);
              setCuotaSel(null);
            }}
          />
        ) : (
          <ListaCuotas
            grupo={grupo}
            onElegir={(c) => setCuotaSel(c.numCuota)}
            onEliminar={(c) => onEliminar(p, c)}
          />
        )}
      </div>
    </div>
  );
}

function ListaCuotas({ grupo, onElegir, onEliminar }) {
  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Cuotas cobradas", value: `${grupo.cobradas.length}/${grupo.cuotas.length}` },
          { label: "Con vale", value: `${grupo.conVale}/${Math.max(grupo.cobradas.length, grupo.conVale)}` },
          { label: "Total vales", value: $(grupo.totalVales) },
        ].map((k) => (
          <div key={k.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
              {k.label}
            </p>
            <p className="text-sm font-bold text-[#1447e6]">{k.value}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Elige la cuota a la que corresponde el vale:
      </p>

      <div className="space-y-2">
        {grupo.cuotas.map((c) => {
          const v = c.comision;
          const conVale = tieneVale(c);
          const circulo = conVale
            ? "bg-emerald-100 text-emerald-700"
            : c.cobrada
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-400";
          return (
            <div
              key={c.numCuota}
              className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border ${
                c.cobrada ? "border-gray-200" : "border-dashed border-gray-200 bg-gray-50/60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${circulo}`}
                >
                  {c.numCuota}
                </div>
                <div className="min-w-0">
                  {conVale ? (
                    <>
                      <p className="text-sm font-bold text-emerald-700">
                        Vale {$(v.monto)}
                        {v.folio && (
                          <span className="ml-1.5 text-xs font-mono font-bold text-[#1447e6]">
                            {v.folio}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Pagado {fmt(v.fecha_pago)} ·{" "}
                        {c.cobrada
                          ? `cuota cobrada ${fmt(c.fechaCobro)}`
                          : "cuota aún sin cobro registrado"}
                      </p>
                    </>
                  ) : c.cobrada ? (
                    <>
                      <p className="text-sm font-bold text-[#13193a]">
                        Sin vale
                        <span className="text-xs text-gray-400 font-normal">
                          {" "}
                          · cuota de {$(c.monto)}
                        </span>
                      </p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        Cobrada {fmt(c.fechaCobro)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-400">
                        Aún no cobrada
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        El vale se captura cuando se cobre esta cuota.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {conVale && v.comprobante_url && (
                  <button
                    type="button"
                    onClick={() => verComprobante(v.comprobante_url)}
                    title="Ver comprobante"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1447e6] hover:bg-[#1447e6]/5"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                )}
                {conVale ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onElegir(c)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-[11px] font-bold"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
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
                ) : c.cobrada ? (
                  <button
                    type="button"
                    onClick={() => onElegir(c)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold whitespace-nowrap"
                  >
                    Capturar vale
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Formulario del vale de UNA cuota: folio, monto, fecha de pago y
// comprobante opcional.
function FormVale({ poliza, cuota, usuario, onCancel, onSaved }) {
  const c = cuota.comision;
  const [valor, setValor] = useState(c?.monto || "");
  // Folio propio del vale — el vale es un movimiento aparte del registro
  // de la póliza y cae en el corte de su fecha_pago, así que lleva su
  // propio folio (ver migracion_folio_por_transaccion.sql).
  const [folio, setFolio] = useState(c?.folio ?? "");
  const [intento, setIntento] = useState(false);
  const [fechaPago, setFechaPago] = useState(c?.fecha_pago || hoyISO());
  const [comprobante, setComprobante] = useState(c?.comprobante_url ?? null);
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
      const path = await subirComprobante(basePath, file);
      setComprobante(path);
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
    setGuardando(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("comisiones_cofisem")
        .upsert(
          {
            poliza_cofisem_id: poliza.id,
            num_cuota: cuota.numCuota,
            folio: folio.trim(),
            monto: n(valor),
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
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-gray-600">
        <span className="w-5 h-5 rounded-full bg-white text-[#1447e6] border border-blue-100 flex items-center justify-center text-[10px] font-bold">
          {cuota.numCuota}
        </span>
        Cuota de {$(cuota.monto)} cobrada el{" "}
        <strong className="text-gray-700">{fmt(cuota.fechaCobro)}</strong>
      </div>

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
            Monto
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              $
            </span>
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
        </div>
      </div>
      <p className="text-[11px] text-gray-400 -mt-2">
        Día en que se pagó — así sale restado en el corte de ese día.
      </p>

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
