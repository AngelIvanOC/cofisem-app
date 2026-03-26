// ============================================================
// src/features/operador/polizas/FormCotizacion.jsx
// Formulario de cotización — datos del cliente, cobertura,
// vehículo, forma de pago y descuento
// ============================================================
import { useState } from "react";
import { CampoTexto, CampoSelect } from "../../../shared/forms/Campos";
import { COBERTURAS_CATALOGO, TIPOS_COBERTURA } from "../../../shared/constants/coberturas";
import TablaCoberturas from "./TablaCoberturas";
import ResumenPrima from "./ResumenPrima";

const OFICINA     = { nombre: "COFISEM AV. E.ZAPATA", codigo: "0126" };
const VENDEDORES  = ["ADMINISTRADOR", "Laura Rosher", "Marco A. Cruz", "Carlos Soto"];
const CLIENTES    = ["Angel Ivan Ortega Chaverría", "María García López", "Roberto Díaz Ramos", "Sofía Torres Ruiz", "Juan Pérez Salinas", "Carmen López Vargas"];

export default function FormCotizacion({ cotizacionInicial, onGuardar, onTramitar, onCancelar }) {
  const esEdicion = !!cotizacionInicial;
  const nroCot    = cotizacionInicial?.id ?? `COT-${OFICINA.codigo}01${Date.now().toString().slice(-6)}`;

  const [form, setForm] = useState({
    cliente:   cotizacionInicial?.cliente   ?? "",
    vendedor:  cotizacionInicial?.vendedor  ?? VENDEDORES[0],
    cobertura: cotizacionInicial?.cobertura ?? "",
    codAMIS:   "",
    unidad:    "",
    capacidad: "",
    modelo:    "",
    formaPago: "CONTADO",
    descPct:   0,
    inciso:    "",
  });
  const setF = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const coberturaData = COBERTURAS_CATALOGO[form.cobertura] ?? null;
  const formasPago    = coberturaData?.formasPago ?? ["CONTADO"];
  const primaNeta     = coberturaData?.primaNeta  ?? 0;
  const derechos      = coberturaData?.derechos   ?? 0;

  const calcTotal = () => {
    const desc = +(primaNeta * form.descPct / 100).toFixed(2);
    const iva  = +((primaNeta - desc + derechos) * 0.16).toFixed(2);
    return +(primaNeta - desc + derechos + iva).toFixed(2);
  };

  const fechaHoy = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaHoy  = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  const handleGuardar  = () => onGuardar({ id: nroCot, ...form, total: calcTotal(), fecha: `${fechaHoy} ${horaHoy}`, guardada: true });
  const handleTramitar = () => onTramitar({ id: nroCot, ...form, total: calcTotal(), fecha: `${fechaHoy} ${horaHoy}` });

  return (
    <div className="space-y-5">
      {/* Banner de identificación */}
      <div className="bg-[#13193a] rounded-2xl px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {[
            ["No. Cotización", nroCot,           "font-mono font-bold"],
            ["Fecha emisión",  fechaHoy,          "font-semibold"],
            ["Hora",           `${horaHoy} hrs.`, "font-semibold"],
            ["Punto de venta", OFICINA.nombre,    "font-semibold truncate"],
          ].map(([lbl, val, cls]) => (
            <div key={lbl}>
              <p className="text-white/40 mb-0.5">{lbl}</p>
              <p className={`text-white ${cls}`}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Datos principales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Datos de la cotización</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CampoSelect label="Vendedor"   value={form.vendedor}  onChange={(v) => setF("vendedor", v)}  opciones={VENDEDORES} />
          <CampoTexto  label="Empresa"    value="GAMAN, S.A. DE C.V." readonly />
          <div className="sm:col-span-2">
            <CampoSelect label="Cliente" value={form.cliente}   onChange={(v) => setF("cliente", v)}   opciones={["", ...CLIENTES]} req />
          </div>
          <div className="sm:col-span-2">
            <CampoSelect label="Cobertura" value={form.cobertura} onChange={(v) => setF("cobertura", v)} opciones={["", ...TIPOS_COBERTURA]} req />
          </div>
        </div>
      </div>

      {/* Tabla de coberturas */}
      <TablaCoberturas coberturaData={coberturaData} nombreCobertura={form.cobertura} />

      {/* Vehículo y condiciones */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Vehículo y condiciones</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CampoTexto label="Cód. AMIS"  value={form.codAMIS}   onChange={(v) => setF("codAMIS", v)}   placeholder="Código AMIS" />
          <div className="sm:col-span-2">
            <CampoTexto label="Buscar unidad por nombre" value={form.unidad} onChange={(v) => setF("unidad", v)} placeholder="Marca, modelo o descripción del vehículo" />
          </div>
          <CampoTexto label="Capacidad" value={form.capacidad} onChange={(v) => setF("capacidad", v)} placeholder="Pasajeros" />
          <CampoTexto label="Modelo"    value={form.modelo}    onChange={(v) => setF("modelo", v)}    placeholder="Año" />
          <CampoTexto label="Inciso"    value={form.inciso}    onChange={(v) => setF("inciso", v)}    placeholder="Inciso" />
        </div>

        {coberturaData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
            <CampoTexto label="Uso" value={coberturaData.uso} readonly />
            <CampoSelect label="Forma de pago" value={form.formaPago} onChange={(v) => setF("formaPago", v)} opciones={formasPago} />
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">% Descuento</label>
              <input
                type="number" min="0" max="30" step="0.5"
                value={form.descPct}
                onChange={(e) => setF("descPct", parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Resumen de prima */}
      <ResumenPrima primaNeta={primaNeta} derechos={derechos} descPct={form.descPct} />

      {/* Acciones */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button onClick={onCancelar} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={!form.cliente || !form.cobertura}
          className="px-5 py-2.5 rounded-xl border border-[#13193a] text-sm font-semibold text-[#13193a] hover:bg-[#13193a]/5 disabled:opacity-40 transition-all"
        >
          Guardar cotización
        </button>
        <button
          onClick={handleTramitar}
          disabled={!form.cliente || !form.cobertura || !form.unidad}
          className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all flex items-center gap-2 shadow-lg shadow-[#13193a]/15"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tramitar póliza
        </button>
      </div>
    </div>
  );
}
