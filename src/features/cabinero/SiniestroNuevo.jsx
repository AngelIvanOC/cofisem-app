// ============================================================
// src/features/cabinero/SiniestroNuevo.jsx
//
// AJUSTES APLICADOS:
//   ✓ "Conductor del Asegurado": nombre + teléfono + checkbox
//     en UNA sola fila. Sin texto descriptivo extra.
//   ✓ Cuando se marca "tercero": solo 2 inputs en columna,
//     sin borde, sin subtítulo, sin énfasis visual.
//   ✓ Vehículos terceros: ELIMINADOS nombre y teléfono del
//     conductor. Solo datos del vehículo.
//   ✓ Localización compacta:
//        Fila 1: Estado | Municipio | CP
//        Fila 2: Colonia | Calle | Número
//        Fila 3: Referencia (sola, full width)
// ============================================================
import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ESTADOS_MX,
  getMunicipios,
} from "../../shared/data/mexicoMunicipios";

// ── Mock de datos ─────────────────────────────────────────────
const POLIZAS_MOCK = [
  {
    id: 1,
    numero: "01250100001024-01",
    titular: "SERGIO DOMINGUEZ GOMEZ Y/O LUCRECIA BENITEZ MENDOZA",
    prima: "$2,674.00",
    estatus: "Vigente",
    agencia: "COFISEM AV. E.ZAPATA",
    vigenciaDesde: "06/06/2025",
    vigenciaHasta: "06/06/2026",
    formaPago: "Cont. 4 Parcial",
    saldo: "$0.00",
    cobertura: "TAXI BÁSICA PAGOS 2500",
    cuotas: [
      { num: 1, vto: "06/06/2025", monto: "$799.00", estatus: "Pagado" },
      { num: 2, vto: "16/06/2025", monto: "$625.00", estatus: "Pagado" },
      { num: 3, vto: "16/06/2025", monto: "$625.00", estatus: "Pagado" },
      { num: 4, vto: "24/06/2025", monto: "$625.00", estatus: "Pagado" },
    ],
    vehiculo: {
      descripcion: "NISSAN TSURU GSI SERV PUB STD",
      modelo: "2009",
      placas: "A757LTS",
      serie: "3N1EB31S09K323748",
      motor: "GA16847873W",
      capacidad: "4 PASAJEROS",
    },
    coberturas: [
      { desc: "RESP. CIVIL A TERCEROS BIENES Y PERSONAS",   monto: "$1,700,000.00",       ded: "0.00", imp: "0 UMAS",          sub: false },
      { desc: "RESPONSABILIDAD CIVIL COMPLEMENT. PERSONAS", monto: "$3,000,000.00",       ded: "0.00", imp: "0 UMAS",          sub: false },
      { desc: "GASTOS MÉDICOS CONDUCTOR Y FAMILIARES",      monto: "$50,000.00",          ded: "0.00", imp: "0",                sub: false },
      { desc: "MUERTE DE CONDUCTOR P/AA",                    monto: "$50,000.00",          ded: "0.00", imp: "0",                sub: false },
      { desc: "GASTOS LEGALES",                              monto: "AMPARADOS",           ded: "0.00", imp: "0",                sub: false },
      { desc: "RESPONSABILIDAD CIVIL VIAJERO",               monto: "5,000 UMAS/PASAJERO", ded: "0.00", imp: "0",                sub: false },
      { desc: "└ Muerte o Incapacidad Total y Permanente",  monto: "Sublímite 5,000 UMA", ded: "0.00", imp: "0",                sub: true },
      { desc: "└ Gastos Médicos",                            monto: "Sublímite 5,000 UMA", ded: "0.00", imp: "0",                sub: true },
      { desc: "└ Gastos Funerarios",                         monto: "Sublímite 300 UMA",   ded: "0.00", imp: "0",                sub: true },
      { desc: "└ Equipaje",                                  monto: "Sublímite 80 UMA",    ded: "0.00", imp: "0",                sub: true },
    ],
    siniestros: [
      { reporte: "250423", folio: "250423", fecha: "28/06/2025", ajustador: "ALICIA HERNANDEZ VARGAS", estatus: "Asignado" },
    ],
  },
];

// ── Utilidades de búsqueda ────────────────────────────────────
function detectarTipo(val) {
  const v = val.trim();
  if (!v) return null;
  if (/^[A-Z0-9]{17}$/i.test(v)) return "serie";
  if (/^[A-Z]{2,3}\d{3,4}[A-Z]?$/i.test(v) && v.length <= 8) return "placas";
  if (/^\d{5,9}$/.test(v)) return "reporte";
  return "poliza";
}

const TIPO_ICON = { poliza: "🔑", serie: "🔢", placas: "🚗", reporte: "📋" };
const TIPO_LABEL = {
  poliza: "Póliza",
  serie: "No. Serie",
  placas: "Placas",
  reporte: "Reporte",
};

async function buscarPoliza(valor) {
  await new Promise((r) => setTimeout(r, 500));
  const v = valor.trim().toLowerCase();
  const tipo = detectarTipo(valor);
  return (
    POLIZAS_MOCK.find((p) => {
      if (tipo === "serie") return p.vehiculo.serie.toLowerCase().includes(v);
      if (tipo === "placas") return p.vehiculo.placas.toLowerCase().includes(v);
      if (tipo === "reporte")
        return p.siniestros.some((s) => s.reporte.includes(v));
      return p.numero.toLowerCase().includes(v);
    }) ?? null
  );
}

// ── Catálogos ─────────────────────────────────────────────────
const CAUSAS = [
  "Colisión con vehículo",
  "Colisión con objeto fijo",
  "Volcadura",
  "Robo total",
  "Robo parcial",
  "Incendio",
  "Daño por granizo",
  "Daño por inundación",
  "Atropellamiento",
  "Otro",
];
const CIRCUNSTANCIAS = [
  "En movimiento",
  "Estacionado",
  "Maniobra de reversa",
  "Cruce de intersección",
  "Cambio de carril",
  "Vía rápida",
  "Zona urbana",
  "Carretera",
  "Estacionamiento privado",
  "Otra",
];

const AJUSTADORES = [
  "Félix Hernández",
  "Luis Martínez",
  "Ana García",
  "Roberto Díaz",
  "Alicia Hernández Vargas",
];

// Tercero: SOLO datos del vehículo (sin nombre/teléfono del conductor)
const TERCERO_VACIO = () => ({
  id: Date.now() + Math.random(),
  vehiculoDesc: "",
  vehiculoTipo: "",
  vehiculoColor: "",
  vehiculoModelo: "",
  vehiculoPlacas: "",
  vehiculoSerie: "",
  vehiculoMotor: "",
});

// ── Clases base reutilizables ─────────────────────────────────
const INP =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
const INP_RO =
  "w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#13193a] bg-[#13193a]/4 cursor-default select-none";
const INP_DISABLED =
  "w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed";
const LBL =
  "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";

// ── Componentes pequeños ──────────────────────────────────────
function Seccion({ titulo, subtitulo, children, accion }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#13193a] px-5 py-3.5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">{titulo}</h3>
          {subtitulo && <p className="text-white/40 text-xs mt-0.5">{subtitulo}</p>}
        </div>
        {accion}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DatoCard({ label, value, mono, highlight }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-xs font-semibold truncate ${highlight ? "text-emerald-600" : "text-[#13193a]"} ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

// ── Tarjeta de tercero — SOLO VEHÍCULO ────────────────────────
function TerceroCard({ tercero, index, onChange, onRemove }) {
  const set = useCallback(
    (k, v) => onChange(tercero.id, k, v),
    [tercero.id, onChange],
  );

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#13193a] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {index + 1}
          </div>
          <span className="text-sm font-bold text-[#13193a]">
            Vehículo tercero #{index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(tercero.id)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Eliminar
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Solo datos del vehículo — sin sección de conductor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LBL}>Marca / Descripción</label>
            <input
              value={tercero.vehiculoDesc}
              onChange={(e) => set("vehiculoDesc", e.target.value)}
              placeholder="Marca y modelo"
              className={INP}
            />
          </div>
          <div>
            <label className={LBL}>Tipo</label>
            <input
              value={tercero.vehiculoTipo}
              onChange={(e) => set("vehiculoTipo", e.target.value)}
              placeholder="Automóvil, camión, moto..."
              className={INP}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { k: "vehiculoColor",  p: "Color"     },
            { k: "vehiculoModelo", p: "Modelo"    },
            { k: "vehiculoPlacas", p: "Placas"    },
            { k: "vehiculoSerie",  p: "No. Serie" },
            { k: "vehiculoMotor",  p: "Motor"     },
          ].map((f) => (
            <div key={f.k}>
              <label className={LBL}>{f.p}</label>
              <input
                value={tercero[f.k]}
                onChange={(e) => set(f.k, e.target.value)}
                placeholder={f.p}
                className={INP}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta de póliza encontrada ──────────────────────────────
function PolizaCard({ poliza, onConfirmar, onLimpiar }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-[#13193a]/15 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#13193a] px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
              Póliza encontrada · Vigente
            </span>
            <p className="text-white text-lg font-bold font-mono leading-none">{poliza.numero}</p>
            <p className="text-white/60 text-sm mt-1.5 leading-snug max-w-md">{poliza.titular}</p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-white/40 text-xs">Prima total</p>
            <p className="text-white text-2xl font-bold">{poliza.prima}</p>
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-5 space-y-5">
        {/* Siniestros relacionados */}
        {poliza.siniestros.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              Siniestros relacionados a este certificado
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-amber-200">
                  {["# Reporte", "# Folio", "Fecha", "Ajustador", "Estatus"].map((h) => (
                    <th key={h} className="text-left pb-2 text-amber-600 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {poliza.siniestros.map((s, i) => (
                  <tr key={i}>
                    <td className="py-1.5 font-mono text-amber-800 font-semibold">{s.reporte}</td>
                    <td className="py-1.5 font-mono text-amber-800">{s.folio}</td>
                    <td className="py-1.5 text-amber-700">{s.fecha}</td>
                    <td className="py-1.5 text-amber-700">{s.ajustador}</td>
                    <td className="py-1.5">
                      <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        {s.estatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info general */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <DatoCard label="Agencia"         value={poliza.agencia} />
          <DatoCard label="Vigencia desde"   value={poliza.vigenciaDesde} />
          <DatoCard label="Vigencia hasta"   value={poliza.vigenciaHasta} />
          <DatoCard label="Saldo"            value={poliza.saldo} highlight />
        </div>

        {/* Cuotas */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Cuotas de Pago</p>
          <div className="grid grid-cols-4 gap-2">
            {poliza.cuotas.map((c) => (
              <div key={c.num} className="bg-white rounded-xl border border-gray-100 p-2.5 text-center">
                <p className="text-[10px] text-gray-400 mb-1">Cuota {c.num}</p>
                <p className="text-sm font-bold text-[#13193a]">{c.monto}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 mb-1.5">{c.vto}</p>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {c.estatus}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vehículo */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vehículo Asegurado</p>
          <p className="text-sm font-bold text-[#13193a] mb-3">{poliza.vehiculo.descripcion}</p>
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { k: "Modelo", v: poliza.vehiculo.modelo   },
              { k: "Placas", v: poliza.vehiculo.placas   },
              { k: "Serie",  v: poliza.vehiculo.serie    },
              { k: "Motor",  v: poliza.vehiculo.motor    },
              { k: "Capac.", v: poliza.vehiculo.capacidad},
            ].map((f) => (
              <DatoCard key={f.k} label={f.k} value={f.v} mono={f.k === "Serie"} />
            ))}
          </div>
        </div>

        {/* Coberturas */}
        <div>
          <div className="mb-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Coberturas</p>
            <p className="text-sm font-bold text-[#13193a] mt-0.5">{poliza.cobertura}</p>
          </div>
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#13193a]">
                  <th className="text-left  px-4 py-2.5 font-semibold text-white">Descripción</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-white">Monto Máx.</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-white hidden sm:table-cell">% Ded.</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-white hidden sm:table-cell">Imp. Ded.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {poliza.coberturas.map((c, i) => (
                  <tr key={i} className={c.sub ? "bg-gray-50/60" : "hover:bg-gray-50"}>
                    <td className={`px-4 py-2.5 ${c.sub ? "text-gray-400 pl-7" : "text-gray-700 font-medium"}`}>{c.desc}</td>
                    <td className={`px-4 py-2.5 text-right ${c.sub ? "text-gray-400" : "font-semibold text-[#13193a]"}`}>{c.monto}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400 hidden sm:table-cell">{c.ded}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400 hidden sm:table-cell">{c.imp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="px-5 pb-5 pt-1 flex gap-3">
        <button
          onClick={onLimpiar}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
        >
          Buscar otra póliza
        </button>
        <button
          onClick={onConfirmar}
          className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#13193a]/15"
        >
          Continuar con esta póliza
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Sección: Conductor del asegurado (NA / Operador) ──────────
// Compacta: nombre + teléfono + checkbox en una fila.
// Si se marca tercero: 2 inputs simples en columna abajo, sin borde.
function SeccionConductorNA({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  return (
    <Seccion titulo="Conductor del Asegurado (NA / Operador)">
      <div className="space-y-3">
        {/* Una sola fila: nombre | teléfono | checkbox */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className={LBL}>Nombre del conductor</label>
            <input
              value={data.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Nombre completo"
              className={INP}
            />
          </div>
          <div className="flex-1">
            <label className={LBL}>Teléfono</label>
            <input
              type="tel"
              value={data.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              placeholder="55 0000 0000"
              className={INP}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer shrink-0 pb-2.5 sm:pl-2">
            <button
              type="button"
              onClick={() => set("esTercero", !data.esTercero)}
              role="checkbox"
              aria-checked={data.esTercero}
              className={[
                "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                data.esTercero
                  ? "bg-[#13193a] border-[#13193a]"
                  : "bg-white border-gray-300 hover:border-gray-400",
              ].join(" ")}
            >
              {data.esTercero && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </button>
            <span
              onClick={() => set("esTercero", !data.esTercero)}
              className="text-xs font-medium text-gray-600 select-none whitespace-nowrap"
            >
              El conductor es un tercero
            </span>
          </label>
        </div>

        {/* Cuando se marca: dos inputs en columna, sin borde, sin subtítulo */}
        {data.esTercero && (
          <div className="space-y-3 pt-1">
            <div>
              <label className={LBL}>Nombre de contacto extra</label>
              <input
                value={data.contactoExtraNombre}
                onChange={(e) => set("contactoExtraNombre", e.target.value)}
                placeholder="Nombre"
                className={INP}
              />
            </div>
            <div>
              <label className={LBL}>Número de contacto extra</label>
              <input
                type="tel"
                value={data.contactoExtraTelefono}
                onChange={(e) => set("contactoExtraTelefono", e.target.value)}
                placeholder="55 0000 0000"
                className={INP}
              />
            </div>
          </div>
        )}
      </div>
    </Seccion>
  );
}

// ── Sección: Localización en cascada (compacta) ───────────────
function SeccionLocalizacion({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  const onCambiarEstado = (estado) => {
    onChange({ ...data, estado, municipio: "" });
  };

  const municipios = useMemo(
    () => (data.estado ? getMunicipios(data.estado) : []),
    [data.estado],
  );

  return (
    <Seccion titulo="Localización del Siniestro">
      <div className="space-y-3">
        {/* Fila 1: Estado | Municipio | CP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={LBL}>Estado <span className="text-red-400">*</span></label>
            <select
              value={data.estado}
              onChange={(e) => onCambiarEstado(e.target.value)}
              className={INP}
            >
              <option value="">Selecciona</option>
              {ESTADOS_MX.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LBL}>
              Municipio
              {data.estado && <span className="text-red-400"> *</span>}
            </label>
            <select
              value={data.municipio}
              onChange={(e) => set("municipio", e.target.value)}
              disabled={!data.estado}
              className={data.estado ? INP : INP_DISABLED}
            >
              <option value="">
                {data.estado ? "Selecciona" : "Primero estado"}
              </option>
              {municipios.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LBL}>Código Postal</label>
            <input
              value={data.cp}
              onChange={(e) => set("cp", e.target.value)}
              disabled={!data.municipio}
              placeholder="00000"
              maxLength={5}
              className={data.municipio ? INP : INP_DISABLED}
            />
          </div>
        </div>

        {/* Fila 2: Colonia | Calle | Número */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={LBL}>Colonia</label>
            <input
              value={data.colonia}
              onChange={(e) => set("colonia", e.target.value)}
              disabled={!data.municipio}
              placeholder={data.municipio ? "Nombre de la colonia" : "Primero municipio"}
              className={data.municipio ? INP : INP_DISABLED}
            />
          </div>
          <div>
            <label className={LBL}>Calle</label>
            <input
              value={data.calle}
              onChange={(e) => set("calle", e.target.value)}
              disabled={!data.colonia}
              placeholder={data.colonia ? "Av. Emiliano Zapata" : "Primero colonia"}
              className={data.colonia ? INP : INP_DISABLED}
            />
          </div>
          <div>
            <label className={LBL}>Número</label>
            <input
              value={data.numero}
              onChange={(e) => set("numero", e.target.value)}
              disabled={!data.calle}
              placeholder="145"
              className={data.calle ? INP : INP_DISABLED}
            />
          </div>
        </div>

        {/* Fila 3: Referencia (sola, full width) */}
        <div>
          <label className={LBL}>Referencia / Punto de ubicación</label>
          <textarea
            rows={2}
            value={data.referencia}
            onChange={(e) => set("referencia", e.target.value)}
            placeholder="Ej: Frente al OXXO, esquina con Av. Plan de Ayala..."
            className={INP + " resize-none"}
          />
        </div>
      </div>
    </Seccion>
  );
}

// ── Formulario del siniestro (Paso 2) ─────────────────────────
function FormSiniestro({ poliza, onBack, onSubmit, loading }) {
  const nroReporteRef = useRef(
    String(Math.floor(200000 + Math.random() * 99999)),
  );
  const nroReporte = nroReporteRef.current;

  const fechaHoy = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaActual = new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const [siniestro, setSiniestro] = useState({
    causa: "",
    circunstancia: "",
    detalles: "",
    ajustador: "",
  });
  const setS = (k, v) => setSiniestro((s) => ({ ...s, [k]: v }));

  const [conductorNA, setConductorNA] = useState({
    nombre: "",
    telefono: "",
    esTercero: false,
    contactoExtraNombre: "",
    contactoExtraTelefono: "",
  });

  const [localizacion, setLocalizacion] = useState({
    estado: "",
    municipio: "",
    cp: "",
    colonia: "",
    calle: "",
    numero: "",
    referencia: "",
  });

  const [terceros, setTerceros] = useState([TERCERO_VACIO()]);
  const agregarTercero = () => setTerceros((t) => [...t, TERCERO_VACIO()]);
  const eliminarTercero = (id) => {
    if (terceros.length > 1) setTerceros((t) => t.filter((x) => x.id !== id));
  };
  const actualizarTercero = useCallback((id, campo, valor) => {
    setTerceros((t) =>
      t.map((x) => (x.id === id ? { ...x, [campo]: valor } : x)),
    );
  }, []);

  const terceroVacio =
    terceros.length === 1 && !terceros[0].vehiculoPlacas && !terceros[0].vehiculoDesc;

  return (
    <div className="space-y-4 pb-10">
      {/* Banner póliza confirmada */}
      <div className="bg-[#13193a] rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">Póliza confirmada</p>
            <p className="text-white font-bold font-mono text-sm mt-0.5">{poliza.numero}</p>
            <p className="text-white/50 text-xs mt-0.5 max-w-xs truncate">{poliza.titular}</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-white/35 text-[11px]">Nro. Reporte</p>
            <p className="text-white font-bold font-mono text-xl leading-none mt-0.5">{nroReporte}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-white/35 text-[11px]">Fecha y Hora</p>
            <p className="text-white/70 text-xs mt-0.5">{fechaHoy} · {horaActual}</p>
          </div>
          <button
            onClick={onBack}
            className="text-white/35 hover:text-white text-xs underline underline-offset-2 transition-colors shrink-0"
          >
            Cambiar
          </button>
        </div>
      </div>

      {/* Titular */}
      <Seccion titulo="Titular — Certificado">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LBL}>Certificado / Póliza</label>
            <input readOnly value={poliza.numero} className={INP_RO} />
          </div>
          <div>
            <label className={LBL}>Titular</label>
            <input readOnly value={poliza.titular} className={INP_RO} />
          </div>
        </div>
      </Seccion>

      {/* Vehículo asegurado */}
      <Seccion titulo="Vehículo Asegurado">
        <div className="space-y-3">
          <p className="text-sm font-bold text-[#13193a]">{poliza.vehiculo.descripcion}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { k: "Modelo",    v: poliza.vehiculo.modelo    },
              { k: "Placas",    v: poliza.vehiculo.placas    },
              { k: "Serie",     v: poliza.vehiculo.serie     },
              { k: "Motor",     v: poliza.vehiculo.motor     },
              { k: "Capacidad", v: poliza.vehiculo.capacidad },
            ].map((c) => (
              <DatoCard key={c.k} label={c.k} value={c.v} />
            ))}
          </div>
        </div>
      </Seccion>

      {/* Conductor del asegurado (NA / Operador) */}
      <SeccionConductorNA data={conductorNA} onChange={setConductorNA} />

      {/* Vehículos terceros — solo datos del vehículo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#13193a] px-5 py-3.5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Vehículos Terceros / Afectados
            </h3>
            <p className="text-white/40 text-xs mt-0.5">
              {terceroVacio
                ? "Sin vehículos terceros registrados"
                : `${terceros.length} ${terceros.length === 1 ? "vehículo" : "vehículos"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={agregarTercero}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all border border-white/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Agregar tercero
          </button>
        </div>
        <div className="p-5 space-y-4">
          {terceros.map((t, i) => (
            <TerceroCard
              key={t.id}
              tercero={t}
              index={i}
              onChange={actualizarTercero}
              onRemove={eliminarTercero}
            />
          ))}
          {terceros.length >= 2 && (
            <button
              type="button"
              onClick={agregarTercero}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-[#13193a]/25 hover:text-[#13193a] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              Agregar otro vehículo tercero
            </button>
          )}
        </div>
      </div>

      {/* Información del siniestro */}
      <Seccion titulo="Información del Siniestro">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LBL}>Causa</label>
              <select
                value={siniestro.causa}
                onChange={(e) => setS("causa", e.target.value)}
                className={INP}
              >
                <option value="">Selecciona una causa</option>
                {CAUSAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>Circunstancia</label>
              <select
                value={siniestro.circunstancia}
                onChange={(e) => setS("circunstancia", e.target.value)}
                className={INP}
              >
                <option value="">Selecciona una circunstancia</option>
                {CIRCUNSTANCIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LBL}>Descripción del siniestro</label>
            <textarea
              value={siniestro.detalles}
              onChange={(e) => setS("detalles", e.target.value)}
              rows={3}
              placeholder="Describe lo que ocurrió con el mayor detalle posible..."
              className={INP + " resize-none"}
            />
          </div>
        </div>
      </Seccion>

      {/* Localización del siniestro */}
      <SeccionLocalizacion data={localizacion} onChange={setLocalizacion} />

      {/* Ajustador */}
      <Seccion titulo="Ajustador Asignado">
        <div className="max-w-xs">
          <label className={LBL}>Selecciona el ajustador</label>
          <select
            value={siniestro.ajustador}
            onChange={(e) => setS("ajustador", e.target.value)}
            className={INP}
          >
            <option value="">Selecciona un ajustador</option>
            {AJUSTADORES.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
      </Seccion>

      {/* Acciones */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Regresar
        </button>
        <button
          type="button"
          onClick={() =>
            onSubmit({
              ...siniestro,
              nroReporte,
              conductorNA,
              localizacion,
              terceros,
            })
          }
          disabled={loading}
          className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all disabled:opacity-60 shadow-lg shadow-[#13193a]/15"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Generando reporte...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Generar Reporte
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────────
export default function SiniestroNuevo() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [paso, setPaso] = useState("buscar");
  const [query, setQuery] = useState("");
  const [tipoDetect, setTipoDetect] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [poliza, setPoliza] = useState(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setNoEncontrado(false);
    setTipoDetect(v.trim() ? detectarTipo(v) : null);
  };

  const handleBuscar = async () => {
    if (!query.trim() || buscando) return;
    setBuscando(true);
    setNoEncontrado(false);
    const result = await buscarPoliza(query);
    setBuscando(false);
    if (result) {
      setPoliza(result);
      setPaso("confirmar");
    } else {
      setNoEncontrado(true);
      inputRef.current?.select();
    }
  };

  const handleSubmit = async (form) => {
    setLoading(true);
    // TODO: supabase.from("siniestros").insert({ poliza_id: poliza.id, ...form })
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    navigate("/siniestros");
  };

  const resetBusqueda = () => {
    setPoliza(null);
    setQuery("");
    setTipoDetect(null);
    setNoEncontrado(false);
    setPaso("buscar");
  };

  return (
    <div className="p-6 min-h-full bg-gray-50">
      {/* Header + indicador de pasos */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-[#13193a] hover:border-gray-300 transition-all shrink-0 mt-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#13193a]">Reportar Siniestro</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {paso !== "formulario"
              ? "Paso 1 de 2 — Busca y confirma la póliza"
              : "Paso 2 de 2 — Completa los datos del siniestro"}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0 mt-1">
          {[
            { n: 1, label: "Póliza",    done: paso === "formulario" },
            { n: 2, label: "Siniestro", done: false                   },
          ].map((s, i) => {
            const isActive =
              (i === 0 && paso !== "formulario") ||
              (i === 1 && paso === "formulario");
            return (
              <div key={s.n} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`w-8 h-px ${s.done || isActive ? "bg-[#13193a]" : "bg-gray-200"}`}/>
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s.done
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-[#13193a] text-white"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {s.done ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : s.n}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-[#13193a]" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paso 1: Buscador */}
      {paso === "buscar" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#13193a] mb-1">Buscar póliza</h2>
          <p className="text-xs text-gray-400 mb-5">
            Ingresa el <strong className="text-gray-600">número de póliza</strong>,{" "}
            <strong className="text-gray-600">No. de serie</strong>,{" "}
            <strong className="text-gray-600">placas</strong> o{" "}
            <strong className="text-gray-600">número de reporte</strong>. El sistema detecta automáticamente el tipo.
          </p>

          <div className="flex gap-3">
            <div className="relative flex-1">
              {tipoDetect && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none z-10">
                  <span>{TIPO_ICON[tipoDetect]}</span>
                  <span className="text-xs font-bold text-[#13193a] bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                    {TIPO_LABEL[tipoDetect]}
                  </span>
                </div>
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={handleQueryChange}
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                placeholder="Ej: 01250100001024-01 · A757LTS · 3N1EB31S09K323748"
                className={[
                  "w-full h-11 rounded-xl border-2 text-sm text-gray-700 placeholder-gray-300 bg-white",
                  "focus:outline-none focus:ring-0 transition-all",
                  tipoDetect ? "pl-32 pr-4" : "px-4",
                  noEncontrado
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-[#13193a]",
                ].join(" ")}
              />
            </div>
            <button
              onClick={handleBuscar}
              disabled={buscando || !query.trim()}
              className="h-11 px-6 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-semibold transition-all disabled:opacity-40 flex items-center gap-2 shrink-0"
            >
              {buscando ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Buscando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                  </svg>
                  Buscar
                </>
              )}
            </button>
          </div>

          {noEncontrado && (
            <p className="mt-3 text-sm text-red-500 flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.048-12.14c.866-1.5 3.032-1.5 3.898 0l7.048 12.14zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              No se encontró ninguna póliza. Verifica el dato e intenta de nuevo.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "🔑 Póliza",   ejemplo: "01250100001024-01" },
              { label: "🚗 Placas",   ejemplo: "A757LTS"            },
              { label: "🔢 No. Serie",ejemplo: "3N1EB31S09K323748"  },
              { label: "📋 Reporte",  ejemplo: "250423"             },
            ].map((h) => (
              <button
                key={h.label}
                onClick={() => {
                  setQuery(h.ejemplo);
                  setTipoDetect(detectarTipo(h.ejemplo));
                  setNoEncontrado(false);
                }}
                className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-[#13193a]/30 hover:text-[#13193a] transition-all"
              >
                {h.label} — <span className="font-mono">{h.ejemplo}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {paso === "confirmar" && poliza && (
        <PolizaCard
          poliza={poliza}
          onConfirmar={() => setPaso("formulario")}
          onLimpiar={resetBusqueda}
        />
      )}

      {paso === "formulario" && poliza && (
        <FormSiniestro
          poliza={poliza}
          onBack={() => setPaso("confirmar")}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}
