// ============================================================
// Configuración de comisiones (ADMINISTRACION) — con aspecto de Excel
// (hojas abajo, cuadrícula, barra de fórmulas) porque el cliente trabaja
// todo en Excel.
//
// Hojas:
//   · % Externas   — % por "Tipo de vehículo".
//   · % GAMAN      — % por producto (nombre de la cobertura).
//   · Deducciones  — retenido e impuesto (%), con un ejemplo vivo.
//   · Gastos admin.— $ por pago según la forma de pago (y OBLIGATORIO).
//   · Por revisar  — pagos cuyo neto sale en $0 o menos: el admin asigna
//                    el monto (queda como monto manual autorizado).
//   · Solicitudes  — montos manuales que piden las encargadas.
//
// Todo valor vive en comision_reglas. Un cambio NO edita la fila: inserta
// una nueva con su "aplica desde" (siempre desde mañana; lo exige la BD) y
// afecta solo a las pólizas que se registren desde esa fecha. Las ya
// creadas conservan sus valores en todos sus pagos.
// ============================================================
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Loader2, Check, X, Inbox, FunctionSquare, Table2 } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { hoyISO } from "../../utils/fecha";
import { getState } from "../../auth.js";
import { cuotasDePoliza } from "../pagos/cuotasCofisem";
import {
  TIPOS_VEHICULO,
  SELECT_POLIZA_COMISION,
  cargarContextoComisiones,
  calcularComisionCuota,
} from "./comisionesCalculo";

const n = (v) => parseFloat(v) || 0;
const $ = (v) =>
  `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) =>
  d
    ? new Date(d.length > 10 ? d : d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";
const num = (v, dec = 3) => Number(v).toLocaleString("es-MX", { maximumFractionDigits: dec });
const valorTxt = (v, unidad) =>
  v == null ? "" : unidad === "$" ? $(v) : `${num(v)}%`;
const desdeTxt = (d) => (d <= "2000-01-01" ? "Inicial" : fmt(d));

// Paleta "Excel".
const XL = {
  verde: "#217346",
  borde: "#d4d4d4",
  encabezado: "#f3f3f3",
  font: { fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif" },
};
const LETRAS = ["A", "B", "C", "D", "E", "F", "G"];

const DEDUCCIONES = [
  { clave: "RETENIDO", etiqueta: "Retenido", ayuda: "Se descuenta de la comisión" },
  { clave: "IMPUESTO", etiqueta: "Impuesto", ayuda: "Sobre la comisión menos el retenido" },
];
const GASTOS = [
  { clave: "CONTADO", etiqueta: "Contado" },
  { clave: "SEMESTRAL", etiqueta: "Semestral" },
  { clave: "CUATRIMESTRAL", etiqueta: "Cuatrimestral" },
  { clave: "TRIMESTRAL", etiqueta: "Trimestral" },
  { clave: "MENSUAL", etiqueta: "Mensual" },
  { clave: "4 PARCIALES", etiqueta: "4 parciales" },
  { clave: "GAMAN CONTADO", etiqueta: "GAMAN contado" },
  { clave: "GAMAN PAGOS", etiqueta: "GAMAN en pagos" },
  { clave: "OBLIGATORIO", etiqueta: "Cobertura OBLIGATORIO", ayuda: "Cualquier forma de pago" },
];

const HOJAS = [
  { k: "EXTERNA", label: "% Externas" },
  { k: "GAMAN", label: "% GAMAN" },
  { k: "DEDUCCION", label: "Deducciones" },
  { k: "GASTOS", label: "Gastos admin." },
  { k: "REVISAR", label: "Por revisar" },
  { k: "SOLICITUDES", label: "Solicitudes" },
];

const TITULO_VALOR = {
  EXTERNA: "% comisión",
  GAMAN: "% comisión",
  DEDUCCION: "%",
  GASTOS: "$ por pago",
};
const TITULO_CONCEPTO = {
  EXTERNA: "Tipo de vehículo",
  GAMAN: "Producto",
  DEDUCCION: "Concepto",
  GASTOS: "Forma de pago",
};

export default function ConfiguracionComisiones() {
  const [hoja, setHoja] = useState("EXTERNA");
  const [reglas, setReglas] = useState([]);
  const [coberturas, setCoberturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cuentas, setCuentas] = useState({ REVISAR: 0, SOLICITUDES: 0 });
  // Barra de fórmulas: lo que describe la celda seleccionada.
  const [formula, setFormula] = useState({ ref: "", texto: "" });

  const cargarReglas = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        supabase
          .from("comision_reglas")
          .select("id, ambito, clave, porcentaje, vigente_desde, nota, created_at")
          .order("vigente_desde", { ascending: false })
          .order("id", { ascending: false }),
        supabase.from("coberturas").select("nombre, prima_total, activa").order("prima_total"),
      ]);
      if (r.error) throw r.error;
      if (c.error) throw c.error;
      setReglas(r.data ?? []);
      setCoberturas(c.data ?? []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarReglas();
  }, [cargarReglas]);

  const setCuenta = useCallback(
    (k, v) => setCuentas((c) => (c[k] === v ? c : { ...c, [k]: v })),
    [],
  );
  const cuentaRevisar = useCallback((v) => setCuenta("REVISAR", v), [setCuenta]);
  const cuentaSolicitudes = useCallback((v) => setCuenta("SOLICITUDES", v), [setCuenta]);

  // GAMAN: una fila por nombre de cobertura (con valor primero).
  const productosGaman = useMemo(() => {
    const dia = hoyISO();
    const porNombre = new Map();
    for (const c of coberturas) {
      const prev = porNombre.get(c.nombre);
      if (!prev || (c.activa && !prev.activa)) porNombre.set(c.nombre, c);
    }
    for (const r of reglas)
      if (r.ambito === "GAMAN" && !porNombre.has(r.clave))
        porNombre.set(r.clave, { nombre: r.clave, prima_total: null, activa: false });
    const tienePct = (nombre) =>
      reglas.find((x) => x.ambito === "GAMAN" && x.clave === nombre && x.vigente_desde <= dia)
        ?.porcentaje != null;
    return [...porNombre.values()]
      .sort(
        (a, b) =>
          tienePct(b.nombre) - tienePct(a.nombre) ||
          b.activa - a.activa ||
          n(a.prima_total) - n(b.prima_total),
      )
      .map((c) => ({
        clave: c.nombre,
        etiqueta: c.nombre,
        ayuda: c.prima_total != null ? $(c.prima_total) : "Ya no existe",
        inactiva: !c.activa,
      }));
  }, [coberturas, reglas]);

  const filasPorHoja = {
    EXTERNA: TIPOS_VEHICULO.map((t) => ({ clave: t, etiqueta: t })),
    GAMAN: productosGaman,
    DEDUCCION: DEDUCCIONES,
    GASTOS,
  };

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1447e6] flex items-center gap-2">
          <Table2 className="w-6 h-6" />
          Configuración de comisiones
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Porcentajes, deducciones y gastos con los que se calcula el neto de cada vale.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* "Libro" estilo Excel: barra de fórmulas, hoja y pestañas abajo */}
      <div
        className="bg-white border shadow-sm rounded-lg overflow-hidden"
        style={{ ...XL.font, borderColor: XL.borde }}
      >
        <div className="flex items-stretch border-b text-sm" style={{ borderColor: XL.borde }}>
          <div
            className="w-20 px-3 py-1.5 border-r text-gray-600 font-semibold flex items-center"
            style={{ borderColor: XL.borde }}
          >
            {formula.ref}
          </div>
          <div className="px-2 flex items-center border-r text-gray-400" style={{ borderColor: XL.borde }}>
            <FunctionSquare className="w-4 h-4" />
          </div>
          <div className="flex-1 px-3 py-1.5 text-gray-700 truncate">
            {formula.texto || (
              <span className="text-gray-400">
                Selecciona una celda. Para cambiar un valor, escríbelo y presiona Enter.
              </span>
            )}
          </div>
        </div>

        <div className="min-h-[420px] max-h-[62vh] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </div>
          ) : hoja === "REVISAR" ? (
            <HojaPorRevisar onCuenta={cuentaRevisar} onFormula={setFormula} />
          ) : hoja === "SOLICITUDES" ? (
            <HojaSolicitudes onCuenta={cuentaSolicitudes} onFormula={setFormula} />
          ) : (
            <>
              <HojaReglas
                key={hoja}
                ambito={hoja}
                unidad={hoja === "GASTOS" ? "$" : "%"}
                filas={filasPorHoja[hoja]}
                reglas={reglas}
                onGuardado={cargarReglas}
                onFormula={setFormula}
              />
              {hoja === "DEDUCCION" && <EjemploCalculo reglas={reglas} />}
            </>
          )}
        </div>

        {/* Pestañas de hojas */}
        <div className="flex items-end gap-0.5 px-2 border-t bg-[#f3f3f3]" style={{ borderColor: XL.borde }}>
          {HOJAS.map((h) => {
            const activa = h.k === hoja;
            const cuenta = cuentas[h.k];
            return (
              <button
                key={h.k}
                type="button"
                onClick={() => {
                  setHoja(h.k);
                  setFormula({ ref: "", texto: "" });
                }}
                className={`px-4 py-1.5 text-[13px] border-x border-b -mt-px transition-colors ${
                  activa ? "bg-white font-semibold" : "text-gray-600 hover:bg-white/60"
                }`}
                style={{
                  borderColor: activa ? XL.borde : "transparent",
                  color: activa ? XL.verde : undefined,
                  boxShadow: activa ? `inset 0 -2px 0 ${XL.verde}` : undefined,
                }}
              >
                {h.label}
                {cuenta > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold px-1.5 py-px rounded-full bg-amber-100 text-amber-700">
                    {cuenta}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Los cambios aplican a las pólizas que se registren desde la fecha elegida (siempre a partir de
        mañana). Las pólizas ya creadas conservan sus valores en todos sus pagos.
      </p>
    </div>
  );
}

// ── Cuadrícula base ───────────────────────────────────────────────────────
function Grid({ columnas, children }) {
  return (
    <table className="border-collapse text-[13px] w-full" style={XL.font}>
      <thead className="sticky top-0 z-10">
        <tr>
          <th
            className="w-10 border text-[11px] font-normal text-gray-500"
            style={{ background: XL.encabezado, borderColor: XL.borde }}
          />
          {columnas.map((c, i) => (
            <th
              key={i}
              className="border text-[11px] font-normal text-gray-500 py-0.5"
              style={{ background: XL.encabezado, borderColor: XL.borde, width: c.w }}
            >
              {LETRAS[i]}
            </th>
          ))}
        </tr>
        <tr>
          <td
            className="border text-[11px] text-center text-gray-500"
            style={{ background: XL.encabezado, borderColor: XL.borde }}
          >
            1
          </td>
          {columnas.map((c, i) => (
            <td
              key={i}
              className={`border px-2 py-1 font-bold text-gray-700 bg-[#e8f1ec] ${c.align === "right" ? "text-right" : ""}`}
              style={{ borderColor: XL.borde }}
            >
              {c.label}
            </td>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function NumFila({ i }) {
  return (
    <td
      className="border text-[11px] text-center text-gray-500 select-none"
      style={{ background: XL.encabezado, borderColor: XL.borde }}
    >
      {i}
    </td>
  );
}

function Celda({ children, align, sel, onClick, onDoubleClick, className = "", style }) {
  return (
    <td
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`border px-2 py-1 whitespace-nowrap ${align === "right" ? "text-right" : ""} ${className}`}
      style={{
        borderColor: XL.borde,
        outline: sel ? `2px solid ${XL.verde}` : undefined,
        outlineOffset: -2,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

// ── Hojas de valores (% Externas, % GAMAN, Deducciones, Gastos) ──────────
function HojaReglas({ ambito, unidad, filas, reglas, onGuardado, onFormula }) {
  const [sel, setSel] = useState(null); // índice de fila seleccionada
  const [editando, setEditando] = useState(null); // { i, texto }
  const [confirmar, setConfirmar] = useState(null); // { fila, valor }
  const contenedor = useRef(null);
  const hoy = hoyISO();

  const vigente = (clave) => {
    let r = null;
    for (const x of reglas)
      if (x.ambito === ambito && x.clave === clave && x.vigente_desde <= hoy)
        if (!r || x.vigente_desde > r.vigente_desde) r = x;
    return r;
  };
  const proxima = (clave) =>
    reglas
      .filter((x) => x.ambito === ambito && x.clave === clave && x.vigente_desde > hoy)
      .sort((a, b) => a.vigente_desde.localeCompare(b.vigente_desde))[0] ?? null;

  const describir = (i) => {
    const f = filas[i];
    if (!f) return { ref: "", texto: "" };
    const v = vigente(f.clave);
    const hist = reglas
      .filter((x) => x.ambito === ambito && x.clave === f.clave)
      .sort((a, b) => a.vigente_desde.localeCompare(b.vigente_desde))
      .map((x) => `${valorTxt(x.porcentaje, unidad) || "sin valor"} (${desdeTxt(x.vigente_desde).toLowerCase()})`)
      .join(" → ");
    const valor = v?.porcentaje != null ? valorTxt(v.porcentaje, unidad) : "sin valor";
    return {
      ref: `B${i + 2}`,
      texto: `${f.etiqueta}: ${valor}${unidad === "$" ? " por pago" : ""}${hist ? ` · Historial: ${hist}` : ""}`,
    };
  };

  const seleccionar = (i) => {
    setSel(i);
    onFormula(describir(i));
    contenedor.current?.focus();
  };

  const empezarEdicion = (i, texto) => {
    const v = vigente(filas[i].clave);
    setEditando({ i, texto: texto ?? (v?.porcentaje != null ? String(Number(v.porcentaje)) : "") });
  };

  const terminarEdicion = () => {
    if (!editando) return;
    const fila = filas[editando.i];
    const t = editando.texto.trim().replace(/[%$,\s]/g, "");
    setEditando(null);
    const actual = vigente(fila.clave)?.porcentaje;
    const nuevo = t === "" ? null : Number(t);
    if (t !== "" && Number.isNaN(nuevo)) {
      Swal.fire({ icon: "warning", title: "Valor no válido", text: "Escribe solo el número.", confirmButtonColor: XL.verde });
      return;
    }
    if (nuevo === (actual == null ? null : Number(actual))) return; // sin cambio
    setConfirmar({ fila, valor: nuevo });
  };

  const onKeyDown = (e) => {
    if (editando || sel == null) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      seleccionar(Math.min(sel + 1, filas.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      seleccionar(Math.max(sel - 1, 0));
    } else if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      empezarEdicion(sel);
    } else if (/^[0-9.]$/.test(e.key)) {
      e.preventDefault();
      empezarEdicion(sel, e.key);
    }
  };

  return (
    <div ref={contenedor} tabIndex={0} onKeyDown={onKeyDown} className="outline-none">
      <Grid
        columnas={[
          { label: TITULO_CONCEPTO[ambito], w: "40%" },
          { label: TITULO_VALOR[ambito], w: "14%", align: "right" },
          { label: "Vigente desde", w: "14%" },
          { label: "Próximo cambio", w: "16%" },
          { label: "Nota", w: "16%" },
        ]}
      >
        {filas.map((f, i) => {
          const v = vigente(f.clave);
          const prox = proxima(f.clave);
          const esSel = sel === i;
          const enEdicion = editando?.i === i;
          return (
            <tr key={f.clave} className={f.inactiva ? "opacity-60" : ""}>
              <NumFila i={i + 2} />
              <Celda onClick={() => seleccionar(i)} className="text-gray-800">
                {f.etiqueta}
                {f.ayuda && <span className="ml-2 text-[11px] text-gray-400">{f.ayuda}</span>}
              </Celda>
              <Celda
                align="right"
                sel={esSel}
                onClick={() => seleccionar(i)}
                onDoubleClick={() => empezarEdicion(i)}
                className="cursor-cell font-semibold"
                style={{ background: esSel ? "#eaf5ee" : undefined }}
              >
                {enEdicion ? (
                  <input
                    autoFocus
                    value={editando.texto}
                    onChange={(e) => setEditando({ ...editando, texto: e.target.value })}
                    onBlur={terminarEdicion}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") terminarEdicion();
                      if (e.key === "Escape") setEditando(null);
                    }}
                    className="w-full text-right bg-white outline-none font-semibold"
                    style={XL.font}
                  />
                ) : v?.porcentaje != null ? (
                  <span style={{ color: XL.verde }}>{valorTxt(v.porcentaje, unidad)}</span>
                ) : (
                  <span className="text-[11px] font-bold px-1.5 py-px rounded bg-amber-100 text-amber-700">
                    Sin valor
                  </span>
                )}
              </Celda>
              <Celda onClick={() => seleccionar(i)} className="text-gray-500">
                {v ? desdeTxt(v.vigente_desde) : ""}
              </Celda>
              <Celda onClick={() => seleccionar(i)} className="text-blue-700">
                {prox ? `${valorTxt(prox.porcentaje, unidad) || "Sin valor"} desde ${fmt(prox.vigente_desde)}` : ""}
              </Celda>
              <Celda onClick={() => seleccionar(i)} className="text-gray-400 max-w-[180px] truncate">
                {v?.nota && !v.nota.startsWith("Valor inicial") ? v.nota : ""}
              </Celda>
            </tr>
          );
        })}
      </Grid>

      {confirmar && (
        <ModalConfirmarCambio
          ambito={ambito}
          unidad={unidad}
          fila={confirmar.fila}
          valor={confirmar.valor}
          actual={vigente(confirmar.fila.clave)?.porcentaje ?? null}
          onClose={() => setConfirmar(null)}
          onGuardado={() => {
            setConfirmar(null);
            onGuardado();
          }}
        />
      )}
    </div>
  );
}

// Confirmación de un cambio: desde cuándo aplica (mínimo mañana) + nota.
function ModalConfirmarCambio({ ambito, unidad, fila, valor, actual, onClose, onGuardado }) {
  const [manana] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return hoyISO(d);
  });
  const [desde, setDesde] = useState(manana);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar() {
    if (valor != null && (valor < 0 || (unidad === "%" && valor > 100)))
      return setError(unidad === "%" ? "El porcentaje debe estar entre 0 y 100." : "El monto no puede ser negativo.");
    if (!desde || desde < manana) return setError("El cambio solo puede aplicar a partir de mañana.");
    setGuardando(true);
    setError(null);
    try {
      const { error: err } = await supabase.from("comision_reglas").insert({
        ambito,
        clave: fila.clave,
        porcentaje: valor,
        vigente_desde: desde,
        nota: nota.trim() || null,
        creado_por: getState().usuario?.id ?? null,
      });
      if (err) throw err;
      onGuardado();
    } catch (e) {
      setError(e.code === "23505" ? "Ya hay un cambio programado para esa fecha. Elige otra." : e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-sm border"
        style={{ ...XL.font, borderColor: XL.borde }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 text-white rounded-t-lg" style={{ background: XL.verde }}>
          <p className="text-sm font-semibold">Confirmar cambio</p>
          <p className="text-xs opacity-90 truncate">{fila.etiqueta}</p>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <p className="text-gray-700">
            <span className="text-gray-400 line-through mr-2">{valorTxt(actual, unidad) || "sin valor"}</span>
            → <strong style={{ color: XL.verde }}>{valorTxt(valor, unidad) || "sin valor"}</strong>
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Aplica desde</span>
            <input
              type="date"
              min={manana}
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full px-2.5 py-1.5 border rounded text-gray-700 outline-none"
              style={{ borderColor: XL.borde }}
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Nota (opcional)</span>
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej. acuerdo de octubre"
              className="w-full px-2.5 py-1.5 border rounded text-gray-700 outline-none"
              style={{ borderColor: XL.borde }}
            />
          </label>
          <p className="text-xs text-gray-400">
            Aplica a las pólizas que se registren desde esa fecha. Las ya creadas conservan su valor en
            todos sus pagos.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-1.5 rounded border text-gray-600 hover:bg-gray-50"
              style={{ borderColor: XL.borde }}
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              className="px-4 py-1.5 rounded text-white font-semibold disabled:opacity-50"
              style={{ background: XL.verde }}
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ejemplo vivo (hoja Deducciones): una póliza GAMAN de $2,500 de contado
// con los valores vigentes hoy — cada renglón muestra su "fórmula".
function EjemploCalculo({ reglas }) {
  const hoy = hoyISO();
  const val = (ambito, clave) => {
    let r = null;
    for (const x of reglas)
      if (x.ambito === ambito && x.clave === clave && x.vigente_desde <= hoy)
        if (!r || x.vigente_desde > r.vigente_desde) r = x;
    return r?.porcentaje != null ? Number(r.porcentaje) : null;
  };
  const neta = 1755.17;
  const pct = val("GAMAN", "BASICA SERVICIO PÚBLICO 50/50 GAMAN 2");
  const ret = val("DEDUCCION", "RETENIDO");
  const imp = val("DEDUCCION", "IMPUESTO");
  const gas = val("GASTOS", "GAMAN CONTADO");
  if ([pct, ret, imp, gas].some((v) => v == null)) return null;
  const bruto = (neta * pct) / 100;
  const r = (bruto * ret) / 100;
  const i = ((bruto - r) * imp) / 100;
  const netoExacto = bruto - r - i - gas;
  const filas = [
    ["Prima neta del pago", "GAMAN $2,500 contado", $(neta)],
    ["Comisión", `= prima neta × ${num(pct)}%`, $(bruto)],
    ["Retenido", `= comisión × ${num(ret)}%`, `−${$(r)}`],
    ["Impuesto", `= (comisión − retenido) × ${num(imp)}%`, `−${$(i)}`],
    ["Gastos de administración", "GAMAN contado", `−${$(gas)}`],
    ["Neto a pagar (vale)", "redondeado al peso", $(Math.round(netoExacto))],
  ];
  return (
    <div className="p-4">
      <p className="text-xs font-semibold text-gray-500 mb-2">Ejemplo con los valores vigentes hoy</p>
      <table className="border-collapse text-[13px]" style={XL.font}>
        <tbody>
          {filas.map(([a, b, c], k) => {
            const total = k === filas.length - 1;
            return (
              <tr key={k} className={total ? "font-bold" : ""}>
                <td className="border px-3 py-1 text-gray-700" style={{ borderColor: XL.borde, background: total ? "#e8f1ec" : undefined }}>{a}</td>
                <td className="border px-3 py-1 text-gray-400 italic" style={{ borderColor: XL.borde }}>{b}</td>
                <td className="border px-3 py-1 text-right" style={{ borderColor: XL.borde, color: total ? XL.verde : undefined }}>{c}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Por revisar: pagos con neto ≤ $0 ─────────────────────────────────────
// El admin asigna el neto a pagar: queda como solicitud APROBADA y la
// encargada ya puede capturar el vale con ese monto.
function HojaPorRevisar({ onCuenta, onFormula }) {
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sel, setSel] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data, error: err }, ctx] = await Promise.all([
        supabase
          .from("polizas_cofisem")
          .select(
            `${SELECT_POLIZA_COMISION},
             comisiones_cofisem(num_cuota),
             comision_solicitudes(num_cuota, estatus),
             oficinas(nombre)`,
          )
          .not("vendedor_id", "is", null)
          .neq("vendedor_id", 1),
        cargarContextoComisiones(),
      ]);
      if (err) throw err;
      const out = [];
      for (const p of data ?? []) {
        const conVale = new Set((p.comisiones_cofisem ?? []).map((c) => c.num_cuota));
        const atendidas = new Set(
          (p.comision_solicitudes ?? [])
            .filter((s) => s.estatus !== "RECHAZADA")
            .map((s) => s.num_cuota),
        );
        for (const c of cuotasDePoliza(p)) {
          if (conVale.has(c.num_cuota) || atendidas.has(c.num_cuota)) continue;
          const calc = calcularComisionCuota(p, c, ctx);
          if (calc.estado === "NETO_CERO") out.push({ p, numCuota: c.num_cuota, calc });
        }
      }
      setFilas(out);
      onCuenta(out.length);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [onCuenta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function asignar(f) {
    const { value, isConfirmed } = await Swal.fire({
      title: "Asignar neto a pagar",
      html: `Póliza <b>${f.p.numero_poliza}</b> · pago ${f.numCuota}<br/><span style="font-size:12px;color:#6b7280">Comisión ${$(f.calc.comision)} · gastos ${$(f.calc.gastos)} → el neto sale en $0 o menos</span>`,
      input: "number",
      inputAttributes: { min: "0", step: "0.01" },
      inputValue: "0",
      inputLabel: "Neto a pagar (puede ser $0)",
      showCancelButton: true,
      confirmButtonColor: XL.verde,
      confirmButtonText: "Asignar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    const monto = Number(value);
    if (Number.isNaN(monto) || monto < 0) return;
    try {
      const yo = getState().usuario?.id ?? null;
      const { data: sol, error: e1 } = await supabase
        .from("comision_solicitudes")
        .insert({
          poliza_cofisem_id: f.p.id,
          num_cuota: f.numCuota,
          monto,
          motivo: "Asignado por administración (el neto calculado salía en $0 o menos)",
          solicitado_por: yo,
        })
        .select("id")
        .single();
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("comision_solicitudes")
        .update({ estatus: "APROBADA", resuelto_por: yo, resuelto_at: new Date().toISOString() })
        .eq("id", sol.id);
      if (e2) throw e2;
      await cargar();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message, confirmButtonColor: XL.verde });
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Calculando…
      </div>
    );
  if (error) return <p className="p-4 text-sm text-red-600">{error}</p>;
  if (filas.length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
        <Inbox className="w-7 h-7" />
        <span className="text-sm">Ningún pago con neto en $0 o menos.</span>
      </div>
    );

  return (
    <Grid
      columnas={[
        { label: "Póliza", w: "16%" },
        { label: "Vendedor", w: "22%" },
        { label: "Pago", w: "6%", align: "right" },
        { label: "Comisión", w: "11%", align: "right" },
        { label: "Gastos", w: "10%", align: "right" },
        { label: "Neto calculado", w: "13%", align: "right" },
        { label: "", w: "12%" },
      ]}
    >
      {filas.map((f, i) => {
        const neto = n(f.calc.comision) - n(f.calc.retenido) - n(f.calc.impuesto) - n(f.calc.gastos);
        const pick = () => {
          setSel(i);
          onFormula({
            ref: `A${i + 2}`,
            texto: `${f.p.numero_poliza} · pago ${f.numCuota} · ${f.p.oficinas?.nombre ?? ""} · comisión ${$(f.calc.comision)} − retenido ${$(f.calc.retenido)} − impuesto ${$(f.calc.impuesto)} − gastos ${$(f.calc.gastos)} = ${$(neto)}`,
          });
        };
        return (
          <tr key={`${f.p.id}-${f.numCuota}`}>
            <NumFila i={i + 2} />
            <Celda sel={sel === i} onClick={pick} className="font-mono text-[#1447e6]">{f.p.numero_poliza}</Celda>
            <Celda onClick={pick} className="truncate max-w-[220px]">{f.p.vendedor_nombre}</Celda>
            <Celda onClick={pick} align="right">{f.numCuota}</Celda>
            <Celda onClick={pick} align="right">{$(f.calc.comision)}</Celda>
            <Celda onClick={pick} align="right">{$(f.calc.gastos)}</Celda>
            <Celda onClick={pick} align="right" className="text-red-600 font-semibold">{$(neto)}</Celda>
            <Celda>
              <button
                onClick={() => asignar(f)}
                className="px-2.5 py-0.5 rounded text-white text-xs font-semibold"
                style={{ background: XL.verde }}
              >
                Asignar monto
              </button>
            </Celda>
          </tr>
        );
      })}
    </Grid>
  );
}

// ── Solicitudes de monto manual ──────────────────────────────────────────
function HojaSolicitudes({ onCuenta, onFormula }) {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolviendo, setResolviendo] = useState(null);
  const [sel, setSel] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("comision_solicitudes")
        .select(
          `id, num_cuota, monto, motivo, estatus, nota_resolucion, created_at, resuelto_at,
           solicitante:usuarios!comision_solicitudes_solicitado_por_fkey(nombre, apellido),
           polizas_cofisem(numero_poliza, aseguradora, vendedor_nombre, oficinas(nombre))`,
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (err) throw err;
      // Pendientes primero.
      const ordenadas = (data ?? []).sort(
        (a, b) => (a.estatus === "PENDIENTE" ? 0 : 1) - (b.estatus === "PENDIENTE" ? 0 : 1),
      );
      setLista(ordenadas);
      onCuenta(ordenadas.filter((s) => s.estatus === "PENDIENTE").length);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [onCuenta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function resolver(s, estatus) {
    let nota = null;
    if (estatus === "RECHAZADA") {
      const { value, isConfirmed } = await Swal.fire({
        title: "Rechazar solicitud",
        input: "text",
        inputLabel: "Motivo del rechazo (lo verá la encargada)",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Rechazar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;
      nota = value?.trim() || null;
    } else {
      const { isConfirmed } = await Swal.fire({
        icon: "question",
        title: "Autorizar monto",
        html: `Se podrá capturar el vale del pago <b>${s.num_cuota}</b> de la póliza <b>${s.polizas_cofisem?.numero_poliza ?? "—"}</b> con un neto de <b>${$(s.monto)}</b>.`,
        showCancelButton: true,
        confirmButtonColor: XL.verde,
        confirmButtonText: "Autorizar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;
    }
    setResolviendo(s.id);
    try {
      const { data, error: err } = await supabase
        .from("comision_solicitudes")
        .update({
          estatus,
          nota_resolucion: nota,
          resuelto_por: getState().usuario?.id ?? null,
          resuelto_at: new Date().toISOString(),
        })
        .eq("id", s.id)
        .eq("estatus", "PENDIENTE")
        .select("id");
      if (err) throw err;
      if (!data?.length) throw new Error("No se pudo actualizar (¿ya estaba resuelta o no tienes permiso?).");
      await cargar();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message, confirmButtonColor: XL.verde });
    } finally {
      setResolviendo(null);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
      </div>
    );
  if (error) return <p className="p-4 text-sm text-red-600">{error}</p>;
  if (lista.length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
        <Inbox className="w-7 h-7" />
        <span className="text-sm">Sin solicitudes.</span>
      </div>
    );

  const nombre = (u) => [u?.nombre, u?.apellido].filter(Boolean).join(" ") || "—";
  const ESTADO = {
    PENDIENTE: { txt: "Pendiente", cls: "bg-amber-100 text-amber-700" },
    APROBADA: { txt: "Autorizada", cls: "bg-emerald-100 text-emerald-700" },
    RECHAZADA: { txt: "Rechazada", cls: "bg-red-100 text-red-600" },
  };

  return (
    <Grid
      columnas={[
        { label: "Póliza", w: "15%" },
        { label: "Pago", w: "5%", align: "right" },
        { label: "Neto solicitado", w: "11%", align: "right" },
        { label: "Motivo", w: "28%" },
        { label: "Solicitó", w: "17%" },
        { label: "Estado", w: "9%" },
        { label: "", w: "15%" },
      ]}
    >
      {lista.map((s, i) => {
        const pick = () => {
          setSel(i);
          onFormula({
            ref: `A${i + 2}`,
            texto: `${s.polizas_cofisem?.numero_poliza ?? ""} · ${s.polizas_cofisem?.aseguradora ?? ""} · vendedor ${s.polizas_cofisem?.vendedor_nombre ?? "—"} · ${s.polizas_cofisem?.oficinas?.nombre ?? ""} · “${s.motivo}”${s.nota_resolucion ? ` · respuesta: ${s.nota_resolucion}` : ""}`,
          });
        };
        const e = ESTADO[s.estatus];
        return (
          <tr key={s.id}>
            <NumFila i={i + 2} />
            <Celda sel={sel === i} onClick={pick} className="font-mono text-[#1447e6]">{s.polizas_cofisem?.numero_poliza ?? "—"}</Celda>
            <Celda onClick={pick} align="right">{s.num_cuota}</Celda>
            <Celda onClick={pick} align="right" className="font-semibold">{$(s.monto)}</Celda>
            <Celda onClick={pick} className="truncate max-w-[280px] text-gray-600">{s.motivo}</Celda>
            <Celda onClick={pick} className="text-gray-500">{nombre(s.solicitante)} · {fmt(s.created_at)}</Celda>
            <Celda onClick={pick}>
              <span className={`text-[11px] font-bold px-1.5 py-px rounded ${e.cls}`}>{e.txt}</span>
            </Celda>
            <Celda>
              {s.estatus === "PENDIENTE" && (
                <div className="flex gap-1">
                  <button
                    disabled={resolviendo === s.id}
                    onClick={() => resolver(s, "RECHAZADA")}
                    className="flex items-center gap-1 px-2 py-0.5 rounded border text-xs text-gray-600 hover:text-red-600"
                    style={{ borderColor: XL.borde }}
                  >
                    <X className="w-3 h-3" /> Rechazar
                  </button>
                  <button
                    disabled={resolviendo === s.id}
                    onClick={() => resolver(s, "APROBADA")}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-white text-xs font-semibold"
                    style={{ background: XL.verde }}
                  >
                    <Check className="w-3 h-3" /> Autorizar
                  </button>
                </div>
              )}
            </Celda>
          </tr>
        );
      })}
    </Grid>
  );
}
