// ============================================================
// src/shared/forms/Campos.jsx
// Campos de formulario reutilizables: texto, select y sección
// ============================================================

const INP_CLS =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";

const READONLY_CLS =
  "w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-[#13193a] cursor-default select-none";

const LBL_CLS = "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";

export function CampoTexto({
  label, value, onChange, placeholder,
  type = "text", readonly = false, req = false, rows,
}) {
  const cls = readonly ? READONLY_CLS : INP_CLS;
  return (
    <div>
      {label && (
        <label className={LBL_CLS}>
          {label}{req && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {rows ? (
        <textarea
          rows={rows}
          readOnly={readonly}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          type={type}
          readOnly={readonly}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className={cls}
        />
      )}
    </div>
  );
}

export function CampoSelect({ label, value, onChange, opciones, req = false }) {
  return (
    <div>
      {label && (
        <label className={LBL_CLS}>
          {label}{req && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value ?? ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={INP_CLS + " cursor-pointer"}
      >
        {opciones.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>{o}</option>
          ) : (
            <option key={o.value} value={o.value}>{o.label}</option>
          )
        )}
      </select>
    </div>
  );
}

export function SeccionForm({ titulo, subtitulo, children, accion }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#13193a] px-5 py-3.5 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white tracking-wide">{titulo}</p>
          {subtitulo && <p className="text-white/40 text-xs mt-0.5">{subtitulo}</p>}
        </div>
        {accion}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function BotonesModal({ onCancelar, onConfirmar, textoConfirmar = "Guardar", disabled = false, loading = false }) {
  return (
    <div className="flex gap-3 px-6 pb-6">
      <button
        onClick={onCancelar}
        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
      >
        Cancelar
      </button>
      <button
        onClick={onConfirmar}
        disabled={disabled || loading}
        className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-lg shadow-[#13193a]/15 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Guardando...
          </>
        ) : textoConfirmar}
      </button>
    </div>
  );
}
