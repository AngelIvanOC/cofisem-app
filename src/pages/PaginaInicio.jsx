import { useNavigate } from "react-router-dom";
import logoQualitas from "../assets/logo_qualitas.png";
import logoAna      from "../assets/logo_ana.png";
import logoGaman    from "../assets/GamanLogo.png";
import logoHDI      from "../assets/logo_hdi.png";
import logoBanorte  from "../assets/logo_banorte.png";

const aseguradoras = [
  {
    id: "qualitas",
    logo: logoQualitas,
    nombre: "Quálitas",
    href: "https://www.qualitas.com.mx/web/guest/home",
    externo: true,
  },
  {
    id: "ana",
    logo: logoAna,
    nombre: "ANA Seguros",
    href: "https://anaseguros.com.mx/anaweb/index.html",
    externo: true,
  },
  {
    id: "hdi",
    logo: logoHDI,
    nombre: "HDI Seguros",
    href: "https://smartoffice.hdi.com.mx/",
    externo: true,
  },
  {
    id: "banorte",
    logo: logoBanorte,
    nombre: "Banorte Seguros",
    href: "https://espaciobanorte.com/portal/ngPortal/#/login",
    externo: true,
  },
  {
    id: "gaman",
    logo: logoGaman,
    nombre: "GAMAN",
    href: "/gaman/",
    externo: false,
  },
];

export default function PaginaInicio() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-[#0d1128] flex flex-col items-center justify-center px-6 py-12">

      {/* Encabezado */}
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-3">
          Sistema de gestión
        </p>
        <h1 className="text-3xl font-bold text-white">
          Selecciona una aseguradora
        </h1>
        <p className="text-sm text-white/40 mt-2">
          Elige con cuál deseas trabajar hoy
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap justify-center gap-6 w-full max-w-3xl">
        {aseguradoras.map((a) => {
          const handleClick = () => {
            if (a.externo) {
              window.open(a.href, "_blank", "noopener,noreferrer");
            } else {
              navigate(a.href);
            }
          };

          return (
            <button
              key={a.id}
              onClick={handleClick}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-2xl p-8 flex flex-col items-center gap-5 transition-all duration-200 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1 w-52"
            >
              <div className="w-28 h-20 flex items-center justify-center">
                <img
                  src={a.logo}
                  alt={a.nombre}
                  className="max-w-full max-h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                />
              </div>
              <span className="text-xs font-semibold text-white/50 group-hover:text-white/80 transition-colors uppercase tracking-wide">
                {a.nombre}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-white/15 mt-12 text-center">
        COFISEM · Sistema interno de gestión de pólizas
      </p>
    </div>
  );
}
