// ============================================================
// src/shared/ui/Modal.jsx — RESPONSIVE
// Desktop: modal centrado
// Mobile: slide-up sheet desde abajo
// ============================================================

export default function Modal({
  children,
  onClose,
  maxWidth = "max-w-lg",
  title,
  subtitle,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(10,15,40,0.55)",
      }}
      onClick={onClose}
    >
      <div
        className={[
          "bg-white w-full sm:${maxWidth} sm:rounded-2xl rounded-t-2xl shadow-2xl",
          "max-h-[92vh] overflow-y-auto",
          // Mobile: full width sheet; Desktop: constrained
          `sm:${maxWidth}`,
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {(title || subtitle) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
            <div>
              {title && (
                <h2 className="text-sm font-bold text-[#13193a]">{title}</h2>
              )}
              {subtitle && (
                <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors shrink-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
