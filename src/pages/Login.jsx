// ============================================================
// src/pages/Login.jsx — RESPONSIVE
// Desktop: split carrusel + formulario
// Mobile:  formulario centrado con logo y fondo sutil
// ============================================================
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const CAROUSEL_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80",
    alt: "Conductor manejando",
  },
  {
    src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
    alt: "Automóvil moderno",
  },
  {
    src: "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=800&q=80",
    alt: "Carretera al atardecer",
  },
];

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
        setFadeIn(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: usuario,
      password: contrasena,
    });

    setLoading(false);

    if (authError) {
      if (authError.message.includes("Invalid login credentials")) {
        setError("Usuario o contraseña incorrectos.");
      } else if (authError.message.includes("Email not confirmed")) {
        setError("Debes confirmar tu correo antes de ingresar.");
      } else {
        setError("Ocurrió un error. Intenta de nuevo.");
      }
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-[#0f1629]">
      {/* ── IZQUIERDA: carrusel (solo desktop) ── */}
      <div className="hidden md:flex w-1/2 h-screen items-center justify-center bg-[#1a2340]">
        <div className="relative w-[80%] h-[90%] rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={CAROUSEL_IMAGES[currentSlide].src}
            alt={CAROUSEL_IMAGES[currentSlide].alt}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: fadeIn ? 1 : 0 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a2340]/60 via-transparent to-transparent" />
          {/* Indicadores */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {CAROUSEL_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentSlide(i);
                  setFadeIn(true);
                }}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === currentSlide ? "20px" : "8px",
                  backgroundColor:
                    i === currentSlide ? "white" : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </div>
          {/* Brand overlay */}
          <div className="absolute top-6 left-6">
            <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">
              Cofisem
            </p>
            <p className="text-white/40 text-[11px] mt-0.5">
              Sistema de Gestión de Seguros
            </p>
          </div>
        </div>
      </div>

      {/* ── DERECHA / MOBILE: formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 min-h-screen">
        {/* Logo + nombre */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-lg">
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
              <path
                d="M12 24C12 17.373 17.373 12 24 12C30.627 12 36 17.373 36 24C36 30.627 30.627 36 24 36"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M24 36C20 36 16 32 16 28C16 24 20 20 24 20"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="24" cy="24" r="3" fill="white" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-white font-bold text-2xl tracking-tight">
              Cofisem
            </h1>
            <p className="text-white/40 text-xs mt-0.5">Gestión de Seguros</p>
          </div>
        </div>

        {/* Card formulario */}
        <div className="w-full max-w-sm">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 shadow-2xl">
            <h2 className="text-white text-lg font-semibold mb-6 text-center">
              Iniciar sesión
            </h2>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value);
                    setError("");
                  }}
                  placeholder="correo@empresa.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-white hover:bg-white/90 active:scale-[0.98] text-[#13193a] font-bold text-sm tracking-wide transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-white/20 text-xs mt-6">
            © 2026 Cofisem · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
