import { COBERTURA_BASICA } from "../constants/cobertura";
import { fmt$ } from "../utils/fmt";
import StatusBadge from "./StatusBadge";

function fmtFecha(str) {
  if (!str) return "—";
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ResumenPoliza({ poliza, onVolver }) {
  const cliente = poliza.clientes ?? {};
  const vendedor = poliza.vendedores ?? {};
  const concesionario = poliza.concesionarios ?? null;
  const oficina = poliza.oficinas ?? {};

  const clienteLabel =
    [cliente.nombre, cliente.apellido].filter(Boolean).join(" ") || "—";
  const vendedorLabel =
    [vendedor.nombre, vendedor.apellido].filter(Boolean).join(" ") || "—";
  const concLabel = concesionario
    ? [concesionario.nombre, concesionario.apellido1, concesionario.apellido2]
        .filter(Boolean)
        .join(" ")
    : "—";

  const emision = poliza.created_at
    ? new Date(poliza.created_at).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  const primaNeta = poliza.prima_neta ?? 0;
  const derechos = poliza.derechos ?? 400;
  const subtotal = +(primaNeta + derechos).toFixed(2);
  const iva = poliza.iva ?? 0;
  const total = poliza.prima_total ?? 0;
  const formaPago = poliza.forma_pago ?? "—";

  const campos = [
    { l: "No. póliza", v: poliza.constancia || poliza.numero_poliza || "—" },
    { l: "Vendedor", v: vendedorLabel },
    { l: "Asegurado", v: clienteLabel },
    { l: "Concesionario", v: concLabel },
    { l: "Cobertura", v: poliza.tipo_poliza || "TAXI BÁSICA 2500" },
    { l: "Modalidad de pago", v: formaPago },
    { l: "Inicio de vigencia", v: fmtFecha(poliza.fecha_inicio) },
    { l: "Fin de vigencia", v: fmtFecha(poliza.fecha_fin) },
  ];

  const vAmis = poliza.vehiculos_amis ?? {};
  const vehiculo = [
    { l: "Marca",     v: vAmis.marca             || "—" },
    { l: "Modelo",    v: vAmis.tipo              || "—" },
    { l: "Versión",   v: vAmis.dc                || "—" },
    { l: "Año",       v: poliza.anio?.toString() || "—" },
    { l: "No. Serie", v: poliza.num_serie        || "—" },
    { l: "No. Motor", v: poliza.num_motor        || "—" },
    { l: "Placas",    v: poliza.placas           || "—" },
    { l: "Capacidad", v: poliza.capacidad        || "4 OCUPANTES" },
    { l: "Cód. AMIS", v: String(vAmis.cve ?? "") || "—" },
  ];

  return (
    <div className="space-y-5">
      {/* Botón volver */}
      <button
        onClick={onVolver}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#13193a] transition-colors cursor-pointer"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        Volver a pólizas
      </button>

      {/* Banner */}
      <div className="bg-[#13193a] rounded-2xl px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-white/40 mb-0.5">No. Póliza</p>
            <p className="text-white font-mono font-bold">
              {poliza.constancia || poliza.numero_poliza}
            </p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Fecha emisión</p>
            <p className="text-white font-semibold">{emision}</p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Hora</p>
            <p className="text-white font-semibold">
              {poliza.emision_hora || "—"}
            </p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Punto de venta</p>
            <p className="text-white font-semibold truncate">
              {oficina.nombre || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
        {/* Características */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Características de la póliza
            </p>
            <StatusBadge estatus={poliza.estatus} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {campos.map(({ l, v }) => (
              <div key={l}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                  {l}
                </p>
                <p className="font-semibold text-[#13193a] text-xs leading-snug">
                  {v}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-500">Prima total</p>
            <p className="text-3xl font-black text-[#13193a] tabular-nums">
              {fmt$(total)}
            </p>
          </div>
        </div>

        {/* Vehículo */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Datos del vehículo
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
            {vehiculo.map(({ l, v }) => (
              <div key={l}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                  {l}
                </p>
                <p className="font-semibold text-[#13193a] text-xs">{v}</p>
              </div>
            ))}
          </div>
          {(poliza.conductor_habitual ||
            poliza.conductor_sexo ||
            poliza.conductor_edad) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2">
                Conductor habitual
              </p>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                {[
                  { l: "Nombre", v: poliza.conductor_habitual || "—" },
                  { l: "Sexo", v: poliza.conductor_sexo || "—" },
                  {
                    l: "Edad",
                    v: poliza.conductor_edad
                      ? `${poliza.conductor_edad} años`
                      : "—",
                  },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                      {l}
                    </p>
                    <p className="font-semibold text-[#13193a] text-xs">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coberturas */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Coberturas
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                    Cobertura
                  </th>
                  <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                    Suma asegurada
                  </th>
                  <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                    Deducible
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {COBERTURA_BASICA.coberturas.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="px-4 py-2.5 text-gray-700 font-medium">
                      {c.desc}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600 font-semibold">
                      {c.monto}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-400">
                      {c.ded}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Desglose de prima */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Desglose de prima total
            </p>
          </div>
          <div className="p-5 space-y-5">
            <div className="divide-y divide-gray-100 text-sm border border-gray-100 rounded-xl overflow-hidden">
              {[
                { l: "Prima neta", v: primaNeta, bold: false },
                { l: "Derechos / Expedición", v: derechos, bold: false },
                { l: "Subtotal", v: subtotal, bold: true },
                { l: "I.V.A. (16%)", v: iva, bold: false },
              ].map(({ l, v, bold }) => (
                <div
                  key={l}
                  className={`flex justify-between items-center px-4 py-3 ${bold ? "bg-gray-50 font-bold" : "bg-white"}`}
                >
                  <span className={bold ? "text-[#13193a]" : "text-gray-500"}>
                    {l}
                  </span>
                  <span
                    className={`tabular-nums ${bold ? "text-[#13193a]" : "text-gray-700"}`}
                  >
                    {fmt$(v)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-[#13193a] rounded-xl px-5 py-4">
              <p className="text-white font-bold">Prima total</p>
              <p className="text-white font-black text-2xl tabular-nums">
                {fmt$(total)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
