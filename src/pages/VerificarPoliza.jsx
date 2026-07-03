import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { mockCoberturas } from "../components/pdf/mockData";
import gamanLogo from "../assets/GamanLogoOpt.jpg";
import { PRECIO_MATRIZ } from "../features/operador/constants/cobertura";
import { calcularEstatus } from "../services/polizas";
import {
  AlertTriangle, CheckCircle2, Clock, Loader2, XCircle,
} from "lucide-react";

const ESTATUS_CONFIG = {
  VIGENTE: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    icon: "check",
  },
  "POR VENCER": {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-300",
    icon: "warning",
  },
  VENCIDA: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-300",
    icon: "x",
  },
  CANCELADA: {
    color: "text-gray-600",
    bg: "bg-gray-100",
    border: "border-gray-300",
    icon: "x",
  },
};

function StatusIcon({ type }) {
  if (type === "check")
    return (
      <CheckCircle2 className="w-7 h-7" />
    );
  if (type === "warning")
    return (
      <AlertTriangle className="w-7 h-7" />
    );
  return (
    <XCircle className="w-7 h-7" />
  );
}

function fmtFecha(str) {
  if (!str) return "—";
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtMonto(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function SectionTitle({ children }) {
  return (
    <p className="text-[10px] font-black text-[#13193a] uppercase tracking-wider mb-2 mt-5 first:mt-0">
      {children}
    </p>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 shrink-0 mr-3 leading-tight">
        {label}
      </span>
      <span
        className={`text-xs text-right font-semibold text-[#13193a] leading-tight ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function TotalRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 bg-[#13193a] -mx-4 px-4 mt-1 rounded-xl">
      <span className="text-xs text-white/70 font-semibold">{label}</span>
      <span className="text-sm font-black text-white font-mono">{value}</span>
    </div>
  );
}

function estatusCuotaDisplay(cuota, formaPago) {
  if (cuota.estatus === 'PAGADO') return 'PAGADO';
  if (cuota.estatus === 'ADEUDO') return 'ADEUDO';
  const vto = new Date((cuota.fecha_vencimiento ?? '') + 'T12:00:00');
  if (!isNaN(vto)) {
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    const forma = formaPago || cuota.forma_pago || 'CONTADO';
    // CONTADO: 0 días de gracia — PARCIALES: 7 días de gracia (al 8vo día = VENCIDO)
    const diasGracia = forma !== 'CONTADO' ? 7 : 0;
    const limite = new Date(vto);
    limite.setDate(limite.getDate() + diasGracia);
    if (hoy > limite) return 'VENCIDO';
  }
  return 'PENDIENTE';
}

const CUOTA_BADGE = {
  PAGADO:   { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Al corriente" },
  ADEUDO:   { cls: "bg-amber-50 text-amber-700 border-amber-200",       label: "Adeudo"       },
  VENCIDO:  { cls: "bg-red-50 text-red-600 border-red-200",             label: "Vencido"      },
  PENDIENTE:{ cls: "bg-gray-50 text-gray-500 border-gray-200",          label: "Pendiente"    },
  ANULADA:  { cls: "bg-gray-100 text-gray-500 border-gray-300",         label: "ANULADA"      },
};

export default function VerificarPoliza() {
  const { constancia } = useParams();
  const [poliza,  setPoliza]  = useState(null);
  const [pagos,   setPagos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [noFound, setNoFound] = useState(false);

  useEffect(() => {
    if (!constancia) return;
    supabase
      .rpc("verificar_poliza_publica", { p_constancia: constancia })
      .then(async ({ data, error }) => {
        if (error || !data) {
          setNoFound(true);
        } else {
          setPoliza({ ...data, estatus: calcularEstatus(data.estatus, data.fecha_fin) });
          try {
            const { data: pagosData } = await supabase
              .rpc("verificar_pagos_poliza", { p_constancia: constancia });
            setPagos(pagosData ?? []);
          } catch (_) {}
        }
        setLoading(false);
      });
  }, [constancia]);

  const cfg = poliza
    ? (ESTATUS_CONFIG[poliza.estatus] ?? ESTATUS_CONFIG.CANCELADA)
    : null;
  const esPorVencer = poliza?.estatus === 'POR VENCER';
  const displayCfg  = esPorVencer ? ESTATUS_CONFIG.VIGENTE : cfg;
  const displayLabel = esPorVencer ? 'VIGENTE' : poliza?.estatus;
  const nombreBase = (poliza?.cliente_nombre || "").toUpperCase();
  const nombreConc = poliza?.concesionario_nombre
    ? poliza.concesionario_nombre.toUpperCase()
    : null;
  const nombre = nombreConc ? `${nombreBase} Y/O ${nombreConc}` : nombreBase;
  const oficinaNombre = poliza?.oficina_nombre || "—";
  const formaPago = poliza?.forma_pago || "CONTADO";
  const primaTotal = poliza?.coberturas?.prima_total ?? poliza?.prima_total ?? 0;

  let primerPago = primaTotal;
  let pagoSubs = 0;
  let nSubs = 0;
  if (formaPago !== "CONTADO") {
    for (const tierData of Object.values(PRECIO_MATRIZ)) {
      const entry = tierData[formaPago];
      if (entry && Math.abs(entry.total - primaTotal) < 0.01) {
        primerPago = entry.primerPago;
        pagoSubs = entry.pagoSubs;
        nSubs = entry.nSubs;
        break;
      }
    }
  }

  const fechaEmision = poliza?.created_at
    ? fmtFecha(poliza.created_at.split("T")[0])
    : "—";
  const descripVehiculo = [poliza?.marca, poliza?.modelo, poliza?.version]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-[#13193a] flex items-start justify-center p-4 py-8">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* ── Header con logo ───────────────────────────────── */}
        <div className="bg-[#13193a] px-6 py-6 flex flex-col items-center gap-3">
          <div className="bg-white rounded-xl px-5 py-2 shadow-inner">
            <img src={gamanLogo} alt="GAMAN" className="h-12 object-contain" />
          </div>
          <div className="text-center">
            <p className="text-white/50 text-[10px] uppercase tracking-widest">
              Estatus de la póliza
            </p>
            <p className="text-white font-mono font-bold text-sm mt-1 break-all">
              {constancia}
            </p>
          </div>
        </div>

        <div className="px-5 pb-6 pt-5">
          {/* ── Cargando ──────────────────────────────────────── */}
          {loading && (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-[#13193a] mb-3" />
              <p className="text-sm text-gray-400">Verificando...</p>
            </div>
          )}

          {/* ── No encontrada ──────────────────────────────────── */}
          {!loading && noFound && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mb-4 text-red-500">
                <XCircle className="w-8 h-8" />
              </div>
              <p className="font-bold text-[#13193a] mb-1">
                Póliza no encontrada
              </p>
              <p className="text-sm text-gray-400">
                El número de constancia no corresponde a ninguna póliza
                registrada.
              </p>
            </div>
          )}

          {/* ── Datos de la póliza ────────────────────────────── */}
          {!loading && poliza && cfg && (
            <div>
              {/* Estatus + forma de pago */}
              <div className="flex flex-col items-center gap-2 mb-5">
                <div
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 font-black text-xl tracking-widest ${displayCfg.bg} ${displayCfg.border} ${displayCfg.color}`}
                >
                  <StatusIcon type={displayCfg.icon} />
                  {displayLabel}
                </div>
                {esPorVencer && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 tracking-widest uppercase">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    POR VENCER
                  </span>
                )}
                <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
                  ** {formaPago} **
                </span>
                {/* Alerta de pagos si hay adeudos o vencidos */}
                {pagos.length > 0 && (() => {
                  const hayAdeudo  = pagos.some(p => p.estatus === 'ADEUDO');
                  const hayVencido = pagos.some(p => estatusCuotaDisplay(p, formaPago) === 'VENCIDO');
                  if (poliza.estatus === 'ANULADA') return null;
                  if (hayVencido) return (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold mt-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Esta póliza tiene pagos vencidos
                    </div>
                  );
                  if (hayAdeudo) return (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mt-1">
                      <Clock className="w-4 h-4 shrink-0" />
                      Pago en proceso de confirmación (ADEUDO)
                    </div>
                  );
                  return null;
                })()}
              </div>

              {/* ── Relación de pagos (solo PARCIALES) ───────────── */}
              {pagos.length > 0 && formaPago !== 'CONTADO' && (
                <div className="mb-4">
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#13193a] text-white">
                          <th className="text-left px-3 py-2 font-semibold text-[11px]">No. pago</th>
                          <th className="text-left px-3 py-2 font-semibold text-[11px]">Fecha límite</th>
                          <th className="text-right px-3 py-2 font-semibold text-[11px]">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pagos.map((pago, idx) => {
                          const est   = poliza.estatus === 'ANULADA' ? 'ANULADA' : estatusCuotaDisplay(pago, formaPago);
                          const badge = CUOTA_BADGE[est] ?? CUOTA_BADGE.PENDIENTE;
                          return (
                            <tr key={pago.id} className="bg-white">
                              <td className="px-3 py-2.5 text-gray-600 font-medium">Pago {idx + 1}</td>
                              <td className="px-3 py-2.5 text-gray-500 text-[11px] font-mono">
                                {fmtFecha(pago.fecha_vencimiento)}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Info principal */}
              <div className="bg-gray-50 rounded-2xl px-4 py-1 mb-1">
                <Row label="No. Constancia" value={poliza.constancia} mono />
                <Row label="Oficina Emisora" value={oficinaNombre} />
                <Row label="Asegurado" value={nombre} />
              </div>

              {/* ── Coberturas ──────────────────────────────────── */}
              <div className="my-5 border-t-2 border-dashed border-gray-200 pt-5">
                <SectionTitle>
                  Cobertura: {poliza.tipo_poliza || "BÁSICA"}
                </SectionTitle>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-[#13193a] text-white">
                        <th className="text-left px-2.5 py-2 font-semibold">
                          Descripción
                        </th>
                        <th className="text-right px-2.5 py-2 font-semibold whitespace-nowrap">
                          Monto Aseg.
                        </th>
                        <th className="text-right px-2.5 py-2 font-semibold">
                          % Ded.
                        </th>
                        <th className="text-right px-2.5 py-2 font-semibold">
                          Monto
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockCoberturas.flatMap((cob) => [
                        <tr
                          key={`cob-${cob.id}`}
                          className="border-b border-gray-100 even:bg-gray-50"
                        >
                          <td className="px-2.5 py-1.5 text-gray-700 leading-tight">
                            {cob.nombre}
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-gray-700 font-mono whitespace-nowrap">
                            {cob.sumaAsegurada}
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-gray-500">
                            0.00
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-gray-700 font-mono whitespace-nowrap">
                            {cob.deducibleMax || "0"}
                          </td>
                        </tr>,
                        ...cob.subCoberturas.map((sub, si) => (
                          <tr
                            key={`sub-${cob.id}-${si}`}
                            className="border-b border-gray-100 bg-slate-50/60"
                          >
                            <td className="px-2.5 py-1 pl-6 text-gray-500 italic leading-tight">
                              {sub.numero}. {sub.concepto}
                            </td>
                            <td className="px-2.5 py-1 text-right text-gray-500 font-mono whitespace-nowrap">
                              {sub.monto}
                            </td>
                            <td className="px-2.5 py-1 text-right text-gray-400">
                              0.00
                            </td>
                            <td className="px-2.5 py-1 text-right text-gray-400">
                              0
                            </td>
                          </tr>
                        )),
                      ])}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Emisión ─────────────────────────────────────── */}
              <div className="border-t-2 border-dashed border-gray-200 pt-5">
                <SectionTitle>Datos de emisión</SectionTitle>
                <div className="px-1">
                  <Row label="Fecha Emisión" value={fechaEmision} />
                  <Row
                    label="Hora Emisión"
                    value={poliza.emision_hora || "—"}
                  />
                  <Row label="No. Control" value={poliza.id?.toString()} mono />
                </div>
              </div>

              {/* ── Vigencia ─────────────────────────────────────── */}
              <div className="mt-4">
                <SectionTitle>Vigencia</SectionTitle>
                <div className="bg-gray-50 rounded-2xl px-4 py-1">
                  <Row
                    label="Vigencia Desde"
                    value={fmtFecha(poliza.fecha_inicio)}
                  />
                  <Row
                    label="Vigencia Hasta"
                    value={fmtFecha(poliza.fecha_fin)}
                  />
                </div>
              </div>

              {/* ── Vehículo ─────────────────────────────────────── */}
              <div className="mt-4">
                <SectionTitle>Vehículo asegurado</SectionTitle>
                <div className="px-1">
                  <Row label="Descripción" value={descripVehiculo} />
                  <Row label="Modelo" value={poliza.anio?.toString()} />
                  <Row label="Placas" value={poliza.placas} mono />
                  <Row label="Serie" value={poliza.num_serie} mono />
                  <Row label="Motor" value={poliza.num_motor} mono />
                  <Row label="Capacidad" value={poliza.capacidad} />
                </div>
              </div>

              {/* ── Prima ────────────────────────────────────────── */}
              <div className="mt-4">
                <SectionTitle>Desglose de prima</SectionTitle>
                <div className="px-1">
                  <Row
                    label="Prima Neta"
                    value={fmtMonto(poliza.coberturas?.prima_neta ?? poliza.prima_neta)}
                    mono
                  />
                  <Row
                    label="Derechos"
                    value={fmtMonto(poliza.derechos)}
                    mono
                  />
                  <Row label="IVA" value={fmtMonto(poliza.iva)} mono />
                  <Row
                    label="Descuentos"
                    value={fmtMonto(poliza.descuento ?? 0)}
                    mono
                  />
                  <Row
                    label="Cargos"
                    value={fmtMonto(poliza.recargo ?? 0)}
                    mono
                  />
                </div>
                <div className="overflow-hidden rounded-xl mt-2 px-5">
                  <TotalRow label="Total" value={fmtMonto(primaTotal)} />
                  <TotalRow label="Pago Inicial" value={fmtMonto(primerPago)} />
                  <TotalRow
                    label={
                      nSubs > 0
                        ? `Pagos Subsecuentes (×${nSubs})`
                        : "Pagos Subsecuentes"
                    }
                    value={fmtMonto(pagoSubs)}
                  />
                </div>
              </div>

              <p className="text-center text-[9px] text-gray-300 pt-5">
                COFISEM · Verificación automática · GAMAN S.A. DE C.V.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
