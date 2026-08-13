import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Landmark, ShieldCheck, Smartphone } from "lucide-react";
import cofisemLogo from "../assets/cofisem_logo.png";
import cofisemLogoBlanco from "../assets/cofisem_logo_blanco.png";
import logoQualitas from "../assets/logo_qualitas.png";
import logoAna from "../assets/logo_ana.png";
import logoHDI from "../assets/logo_hdi.png";
import logoBanorte from "../assets/logo_banorte.png";
import slider1 from "../assets/slider/slider-1.jpg";
import slider2 from "../assets/slider/slider-2.jpg";
import slider3 from "../assets/slider/slider-3.jpg";
import slider4 from "../assets/slider/slider-4.jpg";

const ASEGURADORAS = [
  { logo: logoQualitas, nombre: "Quálitas", w: "h-8" },
  { logo: logoAna, nombre: "ANA Seguros", w: "h-7" },
  { logo: logoHDI, nombre: "HDI Seguros", w: "h-8" },
  { logo: logoBanorte, nombre: "Banorte Seguros", w: "h-7" },
];

const SLIDES = [
  {
    img: slider1,
    titulo: "Asistencia oportuna",
    desc: "Ajustadores calificados en el lugar del siniestro, cuando más lo necesitas.",
  },
  {
    img: slider2,
    titulo: "El mejor acuerdo",
    desc: "La cobertura ideal con la inversión más conveniente para ti.",
  },
  {
    img: slider3,
    titulo: "Seguridad anti-fraude",
    desc: "Verificación en línea con elementos anti-fraude en cada póliza.",
  },
  {
    img: slider4,
    titulo: "Asistencia 7x24",
    desc: "Cabina y atención a clientes las 24 horas, los 7 días de la semana.",
  },
];

const BENEFICIOS = [
  {
    icon: Zap,
    titulo: "Trámite en minutos",
    desc: "Cotiza y emite tu póliza el mismo día, sin papeleo excesivo.",
  },
  {
    icon: Landmark,
    titulo: "Múltiples aseguradoras",
    desc: "Comparamos entre Quálitas, ANA, HDI y Banorte por ti.",
  },
  {
    icon: ShieldCheck,
    titulo: "Atención a siniestros",
    desc: "Te acompañamos desde el reporte hasta la resolución.",
  },
  {
    icon: Smartphone,
    titulo: "Gestión 100% digital",
    desc: "Consulta tu póliza y pagos desde cualquier dispositivo.",
  },
];

const VALORES = [
  { titulo: "Justicia", desc: "Objetividad para dar a cada quien lo que le corresponde." },
  { titulo: "Responsabilidad", desc: "Compromiso con los objetivos de nuestros clientes." },
  { titulo: "Honestidad", desc: "Trato ético que genera confianza y preferencia." },
  { titulo: "Productividad", desc: "Máxima efectividad, sin desperdicios." },
  { titulo: "Creatividad", desc: "Innovación y mejora continua en cada proceso." },
];

function CheckIcon({ className = "w-3 h-3" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function Carrusel() {
  const [activo, setActivo] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActivo((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full h-72 sm:h-96 lg:h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
      {SLIDES.map((s, i) => (
        <img
          key={s.titulo}
          src={s.img}
          alt={s.titulo}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === activo ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      <button
        onClick={() => setActivo((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        aria-label="Anterior"
        className="absolute top-1/2 left-3 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => setActivo((i) => (i + 1) % SLIDES.length)}
        aria-label="Siguiente"
        className="absolute top-1/2 right-3 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300/80 mb-1">
          0{activo + 1}
        </p>
        <h3 className="text-lg font-bold text-white mb-1">{SLIDES[activo].titulo}</h3>
        <p className="text-xs text-white/60 leading-relaxed max-w-sm">{SLIDES[activo].desc}</p>

        <div className="flex items-center gap-1.5 mt-4">
          {SLIDES.map((s, i) => (
            <button
              key={s.titulo}
              onClick={() => setActivo(i)}
              aria-label={`Ir a ${s.titulo}`}
              className={`h-1.5 rounded-full transition-all ${
                i === activo ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PaginaLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={cofisemLogo} alt="" className="h-9 w-auto object-contain shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#1447e6] leading-none tracking-tight">COFISEM</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">Seguros Automotrices</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7">
            {[
              { label: "Nosotros", href: "#nosotros" },
              { label: "Beneficios", href: "#beneficios" },
              { label: "Contacto", href: "#contacto" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="text-sm text-gray-500 hover:text-[#1447e6] transition-colors font-medium">
                {l.label}
              </a>
            ))}
          </div>

          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1447e6] text-white text-sm font-semibold hover:bg-[#0f36b3] transition-all shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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

      {/* HERO + CARRUSEL */}
      <section className="relative bg-[#0a2472] pt-28 pb-16 lg:pt-16 lg:pb-0 lg:h-screen lg:max-h-screen overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-blue-600/6 blur-3xl" />
          <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/6 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 flex flex-col lg:flex-row gap-10 lg:gap-14 lg:h-full lg:py-10">
          <div className="w-full lg:w-1/2 lg:flex lg:flex-col lg:justify-center">
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
              Tramitamos tu póliza automotriz con las mejores aseguradoras del país. Rápido, transparente y con
              atención personalizada desde el primer día.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-10">
              <a
                href="#contacto"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1447e6] text-sm font-bold hover:bg-gray-100 transition-all shadow-lg"
              >
                Tramita tu póliza
                <ArrowIcon />
              </a>
              <a
                href="#contacto"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white text-sm font-semibold hover:bg-white/5 transition-all"
              >
                Contáctanos
              </a>
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-white/10">
              {[
                { value: "4+", label: "Aseguradoras" },
                { value: "100%", label: "Digital" },
                { value: "4", label: "Oficinas" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/40 mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/2 lg:h-full lg:py-4">
            <Carrusel />
          </div>
        </div>
      </section>

      {/* ASEGURADORAS */}
      <section className="bg-gray-50 border-y border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
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

      {/* NOSOTROS */}
      <section id="nosotros" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">Quiénes somos</p>
              <h2 className="text-3xl font-bold text-[#1447e6] mb-4">Experiencia que respalda tu tranquilidad</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Somos una empresa mexicana especializada en seguros automotrices para vehículos particulares y de
                servicio público. Nuestra experiencia, solidez y compromiso nos impulsan a ofrecer siempre la mejor
                calidad de servicio, apoyados en tecnología de punta y personal altamente capacitado.
              </p>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-[#1447e6] mb-2">Misión</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Ser un equipo comprometido con México, integrado por el mejor capital humano, dedicado a cuidar y
                  administrar de la manera más eficaz el patrimonio de nuestros clientes.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-[#1447e6] mb-2">Visión</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Ser líderes del sector asegurador en el ramo de autos particulares y de servicio público, con
                  rentabilidad y en beneficio de nuestros clientes y colaboradores.
                </p>
              </div>

              <div className="sm:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-[#1447e6] mb-4">Valores</h3>
                <div className="flex flex-wrap gap-2">
                  {VALORES.map((v) => (
                    <span
                      key={v.titulo}
                      title={v.desc}
                      className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full cursor-default hover:border-[#1447e6]/20 hover:text-[#1447e6] transition-colors"
                    >
                      {v.titulo}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section id="beneficios" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">¿Por qué elegirnos?</p>
            <h2 className="text-3xl font-bold text-[#1447e6]">Beneficios de estar con COFISEM</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFICIOS.map((b) => (
              <div key={b.titulo} className="bg-gray-50 rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-xl bg-[#1447e6] flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-sm font-bold text-[#1447e6] mb-1.5">{b.titulo}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA CLIENTE + AGENTE */}
      <section className="bg-[#1447e6] py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="text-center lg:text-left lg:border-r lg:border-white/10 lg:pr-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-3">Empieza hoy</p>
            <h2 className="text-2xl font-bold text-white mb-3">¿Listo para proteger tu vehículo?</h2>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              Contáctanos y en minutos te damos una cotización personalizada sin compromiso.
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1447e6] text-sm font-bold hover:bg-gray-100 transition-all shadow-lg"
              >
                Solicitar cotización
                <ArrowIcon />
              </a>
              <a
                href="tel:+527771234567"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white text-sm font-semibold hover:bg-white/5 transition-all"
              >
                Llamar ahora
              </a>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-3">Únete al equipo</p>
            <h2 className="text-2xl font-bold text-white mb-3">¿Quieres ser agente COFISEM?</h2>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              Comisiones competitivas, capacitación continua y el respaldo de las mejores aseguradoras del mercado.
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap mb-6">
              {["Comisiones 8–15%", "Capacitación sin costo", "Horario flexible"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 text-xs text-white/60 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"
                >
                  <CheckIcon className="w-3 h-3 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
            <a
              href="#contacto"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-white text-white text-sm font-bold hover:bg-white hover:text-[#1447e6] transition-all"
            >
              Quiero ser agente
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className="bg-[#0a2472] pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img src={cofisemLogoBlanco} alt="" className="h-8 w-auto object-contain shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white/80">COFISEM</p>
                  <p className="text-[10px] text-white/30">Seguros Automotrices</p>
                </div>
              </div>
              <p className="text-xs text-white/30 leading-relaxed">
                Agencia especializada en seguros automotrices con presencia en Morelos.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Navegación</p>
              <div className="space-y-2.5">
                {[
                  { label: "Nosotros", href: "#nosotros" },
                  { label: "Beneficios", href: "#beneficios" },
                  { label: "Contacto", href: "#contacto" },
                ].map((l) => (
                  <a key={l.label} href={l.href} className="block text-xs text-white/30 hover:text-white/60 transition-colors">
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Contacto</p>
              <div className="space-y-3">
                {[
                  { icon: "📞", text: "777 123 4567" },
                  { icon: "✉️", text: "ventas1@grupocofisem.com" },
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
            <p className="text-[11px] text-white/20">© 2026 COFISEM · Todos los derechos reservados</p>
            <div className="flex gap-5">
              {["Aviso de privacidad", "Términos y condiciones"].map((l) => (
                <a key={l} href="#" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
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
