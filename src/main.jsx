import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { initAuth } from "./auth.js";

// Inicializar auth ANTES de montar React
initAuth().then(() => {
  createRoot(document.getElementById("root")).render(<App />);
});