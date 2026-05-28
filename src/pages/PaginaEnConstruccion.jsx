import gamanLogo from "../assets/gaman_transparente.png";

const ICONOS = {
  default: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  usuarios: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  pagos: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  ),
  reportes: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  siniestros: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
};

// Bloques de construcción animados
function BuildingBlocks() {
  const blocks = [
    { x: 0, y: 56, w: 32, h: 32, delay: "0s", color: "bg-[#13193a]" },
    { x: 36, y: 40, w: 32, h: 48, delay: "0.15s", color: "bg-[#1e2a50]" },
    { x: 72, y: 24, w: 32, h: 64, delay: "0.3s", color: "bg-[#13193a]" },
    { x: 108, y: 48, w: 32, h: 40, delay: "0.45s", color: "bg-[#2a3a6e]" },
    { x: 144, y: 32, w: 32, h: 56, delay: "0.6s", color: "bg-[#13193a]" },
  ];

  return (
    <div className="relative w-44 h-24 mx-auto mb-2">
      {blocks.map((b, i) => (
        <div
          key={i}
          className={`absolute bottom-0 ${b.color} rounded-t-lg opacity-0`}
          style={{
            left: b.x,
            width: b.w,
            height: b.h,
            animation: `rise 0.6s ease-out ${b.delay} forwards`,
          }}
        />
      ))}
      {/* Grúa decorativa */}
      <div className="absolute -top-4 -right-2 w-px h-8 bg-gray-300" />
      <div className="absolute -top-4 -right-2 w-10 h-px bg-gray-300" />
      <div className="absolute -top-4 right-6 w-px h-4 bg-gray-300" />
    </div>
  );
}

function GearIcon() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function PaginaEnConstruccion({
  titulo = "Sección",
  subtitulo,
  icono = "default",
}) {
  const iconEl = ICONOS[icono.toLowerCase()] ?? ICONOS.default;

  return (
    <div className="p-6 min-h-full bg-gray-50 flex flex-col">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#13193a]">{titulo}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {subtitulo ?? "Sección en construcción"}
        </p>
      </div>

      {/* Card principal */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Tarjeta */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Franja superior */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#13193a] via-[#2a3a6e] to-[#13193a]" />

            <div className="px-8 pt-10 pb-8 flex flex-col items-center text-center">
              {/* Icono central con engranajes */}
              <div className="relative mb-8">
                {/* Engranaje grande girando */}
                <div
                  className="w-20 h-20 text-[#13193a]/10 absolute -top-2 -left-3"
                  style={{ animation: "spin 12s linear infinite" }}
                >
                  <GearIcon />
                </div>
                {/* Engranaje pequeño girando al revés */}
                <div
                  className="w-10 h-10 text-[#13193a]/15 absolute -bottom-1 -right-2"
                  style={{ animation: "spin 8s linear infinite reverse" }}
                >
                  <GearIcon />
                </div>

                {/* Icono de sección en el centro */}
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#13193a] flex items-center justify-center shadow-lg shadow-[#13193a]/20">
                  <div className="w-7 h-7 text-white">{iconEl}</div>
                </div>
              </div>

              {/* Texto */}
              <h2 className="text-lg font-black text-[#13193a] tracking-tight mb-2">
                En construcción
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                La sección{" "}
                <span className="font-semibold text-[#13193a]">{titulo}</span>{" "}
                está siendo desarrollada y estará disponible muy pronto.
              </p>

              {/* Barra de progreso animada */}
              <div className="w-full mt-8 mb-2">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                  <span>Progreso de desarrollo</span>
                  <span className="font-semibold text-[#13193a]">
                    En proceso
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#13193a] to-[#2a3a6e]"
                    style={{
                      width: "60%",
                      animation: "progress 2.5s ease-in-out infinite alternate",
                    }}
                  />
                </div>
              </div>

              {/* Puntos pulsantes */}
              <div className="flex gap-1.5 mt-5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#13193a]/30"
                    style={{
                      animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={gamanLogo}
                  alt="GAMAN"
                  className="h-5 object-contain opacity-60"
                />
              </div>
              <span className="text-[10px] text-gray-300 font-semibold tracking-widest uppercase">
                COFISEM · Sistema
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* CSS inline para animaciones */}
      <style>{`
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes progress     { from { width: 45%; } to { width: 75%; } }
        @keyframes pulse-dot    { 0%,100% { opacity:.3; transform:scale(1); } 50% { opacity:1; transform:scale(1.4); } }
        @keyframes rise         { from { transform:scaleY(0); transform-origin:bottom; opacity:0; } to { transform:scaleY(1); transform-origin:bottom; opacity:1; } }
      `}</style>
    </div>
  );
}
