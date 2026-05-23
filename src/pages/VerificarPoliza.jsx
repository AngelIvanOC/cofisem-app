import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { mockCoberturas } from "../components/pdf/mockData";
import gamanLogo from "../assets/GamanLogoOpt.jpg";

const ESTATUS_CONFIG = {
  VIGENTE:      { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-300", icon: "check"   },
  "POR VENCER": { color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-300",   icon: "warning" },
  VENCIDA:      { color: "text-red-700",     bg: "bg-red-50",      border: "border-red-300",     icon: "x"       },
  CANCELADA:    { color: "text-gray-600",    bg: "bg-gray-100",    border: "border-gray-300",    icon: "x"       },
};

function StatusIcon({ type }) {
  if (type === "check") return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (type === "warning") return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.048-12.14c.866-1.5 3.032-1.5 3.898 0l7.048 12.14zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function fmtFecha(str) {
  if (!str) return "—";
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMonto(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
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
      <span className="text-xs text-gray-500 shrink-0 mr-3 leading-tight">{label}</span>
      <span className={`text-xs text-right font-semibold text-[#13193a] leading-tight ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

function TotalRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 bg-[#13193a] -mx-4 px-4 mt-1 first:rounded-t-none last:rounded-b-xl">
      <span className="text-xs text-white/70 font-semibold">{label}</span>
      <span className="text-sm font-black text-white font-mono">{value}</span>
    </div>
  );
}

export default function VerificarPoliza() {
  const { constancia } = useParams();
  const [poliza,  setPoliza]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [noFound, setNoFound] = useState(false);

  useEffect(() => {
    if (!constancia) return;
    supabase
      .from("polizas")
      .select(`
        id, constancia, numero_poliza, estatus, forma_pago,
        fecha_inicio, fecha_fin, created_at, emision_hora,
        marca, modelo, version, anio, placas, num_serie, num_motor, capacidad,
        prima_neta, prima_total, derechos, iva, descuento, recargo, tipo_poliza,
        clientes(nombre, apellido),
        concesionarios(nombre, apellido1, apellido2),
        oficinas(nombre)
      `)
      .eq("constancia", constancia)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNoFound(true); }
        else { setPoliza(data); }
        setLoading(false);
      });
  }, [constancia]);

  const cfg           = poliza ? (ESTATUS_CONFIG[poliza.estatus] ?? ESTATUS_CONFIG.CANCELADA) : null;
  const cliente       = poliza?.clientes ?? {};
  const conc          = poliza?.concesionarios ?? null;
  const nombreBase    = [cliente.nombre, cliente.apellido].filter(Boolean).join(" ").toUpperCase();
  const nombreConc    = conc
    ? [conc.nombre, conc.apellido1, conc.apellido2].filter(Boolean).join(" ").toUpperCase()
    : null;
  const nombre        = nombreConc ? `${nombreBase} Y/O ${nombreConc}` : nombreBase;
  const oficinaNombre = poliza?.oficinas?.nombre || "—";
  const formaPago     = poliza?.forma_pago || "CONTADO";
  const fechaEmision  = poliza?.created_at ? fmtFecha(poliza.created_at.split("T")[0]) : "—";
  const descripVehiculo = [poliza?.marca, poliza?.version || poliza?.modelo].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-[#13193a] flex items-start justify-center p-4 py-8">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">

        {/* ── Header con logo ───────────────────────────────── */}
        <div className="bg-[#13193a] px-6 py-6 flex flex-col items-center gap-3">
          <div className="bg-white rounded-xl px-5 py-2 shadow-inner">
            <img src={gamanLogo} alt="GAMAN" className="h-12 object-contain" />
          </div>
          <div className="text-center">
            <p className="text-white/50 text-[10px] uppercase tracking-widest">Estatus de la póliza</p>
            <p className="text-white font-mono font-bold text-sm mt-1 break-all">{constancia}</p>
          </div>
        </div>

        <div className="px-5 pb-6 pt-5">

          {/* ── Cargando ──────────────────────────────────────── */}
          {loading && (
            <div className="flex flex-col items-center py-12">
              <svg className="animate-spin h-8 w-8 text-[#13193a] mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm text-gray-400">Verificando...</p>
            </div>
          )}

          {/* ── No encontrada ──────────────────────────────────── */}
          {!loading && noFound && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mb-4 text-red-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-bold text-[#13193a] mb-1">Póliza no encontrada</p>
              <p className="text-sm text-gray-400">
                El número de constancia no corresponde a ninguna póliza registrada.
              </p>
            </div>
          )}

          {/* ── Datos de la póliza ────────────────────────────── */}
          {!loading && poliza && cfg && (
            <div>

              {/* Estatus + forma de pago */}
              <div className="flex flex-col items-center gap-2 mb-5">
                <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 font-black text-xl tracking-widest ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                  <StatusIcon type={cfg.icon} />
                  {poliza.estatus}
                </div>
                <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
                  ** {formaPago} **
                </span>
              </div>

              {/* Info principal */}
              <div className="bg-gray-50 rounded-2xl px-4 py-1 mb-1">
                <Row label="No. Constancia" value={poliza.constancia} mono />
                <Row label="Agente / Venta" value={oficinaNombre} />
                <Row label="Cliente"        value={nombre} />
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
                        <th className="text-left px-2.5 py-2 font-semibold">Descripción</th>
                        <th className="text-right px-2.5 py-2 font-semibold whitespace-nowrap">Monto Aseg.</th>
                        <th className="text-right px-2.5 py-2 font-semibold">% Ded.</th>
                        <th className="text-right px-2.5 py-2 font-semibold">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockCoberturas.flatMap((cob) => [
                        <tr key={`cob-${cob.id}`} className="border-b border-gray-100 even:bg-gray-50">
                          <td className="px-2.5 py-1.5 text-gray-700 leading-tight">{cob.nombre}</td>
                          <td className="px-2.5 py-1.5 text-right text-gray-700 font-mono whitespace-nowrap">{cob.sumaAsegurada}</td>
                          <td className="px-2.5 py-1.5 text-right text-gray-500">0.00</td>
                          <td className="px-2.5 py-1.5 text-right text-gray-700 font-mono whitespace-nowrap">{cob.deducibleMax || "0"}</td>
                        </tr>,
                        ...cob.subCoberturas.map((sub, si) => (
                          <tr key={`sub-${cob.id}-${si}`} className="border-b border-gray-100 bg-slate-50/60">
                            <td className="px-2.5 py-1 pl-6 text-gray-500 italic leading-tight">
                              {sub.numero}. {sub.concepto}
                            </td>
                            <td className="px-2.5 py-1 text-right text-gray-500 font-mono whitespace-nowrap">{sub.monto}</td>
                            <td className="px-2.5 py-1 text-right text-gray-400">0.00</td>
                            <td className="px-2.5 py-1 text-right text-gray-400">0</td>
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
                  <Row label="Hora Emisión"  value={poliza.emision_hora || "—"} />
                  <Row label="No. Control"   value={poliza.id?.toString()} mono />
                </div>
              </div>

              {/* ── Vigencia ─────────────────────────────────────── */}
              <div className="mt-4">
                <SectionTitle>Vigencia</SectionTitle>
                <div className="bg-gray-50 rounded-2xl px-4 py-1">
                  <Row label="Vigencia Desde" value={fmtFecha(poliza.fecha_inicio)} />
                  <Row label="Vigencia Hasta" value={fmtFecha(poliza.fecha_fin)} />
                </div>
              </div>

              {/* ── Vehículo ─────────────────────────────────────── */}
              <div className="mt-4">
                <SectionTitle>Vehículo asegurado</SectionTitle>
                <div className="px-1">
                  <Row label="Descripción" value={descripVehiculo} />
                  <Row label="Modelo"      value={poliza.anio?.toString()} />
                  <Row label="Placas"      value={poliza.placas} mono />
                  <Row label="Serie"       value={poliza.num_serie} mono />
                  <Row label="Motor"       value={poliza.num_motor} mono />
                  <Row label="Capacidad"   value={poliza.capacidad} />
                </div>
              </div>

              {/* ── Prima ────────────────────────────────────────── */}
              <div className="mt-4">
                <SectionTitle>Desglose de prima</SectionTitle>
                <div className="px-1">
                  <Row label="Prima Neta"         value={fmtMonto(poliza.prima_neta)} mono />
                  <Row label="Derechos"           value={fmtMonto(poliza.derechos)} mono />
                  <Row label="IVA"                value={fmtMonto(poliza.iva)} mono />
                  <Row label="Descuentos"         value={fmtMonto(poliza.descuento ?? 0)} mono />
                  <Row label="Cargos"             value={fmtMonto(poliza.recargo ?? 0)} mono />
                </div>
                <div className="overflow-hidden rounded-xl mt-2">
                  <TotalRow label="Total"              value={fmtMonto(poliza.prima_total)} />
                  <TotalRow label="Pago Inicial"       value={fmtMonto(poliza.prima_total)} />
                  <TotalRow label="Pagos Subsecuentes" value={fmtMonto(0)} />
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
