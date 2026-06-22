import { useState, useRef, useEffect, useMemo } from "react";
import { Children, isValidElement } from "react";

function flattenLabel(node) {
  if (node == null) return "";
  if (Array.isArray(node)) return node.map(flattenLabel).join("");
  return String(node);
}

function parseOptions(children) {
  return Children.toArray(children)
    .filter((c) => isValidElement(c) && c.type === "option")
    .map((c) => ({
      value: String(c.props.value ?? ""),
      label: flattenLabel(c.props.children),
    }));
}

export default function SelectTypeahead({
  value,
  onChange,
  disabled,
  className = "",
  children,
}) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  const options   = useMemo(() => parseOptions(children), [children]);
  const placeholder = options.find((o) => o.value === "")?.label ?? "Selecciona...";
  const selected    = options.find((o) => o.value === String(value ?? ""));

  const filtered = useMemo(() => {
    const list = options.filter((o) => o.value !== "");
    if (!query.trim()) return list;
    const words = query.toLowerCase().trim().split(/\s+/);
    return list.filter((o) => {
      const label = o.label.toLowerCase();
      return words.every((w) => label.includes(w));
    });
  }, [options, query]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Enfocar el buscador al abrir
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  function pick(val) {
    onChange?.({ target: { value: val } });
    setOpen(false);
  }

  // Extraer flex-1 / flex-none para el contenedor; el resto va al botón
  const isFlexOne = className.includes("flex-1");

  return (
    <div
      ref={wrapRef}
      className={`relative${isFlexOne ? " flex-1" : ""}`}
    >
      {/* Trigger — imita visualmente a un <select> */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={
          "w-full flex items-center justify-between gap-2 text-left text-sm " +
          "px-3 py-2 rounded-xl border border-gray-200 bg-white " +
          "focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] " +
          "transition-all " +
          (disabled ? "opacity-50 cursor-not-allowed bg-gray-50 " : "cursor-pointer ") +
          (open ? "border-[#13193a] ring-2 ring-[#13193a]/15" : "")
        }
      >
        <span className={selected ? "text-gray-700 truncate" : "text-gray-300 truncate"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400 italic">Sin resultados</li>
            ) : (
              filtered.map((o) => (
                <li
                  key={o.value}
                  onMouseDown={() => pick(o.value)}
                  className={
                    "px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 " +
                    (o.value === String(value ?? "")
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700")
                  }
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
