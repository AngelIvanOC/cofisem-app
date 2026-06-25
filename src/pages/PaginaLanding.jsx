import { useNavigate } from "react-router-dom";
import logoQualitas from "../assets/logo_qualitas.png";
import logoAna from "../assets/logo_ana.png";
import logoHDI from "../assets/logo_hdi.png";
import logoBanorte from "../assets/logo_banorte.png";

const ASEGURADORAS = [
  { logo: logoQualitas, nombre: "Quálitas", w: "h-8" },
  { logo: logoAna, nombre: "ANA Seguros", w: "h-7" },
  { logo: logoHDI, nombre: "HDI Seguros", w: "h-8" },
  { logo: logoBanorte, nombre: "Banorte Seguros", w: "h-7" },
];

const COBERTURAS = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
        />
      </svg>
    ),
    tipo: "Autos y pickups",
    desc: "Cobertura amplia, básica o limitada para vehículos particulares. Protege tu auto contra robo, daños y responsabilidad civil.",
    tag: "Más popular",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
      </svg>
    ),
    tipo: "Plataformas digitales",
    desc: "Pólizas especializadas para conductores de DIDI, UBER, Cabify y otras apps de transporte privado.",
    tag: "DIDI · UBER",
    tagColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
        />
      </svg>
    ),
    tipo: "Servicio público (Taxi)",
    desc: "Coberturas específicas para unidades de taxi con tarifas competitivas y trámite ágil para taxistas.",
    tag: "Servicio público",
    tagColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25M17.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H9m11.25-4.5H3.375"
        />
      </svg>
    ),
    tipo: "Carga y pickups",
    desc: "Seguro para pickups de carga y unidades de transporte de mercancía, con coberturas adaptadas a tu negocio.",
    tag: "Comercial",
    tagColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

const BENEFICIOS = [
  {
    icon: "⚡",
    titulo: "Trámite en minutos",
    desc: "Cotiza y emite tu póliza el mismo día. Sin papeleo excesivo ni esperas.",
  },
  {
    icon: "🏦",
    titulo: "Múltiples aseguradoras",
    desc: "Comparamos entre Quálitas, ANA, HDI y Banorte para ofrecerte el mejor precio.",
  },
  {
    icon: "💳",
    titulo: "Formas de pago flexibles",
    desc: "Pago de contado, trimestral o en parcialidades. Tú eliges cómo y cuándo pagar.",
  },
  {
    icon: "🛡️",
    titulo: "Atención a siniestros",
    desc: "Te acompañamos desde el reporte hasta la resolución. No estás solo ante un accidente.",
  },
  {
    icon: "📲",
    titulo: "Gestión 100% digital",
    desc: "Consulta tu póliza, pagos y estado de tu seguro desde cualquier dispositivo.",
  },
  {
    icon: "🤝",
    titulo: "Atención personalizada",
    desc: "Un agente dedicado te asesora y resuelve tus dudas en cada etapa del proceso.",
  },
];

const PASOS = [
  {
    num: "01",
    titulo: "Cotiza",
    desc: "Cuéntanos sobre tu vehículo y te comparamos las mejores opciones disponibles.",
  },
  {
    num: "02",
    titulo: "Elige",
    desc: "Selecciona la aseguradora y el tipo de cobertura que mejor se adapte a ti.",
  },
  {
    num: "03",
    titulo: "Contrata",
    desc: "Firma tu póliza de forma ágil y recibe tu documentación al instante.",
  },
  {
    num: "04",
    titulo: "Disfruta",
    desc: "Viaja tranquilo. En caso de siniestro, estamos contigo durante todo el proceso.",
  },
];

export default function PaginaLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#13193a] flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#13193a] leading-none tracking-tight">
                COFISEM
              </p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                Seguros Automotrices
              </p>
            </div>
          </div>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-7">
            {[
              { label: "Coberturas", href: "#coberturas" },
              { label: "Beneficios", href: "#beneficios" },
              { label: "¿Cómo funciona?", href: "#como-funciona" },
              { label: "Contacto", href: "#contacto" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-gray-500 hover:text-[#13193a] transition-colors font-medium"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Portal (solo para agentes/personal) */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Portal de agentes
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative bg-[#0d1128] pt-16 h-screen flex items-center overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-blue-600/6 blur-3xl" />
          <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/6 blur-3xl" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)",
              backgroundSize: "36px 36px",
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Texto */}
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-400/80 mb-6 border border-blue-400/20 px-3 py-1.5 rounded-full bg-blue-400/5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Agencia de seguros automotrices
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
              Tu protección,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                nuestra prioridad
              </span>
            </h1>
            <p className="text-base text-white/50 leading-relaxed mb-8 max-w-md">
              En COFISEM tramitamos tu póliza automotriz con las mejores
              aseguradoras del país. Rápido, transparente y con atención
              personalizada desde el primer día.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="#coberturas"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#13193a] text-sm font-bold hover:bg-gray-100 transition-all shadow-lg"
              >
                Tramita tu póliza
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
              <a
                href="#contacto"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white text-sm font-semibold hover:bg-white/5 transition-all"
              >
                Contáctanos
              </a>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10">
              {[
                { value: "4+", label: "Aseguradoras" },
                { value: "100%", label: "Digital" },
                { value: "4", label: "Oficinas" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/40 mt-0.5 font-medium">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Derecha: card original ── */}
          <div className="hidden lg:flex justify-center">
            <div className="relative w-full max-w-sm space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
                  ¿Qué cubre tu seguro?
                </p>
                <div className="space-y-3">
                  {[
                    "Daños a terceros",
                    "Robo total del vehículo",
                    "Daños materiales propios",
                    "Asistencia en carretera",
                    "Gastos médicos ocupantes",
                  ].map((label) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <svg
                          className="w-3 h-3 text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-white/70">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chip flotante */}
              <div className="absolute -top-4 -right-4 bg-emerald-500 rounded-2xl px-4 py-2.5 shadow-xl shadow-emerald-900/30">
                <p className="text-[10px] text-white/80 font-semibold uppercase tracking-wide">
                  Desde
                </p>
                <p className="text-lg font-bold text-white leading-none">
                  $550<span className="text-xs font-normal">/semanal</span>
                </p>
              </div>

              {/* Chips de tipo */}
              <div className="flex gap-2 flex-wrap">
                {["🚕 Taxi", "🚗 Personal", "📱 DIDI/UBER", "🚛 Carga"].map(
                  (t) => (
                    <span
                      key={t}
                      className="text-xs text-white/60 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-medium"
                    >
                      {t}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ASEGURADORAS
      ══════════════════════════════════════════ */}
      <section className="bg-gray-50 border-y border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">
            Trabajamos con las principales aseguradoras del país
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-20">
            {ASEGURADORAS.map((a) => (
              <img
                key={a.nombre}
                src={a.logo}
                alt={a.nombre}
                className={`${a.w} object-contain opacity-40 hover:opacity-70 grayscale hover:grayscale-0 transition-all duration-300`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COBERTURAS
      ══════════════════════════════════════════ */}
      <section id="coberturas" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">
              Nuestras pólizas
            </p>
            <h2 className="text-3xl font-bold text-[#13193a]">
              Cobertura para cada tipo de vehículo
            </h2>
            <p className="text-gray-400 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
              Sin importar si usas tu auto a diario, trabajas en plataformas
              digitales o tienes una flota comercial, tenemos el seguro que
              necesitas.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {COBERTURAS.map((c) => (
              <div
                key={c.tipo}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#13193a]/20 hover:shadow-lg transition-all duration-200 flex flex-col"
              >
                <div className="w-11 h-11 rounded-xl bg-[#13193a]/5 flex items-center justify-center text-[#13193a] mb-4 group-hover:bg-[#13193a] group-hover:text-white transition-all duration-200">
                  {c.icon}
                </div>
                <span
                  className={`self-start text-[10px] font-bold border px-2 py-0.5 rounded-full mb-3 ${c.tagColor}`}
                >
                  {c.tag}
                </span>
                <h3 className="text-sm font-bold text-[#13193a] mb-2">
                  {c.tipo}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed flex-1">
                  {c.desc}
                </p>
                <button className="mt-5 text-xs font-semibold text-[#13193a] hover:underline text-left flex items-center gap-1 group-hover:gap-2 transition-all">
                  Conocer más
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BENEFICIOS
      ══════════════════════════════════════════ */}
      <section id="beneficios" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">
              ¿Por qué elegirnos?
            </p>
            <h2 className="text-3xl font-bold text-[#13193a]">
              Beneficios de estar con COFISEM
            </h2>
            <p className="text-gray-400 text-sm mt-3 max-w-md mx-auto">
              No solo vendemos pólizas, te acompañamos durante toda la vigencia
              de tu seguro.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFICIOS.map((b) => (
              <div
                key={b.titulo}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all"
              >
                <p className="text-3xl mb-3">{b.icon}</p>
                <h3 className="text-sm font-bold text-[#13193a] mb-1.5">
                  {b.titulo}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CÓMO FUNCIONA
      ══════════════════════════════════════════ */}
      <section id="como-funciona" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">
              Proceso simple
            </p>
            <h2 className="text-3xl font-bold text-[#13193a]">
              Asegúrate en 4 pasos
            </h2>
            <p className="text-gray-400 text-sm mt-3 max-w-md mx-auto">
              Desde la cotización hasta la emisión de tu póliza, el proceso es
              rápido y sin complicaciones.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Línea conectora — solo desktop */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            {PASOS.map((p, i) => (
              <div key={p.num} className="text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-[#13193a] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#13193a]/15 relative z-10">
                  <span className="text-xs font-bold text-white/40">
                    {p.num}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#13193a] mb-2">
                  {p.titulo}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA CLIENTE
      ══════════════════════════════════════════ */}
      <section className="bg-[#13193a] py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-4">
            Empieza hoy
          </p>
          <h2 className="text-2xl font-bold text-white mb-3">
            ¿Listo para proteger tu vehículo?
          </h2>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
            Contáctanos y en minutos te damos una cotización personalizada sin
            compromiso con las mejores aseguradoras.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="#contacto"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-[#13193a] text-sm font-bold hover:bg-gray-100 transition-all shadow-lg"
            >
              Solicitar cotización
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
            <a
              href="tel:+527771234567"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-white/15 text-white text-sm font-semibold hover:bg-white/5 transition-all"
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
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
              Llamar ahora
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ÚNETE AL EQUIPO
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Texto */}
              <div className="p-10 lg:p-14">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-5">
                  Únete al equipo
                </span>
                <h2 className="text-2xl font-bold text-[#13193a] mb-3">
                  ¿Quieres ser agente COFISEM?
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Forma parte de nuestro equipo de asesores y vendedores.
                  Ofrecemos comisiones competitivas, capacitación continua y el
                  respaldo de las mejores aseguradoras del mercado.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    "Comisiones atractivas por cada póliza emitida",
                    "Capacitación y herramientas sin costo",
                    "Flexibilidad de horario",
                    "Apoyo de un equipo experimentado",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-xs text-gray-500">{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contacto"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-[#13193a] text-[#13193a] text-sm font-bold hover:bg-[#13193a] hover:text-white transition-all"
                >
                  Quiero ser agente
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </a>
              </div>

              {/* Decoración */}
              <div className="bg-[#0d1128] p-10 lg:p-14 flex flex-col justify-center">
                <div className="space-y-4">
                  {[
                    { label: "Comisión promedio por póliza", value: "8 – 15%" },
                    { label: "Aseguradoras disponibles", value: "4+" },
                    { label: "Oficinas de apoyo", value: "4 en Morelos" },
                    { label: "Modalidad", value: "Presencial / Remoto" },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0"
                    >
                      <p className="text-xs text-white/40">{r.label}</p>
                      <p className="text-sm font-bold text-white">{r.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer id="contacto" className="bg-[#0d1128] pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
            {/* Marca */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 text-white/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white/80">COFISEM</p>
                  <p className="text-[10px] text-white/30">
                    Seguros Automotrices
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/30 leading-relaxed">
                Agencia especializada en seguros automotrices con presencia en
                Morelos. Tramitamos tu póliza con las mejores aseguradoras del
                país.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
                Navegación
              </p>
              <div className="space-y-2.5">
                {[
                  "Coberturas",
                  "Beneficios",
                  "¿Cómo funciona?",
                  "Únete al equipo",
                ].map((l) => (
                  <a
                    key={l}
                    href="#"
                    className="block text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>

            {/* Contacto */}
            <div>
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
                Contacto
              </p>
              <div className="space-y-3">
                {[
                  { icon: "📞", text: "777 123 4567" },
                  { icon: "✉️", text: "contacto@cofisem.mx" },
                  { icon: "📍", text: "Cuernavaca, Morelos" },
                ].map((c) => (
                  <div key={c.text} className="flex items-center gap-2.5">
                    <span className="text-sm">{c.icon}</span>
                    <p className="text-xs text-white/30">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-[11px] text-white/20">
              © 2026 COFISEM · Todos los derechos reservados
            </p>
            <div className="flex gap-5">
              {["Aviso de privacidad", "Términos y condiciones"].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-[11px] text-white/20 hover:text-white/40 transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
