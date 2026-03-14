import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

// ============================================================
// 📁 IMÁGENES DEL CARRUSEL
// Reemplaza con tus imágenes locales: "/images/foto1.jpg"
// ============================================================
const CAROUSEL_IMAGES = [
  { src: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80", alt: "Conductor manejando" },
  { src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80", alt: "Automóvil moderno" },
  { src: "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=800&q=80", alt: "Carretera al atardecer" },
];
// ============================================================

export default function Login({ onLoginSuccess }) {
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

    const { data, error: authError } = await supabase.auth.signInWithPassword({
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
      return;
    }

    // ✅ Login exitoso
window.location.href = "/dashboard"; // Redirige a la página principal};
  }
  return (
    <div className="flex h-screen w-screen overflow-hidden">

      {/* ── IZQUIERDA ── */}
      <div className="w-1/2 h-full bg-[#1a2340] flex items-center justify-center">
        <div className="relative w-[80%] h-[90%] rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={CAROUSEL_IMAGES[currentSlide].src}
            alt={CAROUSEL_IMAGES[currentSlide].alt}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: fadeIn ? 1 : 0 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a2340]/60 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {CAROUSEL_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentSlide(i); setFadeIn(true); }}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === currentSlide ? "20px" : "8px",
                  backgroundColor: i === currentSlide ? "white" : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── DERECHA ── */}
      <div className="w-1/2 h-full bg-white flex flex-col items-center justify-center px-12">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full border-2 border-gray-200 shadow-md flex items-center justify-center bg-white overflow-hidden">
            {/*
              📁 LOGO: <img src="/images/logo.png" alt="Grupo Cofisem" className="w-14 h-14 object-contain" />
            */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M12 24C12 17.373 17.373 12 24 12C30.627 12 36 17.373 36 24C36 30.627 30.627 36 24 36" stroke="#1a2340" strokeWidth="3" strokeLinecap="round"/>
              <path d="M24 36C20 36 16 32 16 28C16 24 20 20 24 20" stroke="#3b5bdb" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="3" fill="#1a2340"/>
            </svg>
          </div>
        </div>

        {/* Tarjeta flotante */}
        <div
          className="w-full max-w-sm border border-gray-100 rounded-2xl shadow-2xl shadow-gray-300/100 flex flex-col justify-around px-8"
          style={{ height: "70vh" }}
        >
          <h1 className="text-2xl font-semibold text-[#1a2340] mb-6 tracking-tight text-center">
            Login
          </h1>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4" style={{height: "50%"}}>
            <div>
              <label className="block text-sm font-medium text-[#1a2340] mb-1.5">
                Usuario
              </label>
              <input
                type="email"
                value={usuario}
                onChange={(e) => { setUsuario(e.target.value); setError(""); }}
                placeholder="correo@empresa.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a2340]/30 focus:border-[#1a2340] transition-all duration-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2340] mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => { setContrasena(e.target.value); setError(""); }}
                placeholder="Ingresa tu contraseña"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a2340]/30 focus:border-[#1a2340] transition-all duration-200 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#1a2340] hover:bg-[#253060] active:scale-[0.98] text-white font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Ingresando...
                </>
              ) : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}