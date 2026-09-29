// ============================================================
// src/components/siniestros/DescargaDocumentosSiniestro.jsx
// Botones para volver a descargar los PDFs de un siniestro cerrado
// (Declaración, Pase Taller, Pase Médico). Cada botón abre un panel
// flotante que dice DE QUIÉN es cada archivo — agrupado por vehículo,
// porque puede haber varios pases médicos por vehículo y varios
// terceros — y el PDF se genera al picar el renglón.
//
// Usado por cabinero (ModalDetalle), supervisor (ModalDesglose) y
// ajustador (tarjetas cerradas de ListaSiniestros).
// ============================================================
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { pdf } from "@react-pdf/renderer";
import { FileText, Wrench, Stethoscope, Download, Loader2, ChevronDown, X, Check } from "lucide-react";
import { fetchDocumentosSiniestro } from "../../services/documentosSiniestro";
import DeclaracionAccidentePDF from "../pdf/DeclaracionAccidentePDF";
import { fetchDeclaracionData, buildDeclaracionPDF } from "../../services/declaracionPdf";
import PaseTallerPDF from "../pdf/PaseTallerPDF";
import { fetchPaseTallerData, buildPaseTallerPDF } from "../../services/pasePdf";
import PaseMedicoPDF from "../pdf/PaseMedicoPDF";
import { fetchPaseMedicoData, buildPaseMedicoPDF } from "../../services/paseMedicoPdf";

const TIPOS = [
  { k: "declaracion",  lista: "declaracion",  label: "Declaración", titulo: "Declaración del siniestro", Icon: FileText,    vacio: "Sin declaración" },
  { k: "taller",       lista: "pasesTaller",  label: "Pase Taller", titulo: "Pases a taller",            Icon: Wrench,      vacio: "No se generó pase a taller" },
  { k: "medico",       lista: "pasesMedicos", label: "Pase Médico", titulo: "Pases médicos",             Icon: Stethoscope, vacio: "No se generaron pases médicos" },
];

// ── Generación + descarga de un PDF ──────────────────────────
async function generarBlob(item) {
  if (item.tipo === "declaracion") {
    const data = buildDeclaracionPDF(await fetchDeclaracionData(item.refId));
    return pdf(<DeclaracionAccidentePDF data={data} />).toBlob();
  }
  if (item.tipo === "taller") {
    const data = buildPaseTallerPDF(await fetchPaseTallerData(item.refId));
    return pdf(<PaseTallerPDF data={data} />).toBlob();
  }
  const data = buildPaseMedicoPDF(await fetchPaseMedicoData(item.refId));
  return pdf(<PaseMedicoPDF data={data} />).toBlob();
}

function descargarBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (str) => String(str ?? "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();

function nombreArchivo(item, numeroSiniestro) {
  const base = { declaracion: "declaracion", taller: "pase-taller", medico: "pase-medico" }[item.tipo];
  const quien = item.tipo === "declaracion" ? null : slug(item.nombre);
  return [base, numeroSiniestro, quien].filter(Boolean).join("-") + ".pdf";
}

const iniciales = (nombre) => String(nombre ?? "")
  .split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

// Agrupa conservando el orden de aparición (asegurado primero, luego
// Tercero 1, 2...). Items sin grupo (Declaración) van en uno anónimo.
function agrupar(items) {
  const grupos = [];
  const idx = {};
  for (const it of items) {
    const gid = it.grupo?.id ?? "_";
    if (!(gid in idx)) { idx[gid] = grupos.length; grupos.push({ ...(it.grupo ?? { id: "_" }), items: [] }); }
    grupos[idx[gid]].items.push(it);
  }
  return grupos;
}

// ── Panel flotante ───────────────────────────────────────────
// Se monta en <body> (portal) para no quedar recortado por el
// overflow de las tablas/modales. En pantallas chicas sale como hoja
// inferior; en escritorio, anclado al botón (abajo, o arriba si no
// cabe).
const PANEL_W = 340;

function PanelFlotante({ anchorRef, tipo, items, numeroSiniestro, onClose }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState(null);
  const [estado, setEstado] = useState({}); // key → "cargando" | "ok" | mensaje de error
  const [todos, setTodos] = useState(false);
  const movil = typeof window !== "undefined" && window.innerWidth < 640;

  useLayoutEffect(() => {
    if (movil) return;
    const calcular = () => {
      const a = anchorRef.current?.getBoundingClientRect();
      if (!a) return;
      const alto = panelRef.current?.offsetHeight ?? 280;
      const margen = 8;
      const left = Math.min(Math.max(margen, a.left), window.innerWidth - PANEL_W - margen);
      const abajo = a.bottom + margen + alto <= window.innerHeight - margen || a.top < alto + margen;
      setPos({ left, top: abajo ? a.bottom + 6 : a.top - alto - 6 });
    };
    calcular();
    window.addEventListener("resize", calcular);
    window.addEventListener("scroll", calcular, true);
    return () => {
      window.removeEventListener("resize", calcular);
      window.removeEventListener("scroll", calcular, true);
    };
  }, [anchorRef, movil, items.length]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [anchorRef, onClose]);

  const descargar = async (item) => {
    setEstado((s) => ({ ...s, [item.key]: "cargando" }));
    try {
      descargarBlob(await generarBlob(item), nombreArchivo(item, numeroSiniestro));
      setEstado((s) => ({ ...s, [item.key]: "ok" }));
    } catch (err) {
      setEstado((s) => ({ ...s, [item.key]: err?.message || "No se pudo generar el PDF" }));
    }
  };

  const descargarTodos = async () => {
    setTodos(true);
    for (const it of items) await descargar(it);
    setTodos(false);
  };

  const grupos = agrupar(items);
  const { Icon } = tipo;

  const contenido = (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={tipo.titulo}
      onClick={(e) => e.stopPropagation()}
      className={
        movil
          ? "fixed inset-x-0 bottom-0 z-[80] bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 flex flex-col max-h-[75vh]"
          : "fixed z-[80] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[60vh]"
      }
      style={movil ? undefined : { width: PANEL_W, left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
    >
      {movil && <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-2" />}

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2.5 border-b border-gray-100 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[#13193a]/8 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#13193a]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#13193a]">{tipo.titulo}</p>
          <p className="text-[10px] text-gray-400">
            {items.length === 1 ? "1 archivo" : `${items.length} archivos`} · elige cuál descargar
          </p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0" aria-label="Cerrar">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lista agrupada por vehículo */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {grupos.map((g) => (
          <div key={g.id} className="px-2 py-1">
            {g.id !== "_" && (
              <div className="px-2 pt-1 pb-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{g.etiqueta}</p>
                {g.vehiculo && <p className="text-[10px] text-gray-400 truncate">{g.vehiculo}</p>}
              </div>
            )}
            {g.items.map((it) => {
              const st = estado[it.key];
              const cargando = st === "cargando";
              const ok = st === "ok";
              const error = st && !cargando && !ok ? st : null;
              return (
                <div key={it.key}>
                  <button
                    onClick={() => descargar(it)}
                    disabled={cargando || todos}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left hover:bg-gray-50 disabled:cursor-wait transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#13193a] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {iniciales(it.nombre)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-800 truncate">{it.nombre}</span>
                        {it.folio && (
                          <span className="font-mono text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                            {it.folio}
                          </span>
                        )}
                      </span>
                      {it.detalle && <span className="block text-[10px] text-gray-400 truncate">{it.detalle}</span>}
                    </span>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      ok ? "bg-emerald-50 text-emerald-600" : "text-gray-300 group-hover:text-[#13193a] group-hover:bg-white"
                    }`}>
                      {cargando ? <Loader2 className="w-4 h-4 animate-spin text-[#13193a]" />
                        : ok ? <Check className="w-4 h-4" />
                        : <Download className="w-4 h-4" />}
                    </span>
                  </button>
                  {error && <p className="text-[10px] text-red-500 px-2 pb-1.5 -mt-0.5 ml-11">{error}</p>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="px-3 py-2.5 border-t border-gray-100 shrink-0">
          <button
            onClick={descargarTodos}
            disabled={todos}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-[#13193a] text-[#13193a] text-xs font-bold hover:bg-[#13193a]/5 disabled:opacity-60 disabled:cursor-wait transition-all"
          >
            {todos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {todos ? "Generando descargas..." : `Descargar los ${items.length}`}
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(
    <>
      {movil && <div className="fixed inset-0 z-[79] bg-black/30" onClick={(e) => { e.stopPropagation(); onClose(); }} />}
      {contenido}
    </>,
    document.body,
  );
}

// ── Botón de un tipo de documento ────────────────────────────
function BotonTipo({ tipo, items, cargando, abierto, onToggle, onClose, numeroSiniestro, compacto }) {
  const ref = useRef(null);
  const n = items?.length ?? 0;
  const deshabilitado = cargando || n === 0;
  const { Icon } = tipo;

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={(e) => { e.stopPropagation(); if (!deshabilitado) onToggle(); }}
        disabled={deshabilitado}
        title={!cargando && n === 0 ? tipo.vacio : tipo.titulo}
        aria-expanded={abierto}
        className={[
          "flex items-center gap-1.5 rounded-xl border font-bold transition-all whitespace-nowrap",
          compacto ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs",
          abierto
            ? "bg-[#13193a] text-white border-[#13193a]"
            : deshabilitado
              ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
              : "bg-white text-[#13193a] border-gray-200 hover:border-[#13193a]/40 hover:bg-[#13193a]/5",
        ].join(" ")}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {tipo.label}
        {cargando ? (
          <Loader2 className="w-3 h-3 animate-spin opacity-60" />
        ) : n > 1 ? (
          <span className={`text-[10px] px-1.5 rounded-full ${abierto ? "bg-white/20" : "bg-[#13193a]/10"}`}>{n}</span>
        ) : null}
        {n > 0 && <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`} />}
      </button>
      {abierto && n > 0 && (
        <PanelFlotante
          anchorRef={ref}
          tipo={tipo}
          items={items}
          numeroSiniestro={numeroSiniestro}
          onClose={onClose}
        />
      )}
    </>
  );
}

// ── Componente público ───────────────────────────────────────
export default function DescargaDocumentosSiniestro({ siniestroId, compacto = false, className = "" }) {
  // Resultado etiquetado con su siniestroId: si cambia el siniestro, el
  // anterior deja de contar sin tener que limpiarlo dentro del efecto.
  const [res, setRes] = useState(null);
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    let vivo = true;
    fetchDocumentosSiniestro(siniestroId)
      .then((d) => { if (vivo) setRes({ siniestroId, docs: d }); })
      .catch((e) => { if (vivo) setRes({ siniestroId, error: e.message ?? "No se pudieron cargar los documentos" }); });
    return () => { vivo = false; };
  }, [siniestroId]);

  const actual = res?.siniestroId === siniestroId ? res : null;
  const docs = actual?.docs ?? null;
  const error = actual?.error ?? null;

  if (error) return <p className={`text-[11px] text-red-500 ${className}`}>{error}</p>;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} onClick={(e) => e.stopPropagation()}>
      {TIPOS.map((t) => (
        <BotonTipo
          key={t.k}
          tipo={t}
          items={docs?.[t.lista]}
          cargando={!docs}
          abierto={abierto === t.k}
          onToggle={() => setAbierto((a) => (a === t.k ? null : t.k))}
          onClose={() => setAbierto(null)}
          numeroSiniestro={docs?.numeroSiniestro ?? siniestroId}
          compacto={compacto}
        />
      ))}
    </div>
  );
}
