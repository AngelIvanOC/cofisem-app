// ============================================================
// src/features/ajustador/GenerarDocumentos.jsx
// Paso 4: Pase taller + pase médico (con datos completos) + firmas
// ============================================================
import { useState, useRef } from "react";
import { cerrarSiniestro } from "../../services/siniestros";
import { Campo, CampoSistema, Sep, TALLERES_LISTA, CLINICAS_LISTA } from "./shared";

const TIPOS_LESION = [
  "Traumatismo leve", "Contusión", "Lesión de columna",
  "Fractura", "Luxación", "Herida cortante", "Otro",
];

// ── Pase Taller ───────────────────────────────────────────────
function PaseTaller({ siniestro }) {
  const [tallerIdx,      setTallerIdx]      = useState("");
  const [tallerNombre,   setTallerNombre]   = useState("");
  const [tallerTel,      setTallerTel]      = useState("");
  const [tallerDir,      setTallerDir]      = useState("");
  const [tipoResolucion, setTipoResolucion] = useState("Reparación");

  const p      = siniestro.polizaInfo ?? {};
  const manual = tallerIdx === "manual";
  const taller = !manual && tallerIdx !== "" ? TALLERES_LISTA[Number(tallerIdx)] : null;

  const handleTallerSelect = (val) => {
    setTallerIdx(val);
    if (val !== "manual" && val !== "") {
      const t = TALLERES_LISTA[Number(val)];
      setTallerNombre(t.nombre);
      setTallerTel(t.telefono);
      setTallerDir(t.direccion);
    } else if (val === "manual") {
      setTallerNombre(""); setTallerTel(""); setTallerDir("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Taller asignado</label>
        <select
          value={tallerIdx}
          onChange={(e) => handleTallerSelect(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
        >
          <option value="">Selecciona un taller...</option>
          {TALLERES_LISTA.map((t, i) => <option key={i} value={i}>{t.nombre}</option>)}
          <option value="manual">Otro taller (capturar manualmente)</option>
        </select>
      </div>

      {(manual || taller) && (
        <div className={manual ? "space-y-3 bg-gray-50 rounded-xl p-3" : "bg-gray-50 rounded-xl p-3 space-y-1.5"}>
          {manual ? (
            <>
              <Campo label="Nombre del taller" placeholder="Nombre" value={tallerNombre} onChange={setTallerNombre} />
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Teléfono" type="tel" placeholder="55 0000 0000" value={tallerTel} onChange={setTallerTel} />
              </div>
              <Campo label="Dirección" placeholder="Dirección completa" value={tallerDir} onChange={setTallerDir} />
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-[#13193a]">{taller.nombre}</p>
              <p className="text-xs text-gray-500">{taller.telefono}</p>
              <p className="text-xs text-gray-400">{taller.direccion}</p>
            </>
          )}
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tipo de resolución</label>
        <div className="flex gap-2">
          {["Reparación", "Pérdida total"].map((op) => (
            <button
              key={op}
              onClick={() => setTipoResolucion(op)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${tipoResolucion === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      <Sep label="Deducible (póliza)" />
      <div className="grid grid-cols-2 gap-3">
        <CampoSistema label="Aplica deducible" value={p.aplicaDeducible ? "Sí" : "No"} />
        <CampoSistema label="Porcentaje"       value={p.aplicaDeducible ? `${p.porcentajeDeducible}%` : "—"} />
      </div>
    </div>
  );
}

// ── Pase Médico ───────────────────────────────────────────────
function PaseMedico({ siniestro }) {
  const [clinicaIdx,    setClinicaIdx]    = useState("");
  const [clinicaNombre, setClinicaNombre] = useState("");
  const [clinicaTel,    setClinicaTel]    = useState("");
  const [clinicaDir,    setClinicaDir]    = useState("");
  const [tipoPaso,      setTipoPaso]      = useState("Ambulatorio");
  const [lesionado,     setLesionado]     = useState("Tercero");
  const [tipoLesion,    setTipoLesion]    = useState("");
  const [observaciones, setObservaciones] = useState("");

  const manual  = clinicaIdx === "manual";
  const clinica = !manual && clinicaIdx !== "" ? CLINICAS_LISTA[Number(clinicaIdx)] : null;

  const handleClinicaSelect = (val) => {
    setClinicaIdx(val);
    if (val !== "manual" && val !== "") {
      const c = CLINICAS_LISTA[Number(val)];
      setClinicaNombre(c.nombre); setClinicaTel(c.telefono); setClinicaDir(c.direccion);
    } else if (val === "manual") {
      setClinicaNombre(""); setClinicaTel(""); setClinicaDir("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Lesionado</label>
        <div className="flex gap-2 flex-wrap">
          {["Asegurado", "Tercero"].map((op) => (
            <button
              key={op}
              onClick={() => setLesionado(op)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${lesionado === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Clínica / Red hospitalaria</label>
        <select
          value={clinicaIdx}
          onChange={(e) => handleClinicaSelect(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
        >
          <option value="">Selecciona una clínica...</option>
          {CLINICAS_LISTA.map((c, i) => <option key={i} value={i}>{c.nombre}</option>)}
          <option value="manual">Otra clínica (capturar manualmente)</option>
        </select>
      </div>

      {(manual || clinica) && (
        <div className={manual ? "space-y-3 bg-gray-50 rounded-xl p-3" : "bg-gray-50 rounded-xl p-3 space-y-1.5"}>
          {manual ? (
            <>
              <Campo label="Nombre de la clínica" placeholder="Nombre" value={clinicaNombre} onChange={setClinicaNombre} />
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Teléfono" type="tel" placeholder="55 0000 0000" value={clinicaTel} onChange={setClinicaTel} />
              </div>
              <Campo label="Dirección" placeholder="Dirección completa" value={clinicaDir} onChange={setClinicaDir} />
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-[#13193a]">{clinica.nombre}</p>
              <p className="text-xs text-gray-500">{clinica.telefono}</p>
              <p className="text-xs text-gray-400">{clinica.direccion}</p>
            </>
          )}
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tipo de atención</label>
        <div className="flex gap-2">
          {["Ambulatorio", "Hospitalario"].map((op) => (
            <button
              key={op}
              onClick={() => setTipoPaso(op)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${tipoPaso === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tipo de lesión</label>
        <select
          value={tipoLesion}
          onChange={(e) => setTipoLesion(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
        >
          <option value="">Selecciona el tipo...</option>
          {TIPOS_LESION.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      <Campo
        label="Observaciones"
        placeholder="Describe las lesiones y circunstancias relevantes..."
        rows={3}
        value={observaciones}
        onChange={setObservaciones}
      />
    </div>
  );
}

// ── Modal de firma táctil ─────────────────────────────────────
function ModalFirma({ label, onConfirmar, onCerrar }) {
  const canvasRef  = useRef(null);
  const dibujando  = useRef(false);
  const ultimoPto  = useRef(null);

  const getXY = (e, canvas) => {
    const r   = canvas.getBoundingClientRect();
    const src = e.touches?.[0] ?? e;
    return {
      x: (src.clientX - r.left) * (canvas.width  / r.width),
      y: (src.clientY - r.top)  * (canvas.height / r.height),
    };
  };
  const draw = (from, to, ctx) => {
    ctx.beginPath(); ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = "#13193a"; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  };

  const onDown = (e) => {
    dibujando.current = true;
    ultimoPto.current = getXY(e, canvasRef.current);
    if (e.cancelable) e.preventDefault();
  };
  const onMove = (e) => {
    if (!dibujando.current) return;
    if (e.cancelable) e.preventDefault();
    const to = getXY(e, canvasRef.current);
    draw(ultimoPto.current, to, canvasRef.current.getContext("2d"));
    ultimoPto.current = to;
  };
  const onUp = () => { dibujando.current = false; };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.6)" }}
      onClick={onCerrar}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-[#13193a] text-sm">Capturar firma</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-3 text-center">Firma dentro del recuadro con el dedo o el lápiz</p>
          <canvas
            ref={canvasRef}
            width={460}
            height={200}
            className="w-full border-2 border-dashed border-gray-300 rounded-2xl touch-none bg-gray-50"
            style={{ height: 180 }}
            onMouseDown={onDown}  onMouseMove={onMove}  onMouseUp={onUp}   onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove}  onTouchEnd={onUp}
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { const ctx = canvasRef.current?.getContext("2d"); if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >Limpiar</button>
            <button
              onClick={() => onConfirmar(canvasRef.current.toDataURL())}
              className="flex-1 py-3 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50] shadow-lg shadow-[#13193a]/15"
            >Confirmar Firma</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function GenerarDocumentos({ siniestro, onFinalizar }) {
  const [docs,      setDocs]      = useState({ taller: false, medico: false });
  const [firmas,    setFirmas]    = useState({ asegurado: null, afectado: null, ajustador: null });
  const [firmando,  setFirmando]  = useState(null);
  const [cerrando,  setCerrando]  = useState(false);
  const [errorCierre, setErrorCierre] = useState(null);

  const handleFinalizar = async () => {
    setCerrando(true);
    setErrorCierre(null);
    try {
      await cerrarSiniestro(siniestro.id);
      onFinalizar();
    } catch (err) {
      setErrorCierre(err.message ?? "Error al cerrar el siniestro");
      setCerrando(false);
    }
  };

  const FIRMAS_CONFIG = [
    { id: "asegurado", label: "Firma del Asegurado", sub: siniestro.asegurado        },
    { id: "afectado",  label: "Firma del Afectado",  sub: "Tercero involucrado"       },
    { id: "ajustador", label: "Firma del Ajustador", sub: "Ajustador asignado"        },
  ];

  const DocToggle = ({ k, titulo, desc, children }) => (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${docs[k] ? "border-[#13193a]" : "border-gray-200"}`}>
      <button
        onClick={() => setDocs((d) => ({ ...d, [k]: !d[k] }))}
        className="w-full flex items-center gap-3 p-4"
      >
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${docs[k] ? "border-[#13193a] bg-[#13193a]" : "border-gray-300"}`}>
          {docs[k] && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-bold text-[#13193a]">{titulo}</p>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${docs[k] ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {docs[k] && <div className="px-4 pb-4 border-t border-gray-100 pt-3">{children}</div>}
    </div>
  );

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-[#13193a] rounded-2xl">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-sm">Documentos del Siniestro</p>
          <p className="text-white/50 text-xs mt-0.5">{siniestro.folio ?? siniestro.id} · {siniestro.asegurado}</p>
        </div>
      </div>

      {/* Documentos */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Selecciona los documentos a generar</p>
        <DocToggle k="taller" titulo="Pase Taller" desc="Autorización para reparación del vehículo">
          <PaseTaller siniestro={siniestro} />
        </DocToggle>
        <DocToggle k="medico" titulo="Pase Médico" desc="Autorización de atención por lesiones">
          <PaseMedico siniestro={siniestro} />
        </DocToggle>
      </div>

      {/* Firmas */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Firmas requeridas</p>
        {FIRMAS_CONFIG.map((f) => (
          <div key={f.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-[#13193a]">{f.label}</p>
                <p className="text-xs text-gray-400">{f.sub}</p>
              </div>
              {firmas[f.id] && (
                <button
                  onClick={() => setFirmas((p) => ({ ...p, [f.id]: null }))}
                  className="text-xs text-red-400 hover:text-red-600 font-medium"
                >Borrar</button>
              )}
            </div>
            {firmas[f.id] ? (
              <div className="p-3 bg-gray-50 flex items-center justify-center h-16">
                <img src={firmas[f.id]} alt="Firma" className="h-full" style={{ filter: "invert(1) brightness(0.15)" }} />
              </div>
            ) : (
              <button
                onClick={() => setFirmando(f.id)}
                className="w-full px-4 py-5 flex flex-col items-center gap-2 text-gray-400 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                <span className="text-xs font-semibold">Toca para firmar</span>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 pb-6 space-y-2">
        {errorCierre && (
          <p className="text-xs text-red-500 text-center font-medium">{errorCierre}</p>
        )}
        <button
          onClick={handleFinalizar}
          disabled={cerrando}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
        >
          {cerrando ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Cerrando siniestro...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Finalizar y Enviar Documentos
            </>
          )}
        </button>
      </div>

      {firmando && (
        <ModalFirma
          label={FIRMAS_CONFIG.find((f) => f.id === firmando)?.label ?? ""}
          onConfirmar={(dataUrl) => { setFirmas((p) => ({ ...p, [firmando]: dataUrl })); setFirmando(null); }}
          onCerrar={() => setFirmando(null)}
        />
      )}
    </div>
  );
}
