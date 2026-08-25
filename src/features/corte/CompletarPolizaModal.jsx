// ============================================================
// src/features/corte/CompletarPolizaModal.jsx
// Modal reutilizable para completar TODOS los datos de una póliza del
// corte — usado desde /corte y /polizas, ya que ambas páginas leen y
// editan la misma tabla (polizas_cofisem). No importa si la póliza vino
// de GAMAN o se capturó a mano: el criterio de "completado" es el mismo
// para todas — ver evaluarCompletado().
// ============================================================
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Paperclip, Lock, FileSignature } from "lucide-react";
import { supabase } from "../../supabaseClient";
import {
  subirComprobante,
  verComprobante,
  MAX_COMPROBANTE_BYTES,
} from "../../services/comprobantesPago";
import {
  subirDocumento,
  verDocumento,
  MAX_DOCUMENTO_BYTES,
} from "../../services/documentacionPoliza";
import { obtenerPrimaGaman } from "../../services/primaGaman";
import { fetchCoberturasActivas } from "../../services/coberturas";
import { hoyISO } from "../../utils/fecha";

const n = (v) => parseFloat(v) || 0;

const COBERTURA_OPT = ["AMPLIA", "LIMITADA", "BÁSICA", "OBLIGATORIO", "OTRA"];
const FORMA_PAGO_OPT = [
  "CONTADO",
  "4 PARCIALES",
  "TRIMESTRAL",
  "CUATRIMESTRAL",
  "SEMESTRAL",
  "MENSUAL",
];
// En registro parcial también aplica CONTADO: pago único ("1 de 1") de una
// póliza que nunca quedó registrada. El filtro de abajo (por DIVISOR_PAGO)
// ya evita ofrecerlo cuando num_cuota_pago es 2 o más, donde no tendría
// sentido (no existe "cuota 2" de un pago de una sola exhibición).
const FORMA_PAGO_OPT_PARCIAL = FORMA_PAGO_OPT;
// Mismo mapeo que usa el trigger de BD — para no dejar elegir una forma de
// pago cuya cantidad de parcialidades sea menor a la cuota que ya se
// registró (ej. no tiene sentido pasar a SEMESTRAL si esto es la cuota 5).
const DIVISOR_PAGO = {
  CONTADO: 1,
  MENSUAL: 12,
  SEMESTRAL: 2,
  TRIMESTRAL: 4,
  CUATRIMESTRAL: 3,
  "4 PARCIALES": 4,
};
const TIPO_OPT = [
  "AUTO",
  "TAXI",
  "COLECTIVO",
  "APP",
  "PICKUP",
  "CAMION",
  "EQUIPO PESADO",
  "MOTO",
  "CUATRIMOTO",
  "OTRO",
];

// Coberturas "amplia"/"limitada" exigen foto del vehículo además de la
// identificación.
const esAmpliaOLimitada = (cobertura) =>
  /AMPLIA|LIMITADA/i.test(cobertura || "");

const VACIO = {
  // Solo se editan cuando se abre en modo "editar" (soloEditar=true) — ver
  // más abajo. Se cargan siempre para no perder el dato al guardar aunque
  // el modal se haya abierto en modo "completar".
  aseguradora: "",
  numero_poliza: "",
  fecha_emision: "",
  vigencia_inicio: "",
  asegurado_nombre_pila: "",
  asegurado_apellido_paterno: "",
  asegurado_apellido_materno: "",
  tipo: "",
  uso: "",
  servicio: "",
  fecha_corte: "",
  folio: "",
  cobertura: "",
  forma_pago: "",
  vigencia_fin: "",
  placas: "",
  num_serie: "",
  vendedor_nombre: "",
  telefono: "",
  prima_anual: "",
  prima_neta: "",
  prima_primer_pago: "",
  prima_primer_pago_neta: "",
  pol_pend_pago: "",
  efectivo: "",
  cheque: "",
  tdc: "",
  autorizacion: "",
  fotos_path: null,
  factura_path: null,
  t_circ_path: null,
  identif_path: null,
  identif_reverso_path: null,
  pol_ant_path: null,
  otro_path: null,
  fotos_verificado: false,
  fotos_verificado_nota: "",
  observaciones: "",
  comprobante_tdc_path: null,
  comprobante_cheque_path: null,
  endoso_path: null,
  endoso_nota: "",
};

// El vehículo se puede "verificar" sin necesidad de subir la foto (ej. ya
// se verificó en persona, o no fue posible tomarla) — cuenta como
// equivalente a tener fotos_path para efectos de completitud, siempre que
// venga acompañado de una nota explicando cómo/dónde se verificó.
const fotosOk = (f) =>
  !!f.fotos_path ||
  (f.fotos_verificado &&
    !!(f.fotos_verificado_nota && f.fotos_verificado_nota.trim()));

const inpModal =
  "w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] transition-all";
const lblModal =
  "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";

// Reglas de "completado" — compartidas entre este modal y el formulario
// "Nueva póliza" de /polizas, para que ambas vías (GAMAN o captura manual)
// apliquen exactamente el mismo criterio. Una póliza se considera completa
// cuando tiene TODOS los datos que se muestran en la tabla "Pólizas del
// día", salvo los que legítimamente pueden quedar vacíos:
//   - Folio, Cobertura, Vigencia fin, Placas: siempre requeridos.
//   - Prima T. Anual, Prima Neta Anual, Prima T. 1er Pago, Prima N. 1er
//     Pago: siempre > 0.
//   - Al menos una forma de pago (efectivo/cheque/tdc/pól. pend. pago) con
//     monto > 0 — pól. pend. pago SÍ cuenta como forma de pago: significa
//     que la venta quedó registrada con un saldo pendiente en lugar de un
//     cobro inmediato, pero ya es una respuesta completa, no un dato
//     faltante.
//   - Identificación: siempre obligatoria. Además, mínimo uno de
//     {Fotos, Factura, T. Circulación, Póliza anterior} — "Otro" no
//     cuenta para este mínimo, es un extra sin peso. Si la cobertura es
//     Amplia o Limitada, Fotos deja de ser opcional dentro de ese grupo:
//     se vuelve obligatoria aparte, y el mínimo se exige sobre
//     {Factura, T. Circulación, Póliza anterior}.
//   - Autorización solo si se pagó con T. Crédito/Déb.
//   - Comprobante adjunto para cada forma de pago que sí se usó.
//   - Vendedor, Teléfono y Observaciones quedan opcionales a propósito:
//     no toda venta tiene vendedor y no siempre se consigue el teléfono —
//     un vacío ahí es una respuesta válida, no un dato faltante. El vale
//     (comisión del vendedor) ya no se captura aquí — se mueve a la
//     sección Comisiones, porque normalmente se calcula días después de
//     la venta.
// Igual que evaluarCompletado(), pero además regresa CUÁLES requisitos
// faltan — para el botón "Completar": si no está listo, se le dice al
// operador exactamente qué le falta en vez de solo negarse en silencio.
// `registroParcial` (polizas_cofisem.registro_parcial): pólizas creadas
// desde "No tengo la póliza" — solo capturan lo básico (folio, cobertura,
// vendedor, teléfono) porque la venta original nunca quedó registrada;
// no tiene sentido exigirles vigencia, placas, primas anuales ni
// documentación, porque esos datos sencillamente no existen aquí. Pero
// el tipo de pago (cómo se pagó esta cuota) SÍ aplica igual que a
// cualquier otra póliza — se captura aquí mismo, en el mismo formulario.
export function faltantesCompletado(f, { registroParcial = false } = {}) {
  const amplLim = esAmpliaOLimitada(f.cobertura);
  const grupoMinimo = amplLim
    ? [f.factura_path, f.t_circ_path, f.pol_ant_path]
    : [fotosOk(f), f.factura_path, f.t_circ_path, f.pol_ant_path];

  const detalle = {
    folio: !(f.folio && f.folio.trim()),
    cobertura: !(f.cobertura && f.cobertura.trim()),
    vigenciaFin: !registroParcial && !f.vigencia_fin,
    placas: !registroParcial && !(f.placas && f.placas.trim()),
    primas: !registroParcial
      ? !(
          n(f.prima_anual) > 0 &&
          n(f.prima_neta) > 0 &&
          n(f.prima_primer_pago) > 0 &&
          n(f.prima_primer_pago_neta) > 0
        )
      : !(n(f.prima_primer_pago) > 0 && n(f.prima_primer_pago_neta) > 0),
    pago: !(
      n(f.efectivo) > 0 ||
      n(f.cheque) > 0 ||
      n(f.tdc) > 0 ||
      n(f.pol_pend_pago) > 0
    ),
    autorizacion: n(f.tdc) > 0 && !(f.autorizacion && f.autorizacion.trim()),
    comprobanteTdc: n(f.tdc) > 0 && !f.comprobante_tdc_path,
    comprobanteCheque: n(f.cheque) > 0 && !f.comprobante_cheque_path,
    identif: !registroParcial && !f.identif_path,
    fotos: !registroParcial && amplLim && !fotosOk(f),
    fotosVerificadoNota:
      !registroParcial &&
      f.fotos_verificado &&
      !(f.fotos_verificado_nota && f.fotos_verificado_nota.trim()),
    documentoMinimo: !registroParcial && !grupoMinimo.some(Boolean),
  };

  const labels = {
    folio: "Folio",
    cobertura: "Cobertura",
    vigenciaFin: "Vigencia fin",
    placas: "Placas",
    primas: registroParcial
      ? "Prima T. de la cuota y Prima N. de la cuota (ambas mayores a $0)"
      : "Prima T. Anual, Prima Neta Anual, Prima T. 1er Pago y Prima N. 1er Pago (todas mayores a $0)",
    pago: "Tipo de pago — marca al menos uno (Efectivo, Cheque/Dep., T. Crédito/Déb. o Pól. Pend. Pago)",
    autorizacion:
      "Autorización (obligatoria porque se pagó con T. Crédito/Déb.)",
    comprobanteTdc: "Comprobante de la terminal (TDC)",
    comprobanteCheque: "Comprobante de cheque / depósito",
    identif: "Identificación",
    fotos:
      "Fotos del vehículo (obligatorias por cobertura Amplia/Limitada — o marca Verificado con una nota)",
    fotosVerificadoNota:
      "Nota que explique dónde/cómo se verificaron las fotos del vehículo",
    documentoMinimo: amplLim
      ? "Mínimo un documento: Factura, T. Circulación o Póliza anterior"
      : "Mínimo un documento: Fotos, Factura, T. Circulación o Póliza anterior",
  };

  const mensajes = Object.keys(detalle)
    .filter((k) => detalle[k])
    .map((k) => labels[k]);
  return { detalle, mensajes, completo: mensajes.length === 0 };
}

export function evaluarCompletado(f, opts) {
  return faltantesCompletado(f, opts).completo;
}

// Botón de estado — reutilizado en las tablas de /corte y /polizas.
export function CompletarBadge({ completado, onClick }) {
  return completado ? (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
    >
      ✓ Completo
    </button>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition-colors animate-pulse"
    >
      Completar
    </button>
  );
}

// Campo reutilizable: adjunta/reemplaza/ve un comprobante (foto o PDF).
// Exportado — también se usa en el formulario "Nueva póliza" de /polizas.
export function ComprobanteField({
  label,
  path,
  subiendo,
  onFile,
  onVer,
  obligatorio = true,
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <Paperclip className="w-4 h-4 shrink-0 text-gray-400" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-600">{label}</p>
          <p
            className={`text-[11px] ${path ? "text-emerald-600 font-semibold" : obligatorio ? "text-amber-600" : "text-gray-400"}`}
          >
            {subiendo
              ? "Subiendo…"
              : path
                ? "✓ Comprobante adjunto"
                : obligatorio
                  ? "Obligatorio — sube foto o PDF"
                  : "Opcional — sube foto o PDF"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {path && !subiendo && (
          <button
            type="button"
            onClick={onVer}
            className="text-xs font-bold text-[#1447e6] underline underline-offset-2"
          >
            Ver
          </button>
        )}
        <label
          className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
            subiendo
              ? "bg-gray-200 text-gray-400 cursor-wait"
              : path
                ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                : "bg-[#1447e6] text-white hover:bg-[#0f36b3]"
          }`}
        >
          {subiendo ? "..." : path ? "Cambiar" : "Subir"}
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            className="hidden"
            disabled={subiendo}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onFile(f);
            }}
          />
        </label>
      </div>
    </div>
  );
}

// Variante de ComprobanteField solo para "Fotos del vehículo": mismo diseño
// que cualquier otro documento, pero con un switch (foquito) a la izquierda
// del botón "Subir" — al activarlo se reemplaza el botón de subida por una
// nota obligatoria (verificado en persona, o por qué no se pudo tomar la
// foto), sin exigir el archivo. Exportado — también se usa en /polizas.
export function FotosVehiculoField({
  path,
  verificado,
  nota,
  subiendo,
  onFile,
  onVer,
  onToggleVerificado,
  onNotaChange,
  obligatorio = true,
  notaFalta = false,
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Paperclip className="w-4 h-4 shrink-0 text-gray-400" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-600">
              Fotos del vehículo
            </p>
            <p
              className={`text-[11px] ${verificado || path ? "text-emerald-600 font-semibold" : obligatorio ? "text-amber-600" : "text-gray-400"}`}
            >
              {verificado
                ? "✓ Verificado sin foto"
                : subiendo
                  ? "Subiendo…"
                  : path
                    ? "✓ Comprobante adjunto"
                    : obligatorio
                      ? "Obligatorio — sube foto o PDF"
                      : "Opcional — sube foto o PDF"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!verificado && path && !subiendo && (
            <button
              type="button"
              onClick={onVer}
              className="text-xs font-bold text-[#1447e6] underline underline-offset-2"
            >
              Ver
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleVerificado(!verificado)}
            title="Marcar como verificado sin subir foto"
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${verificado ? "bg-[#1447e6]" : "bg-gray-300"}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${verificado ? "translate-x-[18px]" : "translate-x-[3px]"}`}
            />
          </button>
          {!verificado && (
            <label
              className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
                subiendo
                  ? "bg-gray-200 text-gray-400 cursor-wait"
                  : path
                    ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    : "bg-[#1447e6] text-white hover:bg-[#0f36b3]"
              }`}
            >
              {subiendo ? "..." : path ? "Cambiar" : "Subir"}
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="hidden"
                disabled={subiendo}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) onFile(f);
                }}
              />
            </label>
          )}
        </div>
      </div>
      {verificado && (
        <div className="mt-2.5">
          <textarea
            rows={2}
            value={nota}
            onChange={(e) => onNotaChange(e.target.value)}
            placeholder="Explica dónde/cómo verificaste el vehículo, o por qué no se pudo tomar la foto…"
            className={`w-full px-3 py-2 rounded-lg border bg-white text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] resize-none ${notaFalta ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"}`}
          />
        </div>
      )}
    </div>
  );
}

// `row`: registro de polizas_cofisem a completar, o null para no mostrar el modal.
// `onClose()`: se llama al cancelar/cerrar.
// `onSaved(registroActualizado)`: se llama tras guardar con éxito.
// `soloEditar`: abre el modal mostrando TODOS los datos de la póliza
// (aseguradora, no. de póliza, fecha de emisión, vigencia inicio, nombre
// del asegurado por partes, tipo/uso/servicio y el corte destino) en vez
// de solo lo que falta por capturar — para el botón "Editar" de la tabla,
// distinto del botón "Completar" que sigue mostrando solo lo pendiente.
export default function CompletarPolizaModal({
  row,
  usuario,
  onClose,
  onSaved,
  soloEditar = false,
}) {
  const [form, setForm] = useState({ ...VACIO });
  const [modalError, setModalError] = useState(null);
  const [accionGuardando, setAccionGuardando] = useState(null); // 'guardar' | 'completar' | null
  const guardando = accionGuardando !== null;
  const [intentoCompletar, setIntentoCompletar] = useState(false);
  const [subiendoComprobante, setSubiendoComprobante] = useState(null); // 'tdc' | 'cheque' | null
  const [subiendoDocumento, setSubiendoDocumento] = useState(null); // 'fotos' | 'factura' | 't_circ' | 'identif' | 'identif_reverso' | 'pol_ant' | 'otro' | null
  const [gaman, setGaman] = useState(null); // primas reales de GAMAN cuando row.poliza_id existe
  const [gamanLoading, setGamanLoading] = useState(false);
  const [endosoAbierto, setEndosoAbierto] = useState(false);
  const [coberturasGaman, setCoberturasGaman] = useState([]); // nombres reales, cuando esGaman

  // Póliza real de GAMAN (no capturada a mano en COFISEM): las primas se
  // leen de GAMAN y ya no se pueden editar aquí — ver services/primaGaman.js.
  const esGaman = !!row?.poliza_id;
  // Registro creado desde "No tengo la póliza" (ver PoliciasDia.jsx) — solo
  // trae folio/cobertura/vendedor/teléfono, nunca vigencia, vehículo,
  // primas ni documentación, porque esos datos no existen para esta venta.
  const esRegistroParcial = !!row?.registro_parcial;
  // Mientras no se confirme que GAMAN ya tiene el primer pago recibido, no
  // se puede describir "cómo" se pagó — sería inventar un cobro que GAMAN
  // no tiene registrado.
  const pagoBloqueado =
    esGaman && (gamanLoading || !gaman || !gaman.cuota1Pagada);
  // Si la póliza es de GAMAN: catálogo real de coberturas, agregando la que
  // ya traiga el registro por si fuera una cobertura ya desactivada allá.
  const coberturaOpts = esGaman
    ? form.cobertura && !coberturasGaman.includes(form.cobertura)
      ? [form.cobertura, ...coberturasGaman]
      : coberturasGaman
    : COBERTURA_OPT;

  useEffect(() => {
    if (!row?.poliza_id) {
      setGaman(null);
      return;
    }
    let vivo = true;
    setGamanLoading(true);
    obtenerPrimaGaman(row.poliza_id)
      .then((r) => {
        if (vivo) setGaman(r);
      })
      .catch((e) => {
        if (vivo)
          setModalError(
            "No se pudo leer la información de GAMAN: " + e.message,
          );
      })
      .finally(() => {
        if (vivo) setGamanLoading(false);
      });
    return () => {
      vivo = false;
    };
  }, [row?.poliza_id]);

  // Para pólizas de GAMAN, "Cobertura" no es una categoría genérica sino el
  // nombre real del producto — se jala del mismo catálogo que usa la
  // emisión en GAMAN, igual que las primas (ver services/primaGaman.js).
  useEffect(() => {
    if (!esGaman) return;
    let vivo = true;
    fetchCoberturasActivas()
      .then((data) => {
        if (vivo)
          setCoberturasGaman((data ?? []).map((c) => c.nombre).filter(Boolean));
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [esGaman]);

  useEffect(() => {
    if (!row) return;
    setForm({
      aseguradora: row.aseguradora ?? "",
      numero_poliza: row.numero_poliza ?? "",
      fecha_emision: row.fecha_emision ?? "",
      vigencia_inicio: row.vigencia_inicio ?? "",
      asegurado_nombre_pila: row.asegurado_nombre_pila ?? "",
      asegurado_apellido_paterno: row.asegurado_apellido_paterno ?? "",
      asegurado_apellido_materno: row.asegurado_apellido_materno ?? "",
      tipo: row.tipo ?? "",
      uso: row.uso ?? "",
      servicio: row.servicio ?? "",
      fecha_corte: row.fecha_corte ?? "",
      folio: row.folio ?? "",
      cobertura: row.cobertura ?? "",
      forma_pago: row.forma_pago ?? "",
      vigencia_fin: row.vigencia_fin ?? "",
      placas: row.placas ?? "",
      num_serie: row.num_serie ?? "",
      vendedor_nombre: row.vendedor_nombre ?? "",
      telefono: row.telefono ?? "",
      prima_anual: row.prima_anual || "",
      prima_neta: row.prima_neta || "",
      prima_primer_pago: row.prima_primer_pago || "",
      prima_primer_pago_neta: row.prima_primer_pago_neta || "",
      pol_pend_pago: row.pol_pend_pago || "",
      efectivo: row.efectivo || "",
      cheque: row.cheque || "",
      tdc: row.tdc || "",
      autorizacion: row.autorizacion ?? "",
      fotos_path: row.fotos_url ?? null,
      factura_path: row.factura_url ?? null,
      t_circ_path: row.t_circ_url ?? null,
      identif_path: row.identif_url ?? null,
      identif_reverso_path: row.identif_reverso_url ?? null,
      pol_ant_path: row.pol_ant_url ?? null,
      otro_path: row.otro_url ?? null,
      fotos_verificado: row.fotos_verificado ?? false,
      fotos_verificado_nota: row.fotos_verificado_nota ?? "",
      observaciones: row.observaciones ?? "",
      comprobante_tdc_path: row.comprobante_tdc_url ?? null,
      comprobante_cheque_path: row.comprobante_cheque_url ?? null,
      endoso_path: row.endoso_url ?? null,
      endoso_nota: row.endoso_nota ?? "",
    });
    setModalError(null);
    setIntentoCompletar(false);
    setEndosoAbierto(!!row.endoso_url || !!row.endoso_nota);
  }, [row]);

  if (!row) return null;

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Igual que en guardar(): para pólizas de GAMAN las primas y (si aplica)
  // el bloqueo de "cómo se pagó" vienen de GAMAN, no de los inputs. Se usa
  // tanto al guardar como para saber en vivo qué le falta (chequeo abajo).
  function construirDatos() {
    return {
      ...form,
      ...(esGaman && gaman
        ? {
            prima_anual: gaman.primaAnual,
            prima_neta: gaman.primaNetaAnual,
            prima_primer_pago: gaman.primaPrimerPago,
            prima_primer_pago_neta: gaman.primaPrimerPagoNeta,
          }
        : {}),
      ...(pagoBloqueado
        ? { efectivo: 0, cheque: 0, tdc: 0, pol_pend_pago: 0 }
        : {}),
    };
  }

  const chequeo = faltantesCompletado(construirDatos(), {
    registroParcial: esRegistroParcial,
  });
  // Los avisos rojos solo se activan después de intentar "Completar" — no
  // deben estorbar mientras el operador todavía está llenando el formulario.
  const falta = (k) => intentoCompletar && chequeo.detalle[k];
  const astCls = (k) => (falta(k) ? "text-red-500" : "text-gray-300");
  const campoCls = (k) =>
    `${inpModal}${falta(k) ? " border-red-300 ring-2 ring-red-100" : ""}`;
  const hoyIso = hoyISO();

  async function handleComprobanteChange(tipo, file) {
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setModalError("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setModalError(null);
    setSubiendoComprobante(tipo);
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/${hoyIso}/${row.id}/${tipo}`;
      const path = await subirComprobante(basePath, file);
      setF(`comprobante_${tipo}_path`, path);
    } catch (e) {
      setModalError("No se pudo subir el comprobante: " + e.message);
    } finally {
      setSubiendoComprobante(null);
    }
  }

  async function handleDocumentoChange(tipo, file) {
    if (file.size > MAX_DOCUMENTO_BYTES) {
      setModalError("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setModalError(null);
    setSubiendoDocumento(tipo);
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/${hoyIso}/${row.id}/${tipo}`;
      const path = await subirDocumento(basePath, file);
      setF(`${tipo}_path`, path);
    } catch (e) {
      setModalError("No se pudo subir el documento: " + e.message);
    } finally {
      setSubiendoDocumento(null);
    }
  }

  async function handleEndosoChange(file) {
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setModalError("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setModalError(null);
    setSubiendoComprobante("endoso");
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/${hoyIso}/${row.id}/endoso`;
      const path = await subirComprobante(basePath, file);
      setF("endoso_path", path);
    } catch (e) {
      setModalError("No se pudo subir el endoso: " + e.message);
    } finally {
      setSubiendoComprobante(null);
    }
  }

  async function handleVerDocumento(path) {
    try {
      await verDocumento(path);
    } catch (e) {
      setModalError("No se pudo abrir el documento: " + e.message);
    }
  }

  async function handleVer(path) {
    try {
      await verComprobante(path);
    } catch (e) {
      setModalError("No se pudo abrir el comprobante: " + e.message);
    }
  }

  // completar=false ("Guardar"): guarda lo que haya, sin exigir nada — así
  // el operador puede ir armando la póliza poco a poco y admin/analista ya
  // ven el avance en BD, aunque falten datos.
  // completar=true ("Completar"): si falta algo, NO guarda nada — solo
  // avisa (SweetAlert + resaltado rojo en los campos) qué falta. Si ya
  // está todo, guarda y marca completado=true.
  async function guardar(e, completar) {
    e.preventDefault();
    if (guardando) return;
    setModalError(null);
    if (esGaman && gamanLoading) {
      setModalError("Espera a que termine de cargar la información de GAMAN.");
      return;
    }
    const datos = construirDatos();
    const chk = faltantesCompletado(datos, {
      registroParcial: esRegistroParcial,
    });
    if (completar && !chk.completo) {
      setIntentoCompletar(true);
      await Swal.fire({
        icon: "warning",
        title: "Todavía no se puede completar",
        html: `<p style="text-align:left; margin:0 0 8px;">Falta lo siguiente:</p><ul style="text-align:left; margin:0; padding-left:1.2em;">${chk.mensajes.map((m) => `<li>${m}</li>`).join("")}</ul>`,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#1447e6",
      });
      return;
    }
    setAccionGuardando(completar ? "completar" : "guardar");
    try {
      // Si las 3 partes vienen vacías (fila vieja capturada antes de que
      // existieran estos campos separados) se conserva el nombre que ya
      // tenía en vez de borrarlo.
      const nombrePartes = [
        datos.asegurado_nombre_pila,
        datos.asegurado_apellido_paterno,
        datos.asegurado_apellido_materno,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      const payload = {
        aseguradora: datos.aseguradora || row.aseguradora,
        numero_poliza: datos.numero_poliza || row.numero_poliza,
        fecha_emision: datos.fecha_emision || null,
        vigencia_inicio: datos.vigencia_inicio || null,
        asegurado_nombre: nombrePartes || row.asegurado_nombre || null,
        asegurado_nombre_pila: datos.asegurado_nombre_pila || null,
        asegurado_apellido_paterno: datos.asegurado_apellido_paterno || null,
        asegurado_apellido_materno: datos.asegurado_apellido_materno || null,
        tipo: datos.tipo || null,
        uso: datos.uso || null,
        servicio: datos.servicio || null,
        fecha_corte: datos.fecha_corte || row.fecha_corte,
        folio: datos.folio || null,
        cobertura: datos.cobertura || null,
        forma_pago: datos.forma_pago || null,
        vigencia_fin: datos.vigencia_fin || null,
        placas: datos.placas || null,
        num_serie: datos.num_serie ? datos.num_serie.toUpperCase() : null,
        vendedor_nombre: datos.vendedor_nombre || null,
        telefono: datos.telefono || null,
        prima_anual: n(datos.prima_anual),
        prima_neta: n(datos.prima_neta),
        prima_primer_pago: n(datos.prima_primer_pago),
        prima_primer_pago_neta: n(datos.prima_primer_pago_neta),
        pol_pend_pago: n(datos.pol_pend_pago),
        efectivo: n(datos.efectivo),
        cheque: n(datos.cheque),
        tdc: n(datos.tdc),
        autorizacion: datos.autorizacion || null,
        fotos_url: datos.fotos_path,
        factura_url: datos.factura_path,
        t_circ_url: datos.t_circ_path,
        identif_url: datos.identif_path,
        identif_reverso_url: datos.identif_reverso_path,
        pol_ant_url: datos.pol_ant_path,
        otro_url: datos.otro_path,
        fotos_verificado: datos.fotos_verificado,
        fotos_verificado_nota: datos.fotos_verificado
          ? datos.fotos_verificado_nota || null
          : null,
        observaciones: datos.observaciones || null,
        comprobante_tdc_url: datos.comprobante_tdc_path,
        comprobante_cheque_url: datos.comprobante_cheque_path,
        endoso_url: datos.endoso_path,
        endoso_nota: datos.endoso_nota || null,
        completado: chk.completo,
      };
      const { data, error } = await supabase
        .from("polizas_cofisem")
        .update(payload)
        .eq("id", row.id)
        .select()
        .single();
      if (error) throw error;
      onSaved(data);
    } catch (e) {
      setModalError(e.message);
    } finally {
      setAccionGuardando(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <p className="text-sm font-bold text-[#1447e6] flex items-center gap-1.5">
              {soloEditar ? "Editar póliza" : "Completar registro"}
              {esGaman && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  <Lock className="w-2.5 h-2.5" /> Vinculada a GAMAN
                </span>
              )}
              {row.registro_parcial && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Registro parcial — pago sin póliza completa
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Póliza{" "}
              <strong className="font-mono">{row.numero_poliza || "—"}</strong>{" "}
              · {row.asegurado_nombre || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => guardar(e, false)} className="p-6 space-y-5">
          {modalError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-red-700 flex items-center justify-between">
              {modalError}
              <button
                type="button"
                onClick={() => setModalError(null)}
                className="text-red-400 hover:text-red-600 ml-3"
              >
                ✕
              </button>
            </div>
          )}

          {soloEditar && (
            <div>
              <label className={lblModal}>
                ¿A qué corte se registra esta póliza?
              </label>
              <input
                type="date"
                value={form.fecha_corte}
                max={hoyISO()}
                onChange={(e) => setF("fecha_corte", e.target.value)}
                className={inpModal + " sm:w-56"}
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                Cambiar esta fecha mueve la póliza al corte de ese día. No se
                puede mover a un corte ya cerrado.
              </p>
            </div>
          )}

          {soloEditar && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Identidad de la póliza
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={lblModal}>Aseguradora</label>
                  {esGaman ? (
                    <div
                      className={`${inpModal} bg-gray-50 text-gray-500 font-semibold cursor-not-allowed`}
                    >
                      {form.aseguradora || "—"}
                    </div>
                  ) : (
                    <input
                      value={form.aseguradora}
                      onChange={(e) =>
                        setF("aseguradora", e.target.value.toUpperCase())
                      }
                      className={inpModal}
                    />
                  )}
                </div>
                <div>
                  <label className={lblModal}>No. de póliza</label>
                  {esGaman ? (
                    <div
                      className={`${inpModal} bg-gray-50 text-gray-500 font-semibold cursor-not-allowed font-mono`}
                    >
                      {form.numero_poliza || "—"}
                    </div>
                  ) : (
                    <input
                      value={form.numero_poliza}
                      onChange={(e) => setF("numero_poliza", e.target.value)}
                      className={inpModal + " font-mono"}
                    />
                  )}
                </div>
                {!esRegistroParcial && (
                  <div>
                    <label className={lblModal}>Fecha de emisión</label>
                    <input
                      type="date"
                      value={form.fecha_emision}
                      onChange={(e) => setF("fecha_emision", e.target.value)}
                      className={inpModal}
                    />
                  </div>
                )}
                {!esRegistroParcial && (
                  <div>
                    <label className={lblModal}>Vigencia inicio</label>
                    <input
                      type="date"
                      value={form.vigencia_inicio}
                      onChange={(e) => setF("vigencia_inicio", e.target.value)}
                      className={inpModal}
                    />
                  </div>
                )}
                <div>
                  <label className={lblModal}>Nombre(s) de NA</label>
                  <input
                    value={form.asegurado_nombre_pila}
                    onChange={(e) =>
                      setF(
                        "asegurado_nombre_pila",
                        e.target.value.toUpperCase(),
                      )
                    }
                    className={inpModal}
                  />
                </div>
                <div>
                  <label className={lblModal}>Apellido paterno</label>
                  <input
                    value={form.asegurado_apellido_paterno}
                    onChange={(e) =>
                      setF(
                        "asegurado_apellido_paterno",
                        e.target.value.toUpperCase(),
                      )
                    }
                    className={inpModal}
                  />
                </div>
                <div>
                  <label className={lblModal}>Apellido materno</label>
                  <input
                    value={form.asegurado_apellido_materno}
                    onChange={(e) =>
                      setF(
                        "asegurado_apellido_materno",
                        e.target.value.toUpperCase(),
                      )
                    }
                    className={inpModal}
                  />
                </div>
                {!esRegistroParcial && (
                  <div>
                    <label className={lblModal}>Tipo</label>
                    <select
                      value={form.tipo}
                      onChange={(e) => setF("tipo", e.target.value)}
                      className={inpModal}
                    >
                      <option value="">Selecciona...</option>
                      {TIPO_OPT.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                )}
                {!esRegistroParcial && (
                  <div>
                    <label className={lblModal}>Uso</label>
                    <input
                      value={form.uso}
                      onChange={(e) =>
                        setF("uso", e.target.value.toUpperCase())
                      }
                      className={inpModal}
                    />
                  </div>
                )}
                {!esRegistroParcial && (
                  <div>
                    <label className={lblModal}>Servicio</label>
                    <input
                      value={form.servicio}
                      onChange={(e) =>
                        setF("servicio", e.target.value.toUpperCase())
                      }
                      className={inpModal}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Datos de la póliza
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={lblModal}>
                  Folio <span className={astCls("folio")}>*</span>
                </label>
                <input
                  value={form.folio}
                  onChange={(e) => setF("folio", e.target.value.toUpperCase())}
                  placeholder="Ej. T0455"
                  className={campoCls("folio")}
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <label className={lblModal}>
                  Cobertura <span className={astCls("cobertura")}>*</span>
                </label>
                <select
                  value={form.cobertura}
                  onChange={(e) => setF("cobertura", e.target.value)}
                  className={campoCls("cobertura")}
                >
                  <option value="">Selecciona...</option>
                  {coberturaOpts.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              {!esGaman && (
                <div>
                  <label className={lblModal}>Forma de pago</label>
                  <select
                    value={form.forma_pago}
                    onChange={(e) => setF("forma_pago", e.target.value)}
                    className={inpModal}
                  >
                    {(esRegistroParcial
                      ? FORMA_PAGO_OPT_PARCIAL
                      : FORMA_PAGO_OPT
                    )
                      .filter(
                        (f) =>
                          !esRegistroParcial ||
                          (DIVISOR_PAGO[f] ?? 1) >= (row.num_cuota_pago ?? 2),
                      )
                      .map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                  </select>
                  {esRegistroParcial && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Cambia las parcialidades restantes de esta cuota{" "}
                      {row.num_cuota_pago} en adelante.
                    </p>
                  )}
                </div>
              )}
              {!esRegistroParcial && (
                <div>
                  <label className={lblModal}>
                    Vigencia fin{" "}
                    <span className={astCls("vigenciaFin")}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.vigencia_fin}
                    onChange={(e) => setF("vigencia_fin", e.target.value)}
                    className={campoCls("vigenciaFin")}
                  />
                </div>
              )}
              {!esRegistroParcial && (
                <div>
                  <label className={lblModal}>
                    Placas <span className={astCls("placas")}>*</span>
                  </label>
                  <input
                    value={form.placas}
                    onChange={(e) =>
                      setF("placas", e.target.value.toUpperCase())
                    }
                    placeholder="Ej. ABC-123 o TRÁMITE"
                    className={campoCls("placas")}
                  />
                </div>
              )}
              {!esRegistroParcial && (
                <div>
                  <label className={lblModal}>Número de serie</label>
                  <input
                    value={form.num_serie}
                    onChange={(e) =>
                      setF("num_serie", e.target.value.toUpperCase())
                    }
                    placeholder="Opcional — VIN del vehículo"
                    className={inpModal}
                  />
                </div>
              )}
              <div className="col-span-2 sm:col-span-3">
                <label className={lblModal}>Vendedor</label>
                <input
                  value={form.vendedor_nombre}
                  onChange={(e) =>
                    setF("vendedor_nombre", e.target.value.toUpperCase())
                  }
                  placeholder="Opcional — nombre del vendedor"
                  className={inpModal}
                />
              </div>
              <div>
                <label className={lblModal}>Teléfono</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setF("telefono", e.target.value)}
                  placeholder="Opcional"
                  className={inpModal}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              Montos y cobro
              {esGaman && (
                <span className="inline-flex items-center gap-1 normal-case tracking-normal font-semibold text-gray-400">
                  <Lock className="w-3 h-3" />{" "}
                  {gamanLoading
                    ? "leyendo de GAMAN…"
                    : "primas desde GAMAN, solo lectura"}
                </span>
              )}
              {esRegistroParcial && (
                <span className="normal-case tracking-normal font-semibold text-gray-400">
                  solo la cuota {row.num_cuota_pago} — no hay prima anual porque
                  la póliza no está registrada
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(esRegistroParcial
                ? [
                    {
                      k: "prima_primer_pago",
                      label: "Prima T. de la cuota",
                      gamanVal: undefined,
                    },
                    {
                      k: "prima_primer_pago_neta",
                      label: "Prima N. de la cuota",
                      gamanVal: undefined,
                    },
                  ]
                : [
                    {
                      k: "prima_anual",
                      label: "Prima T. Anual",
                      gamanVal: gaman?.primaAnual,
                    },
                    {
                      k: "prima_neta",
                      label: "Prima Neta Anual",
                      gamanVal: gaman?.primaNetaAnual,
                    },
                    {
                      k: "prima_primer_pago",
                      label: "Prima T. 1er Pago",
                      gamanVal: gaman?.primaPrimerPago,
                    },
                    {
                      k: "prima_primer_pago_neta",
                      label: "Prima N. 1er Pago",
                      gamanVal: gaman?.primaPrimerPagoNeta,
                    },
                  ]
              ).map((f) => (
                <div key={f.k}>
                  <label className={lblModal}>
                    {f.label} <span className={astCls("primas")}>*</span>
                  </label>
                  {esGaman ? (
                    <div
                      className={`${campoCls("primas")} bg-gray-50 text-gray-500 font-semibold cursor-not-allowed`}
                    >
                      {gamanLoading
                        ? "…"
                        : `$${n(f.gamanVal).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[f.k]}
                      onChange={(e) => setF(f.k, e.target.value)}
                      placeholder="0.00"
                      className={campoCls("primas")}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Tipo de pago
              {falta("pago") && (
                <span className="text-red-500 normal-case tracking-normal ml-1">
                  — marca al menos uno
                </span>
              )}
            </p>
            {esGaman && pagoBloqueado && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-700">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                {gamanLoading
                  ? "Verificando con GAMAN…"
                  : "GAMAN aún no registra el cobro del primer pago — no se puede indicar cómo se pagó hasta que se reciba allá."}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={lblModal}>Efectivo</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={pagoBloqueado}
                  value={pagoBloqueado ? 0 : form.efectivo}
                  onChange={(e) => setF("efectivo", e.target.value)}
                  placeholder="0.00"
                  className={`${campoCls("pago")} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                />
              </div>
              <div>
                <label className={lblModal}>Transf / Dep.</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={pagoBloqueado}
                  value={pagoBloqueado ? 0 : form.cheque}
                  onChange={(e) => setF("cheque", e.target.value)}
                  placeholder="0.00"
                  className={`${campoCls("pago")} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                />
              </div>
              <div>
                <label className={lblModal}>T. Crédito/Déb.</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={pagoBloqueado}
                  value={pagoBloqueado ? 0 : form.tdc}
                  onChange={(e) => setF("tdc", e.target.value)}
                  placeholder="0.00"
                  className={`${campoCls("pago")} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                />
              </div>
              <div>
                <label className={lblModal}>Pól. Pend. Pago</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={pagoBloqueado}
                  value={pagoBloqueado ? 0 : form.pol_pend_pago}
                  onChange={(e) => setF("pol_pend_pago", e.target.value)}
                  placeholder="0.00"
                  className={`${campoCls("pago")} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                />
              </div>
            </div>
            {!pagoBloqueado && n(form.tdc) > 0 && (
              <div className="mt-4">
                <label className={lblModal}>
                  Autorización <span className={astCls("autorizacion")}>*</span>
                </label>
                <input
                  value={form.autorizacion}
                  onChange={(e) =>
                    setF("autorizacion", e.target.value.toUpperCase())
                  }
                  placeholder="Código de autorización"
                  className={campoCls("autorizacion") + " sm:max-w-xs"}
                />
              </div>
            )}
            {!pagoBloqueado && (n(form.cheque) > 0 || n(form.tdc) > 0) && (
              <div className="mt-3 space-y-2">
                {n(form.cheque) > 0 && (
                  <ComprobanteField
                    label="Comprobante de cheque / depósito / transferencia"
                    path={form.comprobante_cheque_path}
                    subiendo={subiendoComprobante === "cheque"}
                    onFile={(f) => handleComprobanteChange("cheque", f)}
                    onVer={() => handleVer(form.comprobante_cheque_path)}
                  />
                )}
                {n(form.tdc) > 0 && (
                  <ComprobanteField
                    label="Comprobante de la terminal (ticket TDC)"
                    path={form.comprobante_tdc_path}
                    subiendo={subiendoComprobante === "tdc"}
                    onFile={(f) => handleComprobanteChange("tdc", f)}
                    onVer={() => handleVer(form.comprobante_tdc_path)}
                  />
                )}
              </div>
            )}
          </div>

          <div>
            {!endosoAbierto ? (
              <button
                type="button"
                onClick={() => setEndosoAbierto(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1447e6] hover:text-[#0f36b3]"
              >
                <FileSignature className="w-3.5 h-3.5" />
                Adjuntar endoso
              </button>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    <FileSignature className="w-3.5 h-3.5" />
                    Endoso
                  </p>
                  {!form.endoso_path && !form.endoso_nota && (
                    <button
                      type="button"
                      onClick={() => setEndosoAbierto(false)}
                      className="text-[11px] font-semibold text-gray-400 hover:text-gray-600"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
                <ComprobanteField
                  label="Archivo del endoso"
                  path={form.endoso_path}
                  subiendo={subiendoComprobante === "endoso"}
                  onFile={handleEndosoChange}
                  onVer={() => handleVer(form.endoso_path)}
                  obligatorio={false}
                />
                <div>
                  <label className={lblModal}>Nota (opcional)</label>
                  <textarea
                    value={form.endoso_nota}
                    onChange={(e) => setF("endoso_nota", e.target.value)}
                    placeholder="Detalle del endoso…"
                    className={inpModal + " h-16 resize-none"}
                  />
                </div>
              </div>
            )}
          </div>

          {!esRegistroParcial && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Documentación recibida
              </p>
              <p className="text-[11px] text-gray-400 mb-3">
                Identificación siempre obligatoria.{" "}
                {esAmpliaOLimitada(form.cobertura)
                  ? "Cobertura amplia/limitada: fotos también obligatorias (o marca Verificado con una nota), y mínimo una de Factura, T. Circulación o Póliza anterior."
                  : "Mínimo una de Fotos, Factura, T. Circulación o Póliza anterior."}
              </p>
              <div className="space-y-2">
                <ComprobanteField
                  label="Identificación (frente)"
                  path={form.identif_path}
                  subiendo={subiendoDocumento === "identif"}
                  onFile={(f) => handleDocumentoChange("identif", f)}
                  onVer={() => handleVerDocumento(form.identif_path)}
                />
                <ComprobanteField
                  label="Identificación (reverso)"
                  path={form.identif_reverso_path}
                  subiendo={subiendoDocumento === "identif_reverso"}
                  onFile={(f) => handleDocumentoChange("identif_reverso", f)}
                  onVer={() => handleVerDocumento(form.identif_reverso_path)}
                  obligatorio={false}
                />
                <FotosVehiculoField
                  path={form.fotos_path}
                  verificado={form.fotos_verificado}
                  nota={form.fotos_verificado_nota}
                  subiendo={subiendoDocumento === "fotos"}
                  onFile={(f) => handleDocumentoChange("fotos", f)}
                  onVer={() => handleVerDocumento(form.fotos_path)}
                  onToggleVerificado={(v) => setF("fotos_verificado", v)}
                  onNotaChange={(v) => setF("fotos_verificado_nota", v)}
                  obligatorio={esAmpliaOLimitada(form.cobertura)}
                  notaFalta={falta("fotosVerificadoNota")}
                />
                <ComprobanteField
                  label="Factura"
                  path={form.factura_path}
                  subiendo={subiendoDocumento === "factura"}
                  onFile={(f) => handleDocumentoChange("factura", f)}
                  onVer={() => handleVerDocumento(form.factura_path)}
                  obligatorio={false}
                />
                <ComprobanteField
                  label="Tarjeta de circulación"
                  path={form.t_circ_path}
                  subiendo={subiendoDocumento === "t_circ"}
                  onFile={(f) => handleDocumentoChange("t_circ", f)}
                  onVer={() => handleVerDocumento(form.t_circ_path)}
                  obligatorio={false}
                />
                <ComprobanteField
                  label="Póliza anterior"
                  path={form.pol_ant_path}
                  subiendo={subiendoDocumento === "pol_ant"}
                  onFile={(f) => handleDocumentoChange("pol_ant", f)}
                  onVer={() => handleVerDocumento(form.pol_ant_path)}
                  obligatorio={false}
                />
                <ComprobanteField
                  label="Otro"
                  path={form.otro_path}
                  subiendo={subiendoDocumento === "otro"}
                  onFile={(f) => handleDocumentoChange("otro", f)}
                  onVer={() => handleVerDocumento(form.otro_path)}
                  obligatorio={false}
                />
              </div>
            </div>
          )}

          <div>
            <label className={lblModal}>Observaciones</label>
            <textarea
              rows={3}
              value={form.observaciones}
              onChange={(e) => setF("observaciones", e.target.value)}
              placeholder="Notas adicionales, irregularidades, comentarios…"
              className={inpModal + " resize-none"}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              title="Guarda lo que ya llenaste, aunque falten datos"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#1447e6]/30 text-[#1447e6] hover:bg-[#1447e6]/5 text-sm font-bold disabled:opacity-50 transition-all"
            >
              {accionGuardando === "guardar" ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>Guardar</>
              )}
            </button>
            <button
              type="button"
              onClick={(e) => guardar(e, true)}
              disabled={guardando}
              title="Valida que ya esté todo y lo marca como completo"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1447e6] hover:bg-[#0f36b3] text-white text-sm font-bold disabled:opacity-50 transition-all"
            >
              {accionGuardando === "completar" ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Completando...
                </>
              ) : (
                <>Completar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
