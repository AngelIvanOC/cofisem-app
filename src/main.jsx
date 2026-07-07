import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { initAuth } from "./auth.js";

// Si un chunk lazy-loaded queda referenciando un hash de un deploy
// anterior (deploy nuevo en Netlify mientras la pestaña sigue abierta),
// la carga del módulo falla. Recargamos para obtener el index.html
// y los hashes de assets vigentes.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

// Inicializar auth ANTES de montar React
initAuth().then(() => {
  createRoot(document.getElementById("root")).render(<App />);
});