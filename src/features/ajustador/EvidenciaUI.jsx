// ============================================================
// src/features/ajustador/EvidenciaUI.jsx
// Botón de evidencia con upload real (BtnEvidencia) + hook de manejo
// de colección de fotos (useEvidencias) — extraído de
// CapturaEvidencia.jsx para reutilizarse en los módulos nuevos
// (NA-Módulo1/2, Tercero-Módulo1/2, Evidencias) sin duplicar la
// lógica de subida/compresión/borrado.
// ============================================================
import { useState, useRef, useCallback, useEffect } from "react";
import { subirEvidencia, eliminarEvidencia, fetchEvidencias, getSignedUrl } from "../../services/evidencias";
import CamaraGuiada from "./CamaraGuiada";
import CarruselFotos from "./CarruselFotos";

// Cada item: { localUrl, storagePath, uploading, error }
// `guiaCamara` (opcional): { titulo, instructivo } — cuando viene, el
// botón abre la cámara en vivo con guía de encuadre (CamaraGuiada) en
// vez de mandar directo a la app de cámara nativa del celular, que no
// permite dibujar ninguna guía encima. Se deja "o elegir de galería"
// como respaldo por si la cámara en vivo falla (permiso negado, etc.).
export function BtnEvidencia({ label, icon, items, onAdd, onRemove, guiaCamara }) {
  const ref = useRef();
  const [camaraAbierta, setCamaraAbierta] = useState(false);

  const agregarArchivo = (file) => {
    const localUrl = URL.createObjectURL(file);
    onAdd({ localUrl, storagePath: null, uploading: true, error: null, file });
  };

  const handleFiles = (e) => {
    Array.from(e.target.files || []).forEach(agregarArchivo);
    e.target.value = "";
  };

  const handleCapturar = (file) => {
    agregarArchivo(file);
    setCamaraAbierta(false);
  };

  const uploadCount  = items.filter((i) => i.uploading).length;
  const doneCount    = items.filter((i) => !i.uploading && !i.error).length;
  const errorCount   = items.filter((i) => i.error).length;

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        capture={guiaCamara ? undefined : "environment"}
        className="hidden"
        onChange={handleFiles}
      />
      <button
        onClick={() => (guiaCamara ? setCamaraAbierta(true) : ref.current?.click())}
        className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-1.5 hover:border-[#13193a]/25 hover:bg-gray-50 transition-all active:scale-[0.98]"
      >
        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
          {icon ?? (
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
        <p className="text-xs font-semibold text-gray-500 text-center leading-snug px-2">{label}</p>
        {doneCount > 0 && (
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold">
            {doneCount} subida{doneCount > 1 ? "s" : ""}
          </span>
        )}
        {uploadCount > 0 && (
          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 font-bold">
            {uploadCount} subiendo...
          </span>
        )}
        {errorCount > 0 && (
          <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5 font-bold">
            {errorCount} error
          </span>
        )}
      </button>

      {guiaCamara && (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full mt-1 text-center text-[10px] text-gray-400 hover:text-[#13193a] underline underline-offset-2"
        >
          o elegir de galería
        </button>
      )}

      {camaraAbierta && (
        <CamaraGuiada
          titulo={guiaCamara.titulo ?? label}
          instructivo={guiaCamara.instructivo}
          onCapturar={handleCapturar}
          onCerrar={() => setCamaraAbierta(false)}
        />
      )}

      {items.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {items.map((item, i) => (
            <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100">
              <img src={item.localUrl} alt="" className="w-full h-full object-cover" />

              {item.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {!item.uploading && !item.error && (
                <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {item.error && (
                <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  </svg>
                </div>
              )}

              {!item.uploading && (
                <button
                  onClick={() => onRemove(i, item.storagePath)}
                  className="absolute bottom-0.5 left-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── DocumentoFotos ──────────────────────────────────────────
// Una sola caja por documento (licencia, INE, identificación oficial,
// tarjeta de circulación). Acepta varias fotos que se amontonan; al
// tocar la pila se abre el carrusel para verlas y borrarlas. Botón
// principal = galería con multiselección (sin `capture`, que en el
// celular anula el `multiple`); botón "Tomar foto" = cámara, una por
// una. Comparte `items` / `onAdd` / `onRemove` con useEvidencias, igual
// que BtnEvidencia.
export function DocumentoFotos({ label, icon, items, onAdd, onRemove }) {
  const refGaleria = useRef();
  const refCamara  = useRef();
  const [visor, setVisor] = useState(false);

  const agregarArchivo = (file) => {
    const localUrl = URL.createObjectURL(file);
    onAdd({ localUrl, storagePath: null, uploading: true, error: null, file });
  };
  const handleFiles = (e) => {
    Array.from(e.target.files || []).forEach(agregarArchivo);
    e.target.value = "";
  };

  const uploadCount = items.filter((i) => i.uploading).length;
  const doneCount   = items.filter((i) => !i.uploading && !i.error).length;
  const errorCount  = items.filter((i) => i.error).length;
  const tieneFotos  = items.length > 0;

  return (
    <div>
      <input ref={refGaleria} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <input ref={refCamara} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFiles} />

      <div className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            {icon ?? (
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-600 leading-snug">{label}</p>
            <div className="flex gap-1.5 mt-0.5 flex-wrap">
              {doneCount > 0 && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold">
                  {doneCount} foto{doneCount > 1 ? "s" : ""}
                </span>
              )}
              {uploadCount > 0 && (
                <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 font-bold">{uploadCount} subiendo...</span>
              )}
              {errorCount > 0 && (
                <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5 font-bold">{errorCount} error</span>
              )}
              {!tieneFotos && <span className="text-[10px] text-gray-400 font-medium">Sin fotos</span>}
            </div>
          </div>
        </div>

        {tieneFotos && (
          <button type="button" onClick={() => setVisor(true)} className="flex -space-x-3 mt-3" title="Ver fotos">
            {items.slice(0, 4).map((it, i) => (
              <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-white ring-1 ring-gray-200 bg-gray-50">
                <img src={it.localUrl} alt="" className="w-full h-full object-cover" />
                {it.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                {it.error && (
                  <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {items.length > 4 && (
              <div className="w-14 h-14 rounded-xl border-2 border-white ring-1 ring-gray-200 bg-[#13193a] text-white flex items-center justify-center text-xs font-bold">
                +{items.length - 4}
              </div>
            )}
          </button>
        )}

        <div className="flex gap-2 mt-3">
          <button type="button" onClick={() => refGaleria.current?.click()}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] transition-all active:scale-[0.98]">
            {tieneFotos ? "Agregar más" : "Agregar fotos"}
          </button>
          <button type="button" onClick={() => refCamara.current?.click()}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-all active:scale-[0.98]">
            Tomar foto
          </button>
        </div>
      </div>

      {visor && (
        <CarruselFotos
          imgs={items.map((it) => ({ url: it.localUrl, storagePath: it.storagePath, uploading: it.uploading }))}
          onClose={() => setVisor(false)}
          onEliminar={(idx) => onRemove(idx, items[idx]?.storagePath)}
        />
      )}
    </div>
  );
}

// ── Hook: gestiona la colección de items + upload de cada uno ─
// `tiposLectura` (opcional): tipos extra a traer de BD al montar además
// de `tipo` — p. ej. la caja "tarjeta_circulacion" también rehidrata las
// filas legadas "tarjeta_circulacion_frente" / "_reverso". Las subidas
// nuevas siempre van a `tipo`.
export function useEvidencias(siniestroId, numeroSiniestro, participante, tipo, tiposLectura) {
  const [items, setItems] = useState([]);
  const hidratado = useRef(false);
  const tiposKey = (tiposLectura ?? [tipo]).join(",");

  // Rehidrata lo ya subido — sin esto, al salir del módulo y volver, la
  // caja se ve vacía aunque las fotos estén en Storage.
  useEffect(() => {
    if (hidratado.current) return;
    let cancelado = false;
    const tipos = tiposLectura ?? [tipo];
    fetchEvidencias(siniestroId)
      .then(async (rows) => {
        const mias = rows.filter((e) => e.participante === participante && tipos.includes(e.tipo));
        const conUrl = await Promise.all(
          mias.map(async (e) => ({
            localUrl: await getSignedUrl(e.storage_path).catch(() => null),
            storagePath: e.storage_path,
            uploading: false,
            error: null,
            _idx: `db-${e.id}`,
          })),
        );
        if (!cancelado) {
          setItems((prev) => (prev.length ? prev : conUrl.filter((x) => x.localUrl)));
          hidratado.current = true;
        }
      })
      .catch(() => {});
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siniestroId, participante, tiposKey]);

  const agregar = useCallback(({ localUrl, file }) => {
    const idx = Date.now() + Math.random();
    setItems((prev) => [...prev, { localUrl, storagePath: null, uploading: true, error: null, _idx: idx }]);

    subirEvidencia({ siniestroId, numeroSiniestro, participante, tipo, file })
      .then((path) => {
        setItems((prev) =>
          prev.map((it) => it._idx === idx ? { ...it, storagePath: path, uploading: false } : it)
        );
      })
      .catch((err) => {
        setItems((prev) =>
          prev.map((it) => it._idx === idx ? { ...it, uploading: false, error: err.message ?? "Error" } : it)
        );
      });
  }, [siniestroId, numeroSiniestro, participante, tipo]);

  const eliminar = useCallback((i, storagePath) => {
    setItems((prev) => prev.filter((_, j) => j !== i));
    if (storagePath) eliminarEvidencia(storagePath).catch(() => {});
  }, []);

  return { items, agregar, eliminar };
}
