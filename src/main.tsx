import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/allura/latin-400.css";
import "./index.css";
import App from "./App.tsx";
import { registerSW } from "virtual:pwa-register";

// Busca versión nueva al abrir la app y cada vez que vuelve a primer plano (en iPhone, la app
// instalada no lo hace sola). Al encontrarla se instala y la página se recarga con ella.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const comprobar = () => reg.update().catch(() => {});
    document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && comprobar());
    setInterval(comprobar, 30 * 60 * 1000);
  },
});

// Si la app abierta es de una versión anterior, las partes que carga al usarlas (como la
// del Excel) ya no existen en la web y falla. Recargamos para traer la versión nueva.
// Solo una vez cada minuto, para no quedarnos recargando si el fallo es otro (sin conexión…).
window.addEventListener("vite:preloadError", (e) => {
  try {
    const ultima = Number(sessionStorage.getItem("tp.recarga") || 0);
    if (Date.now() - ultima < 60_000) return;
    sessionStorage.setItem("tp.recarga", String(Date.now()));
  } catch {
    return;
  }
  e.preventDefault();
  location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
