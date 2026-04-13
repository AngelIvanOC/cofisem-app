// ============================================================
// src/features/ajustador/GenerarDocumentos.jsx
// Paso 4: Documentos (orden de reparación, pase médico) + firmas digitales en canvas
// ============================================================
import { useState, useRef } from "react";

const TALLERES = ["Taller Morelos", "AutoServicios del Sur", "Taller Zapata", "Multimarcas Cuernavaca"];
const CLINICAS = ["Clínica IMSS Zona Norte", "Hospital San Miguel", "Cruz Roja Cuernavaca", "Clínica Santa María"];
const LESIONES = ["Traumatismo leve", "Contusión", "Lesión de columna", "Fractura", "Otro"];

export default function GenerarDocumentos({ siniestro, onFinalizar }) {
  const [docs,    setDocs]    = useState({ orden: false, pase: false });
  const [taller,  setTaller]  = useState("");
  const [clinica, setClinica] = useState("");
  const [lesion,  setLesion]  = useState("");
  const [firmas,  setFirmas]  = useState({ asegurado: null, afectado: null, ajustador: null });
  const [firmando, setFirmando] = useState(null);
  const canvasRef = useRef(null);
  const dibujando = useRef(false);
  const ultimoPto = useRef(null);

  // ── Handlers del canvas (táctil + mouse) ─────────────────
  const onTouchStart = e => {
    dibujando.current = true;
    const r = canvasRef.current.getBoundingClientRect();
    ultimoPto.current = {
      x: (e.touches[0].clientX - r.left) * (canvasRef.current.width / r.width),
      y: (e.touches[0].clientY - r.top)  * (canvasRef.current.height / r.height),
    };
  };
  const onTouchMove = e => {
    if (!dibujando.current) return;
    e.preventDefault();
    const r = canvasRef.current.getBoundingClientRect();
    const x = (e.touches[0].clientX - r.left) * (canvasRef.current.width / r.width);
    const y = (e.touches[0].clientY - r.top)  * (canvasRef.current.height / r.height);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath(); ctx.moveTo(ultimoPto.current.x, ultimoPto.current.y);
    ctx.lineTo(x, y); ctx.strokeStyle = "#13193a"; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    ultimoPto.current = { x, y };
  };
  const onMouseDown = e => {
    dibujando.current = true;
    const r = canvasRef.current.getBoundingClientRect();
    ultimoPto.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onMouseMove = e => {
    if (!dibujando.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath(); ctx.moveTo(ultimoPto.current.x, ultimoPto.current.y);
    ctx.lineTo(x, y); ctx.strokeStyle = "#13193a"; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    ultimoPto.current = { x, y };
  };
  const stopDraw = () => { dibujando.current = false; };

  const confirmarFirma = () => {
    setFirmas(f => ({ ...f, [firmando]: canvasRef.current.toDataURL() }));
    setFirmando(null);
  };
  const limpiarCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // ── Toggle expandible de documento ───────────────────────
  const DocToggle = ({ k, titulo, desc, children }) => (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${docs[k] ? "border-[#13193a]" : "border-gray-200"}`}>
      <button onClick={() => setDocs(d => ({ ...d, [k]: !d[k] }))} className="w-full flex items-center gap-3 p-4">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${docs[k] ? "border-[#13193a] bg-[#13193a]" : "border-gray-300"}`}>
          {docs[k] && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-[#13193a]">{titulo}</p>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
      </button>
      {docs[k] && <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">{children}</div>}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-[#13193a] rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Generar Documentos</p>
            <p className="text-white/50 text-xs mt-0.5">{siniestro.id} · {siniestro.asegurado}</p>
          </div>
        </div>

        {/* Documentos */}
        <div className="space-y-3">
          <DocToggle k="orden" titulo="Orden de Reparación" desc="Autorización para reparación en taller">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Taller asignado</label>
            <select value={taller} onChange={e => setTaller(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]">
              <option value="">Selecciona un taller</option>
              {TALLERES.map(t => <option key={t}>{t}</option>)}
            </select>
          </DocToggle>

          <DocToggle k="pase" titulo="Pase Médico" desc="Autorización de atención médica">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Clínica</label>
            <select value={clinica} onChange={e => setClinica(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] mb-3">
              <option value="">Selecciona una clínica</option>
              {CLINICAS.map(c => <option key={c}>{c}</option>)}
            </select>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tipo de lesión</label>
            <select value={lesion} onChange={e => setLesion(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]">
              <option value="">Tipo de lesión</option>
              {LESIONES.map(l => <option key={l}>{l}</option>)}
            </select>
          </DocToggle>
        </div>

        {/* Firmas */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Firmas requeridas</p>
          {[
            { id: "asegurado", label: "Firma de Nuestro Asegurado", icon: "🧑‍💼" },
            { id: "afectado",  label: "Firma del Afectado",         icon: "🙋"   },
            { id: "ajustador", label: "Firma del Ajustador",        icon: "📋"   },
          ].map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-[#13193a] flex items-center gap-2">
                  <span>{f.icon}</span>{f.label}
                </p>
                {firmas[f.id] && (
                  <button onClick={() => setFirmas(p => ({ ...p, [f.id]: null }))}
                    className="text-xs text-red-400 hover:text-red-600 font-medium">Borrar</button>
                )}
              </div>
              {firmas[f.id] ? (
                <div className="p-3 bg-gray-50 flex items-center justify-center h-16">
                  <img src={firmas[f.id]} alt="Firma" className="h-full" style={{ filter: "invert(1) brightness(0.15)" }}/>
                </div>
              ) : (
                <button onClick={() => setFirmando(f.id)}
                  className="w-full px-4 py-5 flex flex-col items-center gap-2 text-gray-400 hover:bg-gray-50 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                  </svg>
                  <span className="text-xs font-semibold">Toca para firmar</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button onClick={onFinalizar}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Finalizar y Enviar Documentos
        </button>
      </div>

      {/* Modal de firma táctil */}
      {firmando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.6)" }}
          onClick={() => setFirmando(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-[#13193a] text-sm">Capturar firma</p>
              <button onClick={() => setFirmando(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-400 mb-3 text-center">Firma dentro del recuadro con el dedo o el lápiz</p>
              <canvas ref={canvasRef} width={460} height={200}
                className="w-full border-2 border-dashed border-gray-300 rounded-2xl touch-none bg-gray-50"
                style={{ height: 180 }}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={stopDraw}/>
              <div className="flex gap-3 mt-4">
                <button onClick={limpiarCanvas} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Limpiar
                </button>
                <button onClick={confirmarFirma} className="flex-1 py-3 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50] shadow-lg shadow-[#13193a]/15">
                  Confirmar Firma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
