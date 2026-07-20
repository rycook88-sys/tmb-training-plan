import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initTheme } from "@/components/ThemeSwitcher";

// Apply stored theme immediately on load
initTheme();

createRoot(document.getElementById("root")!).render(<App />);

// Register PWA service worker for offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(
      (registration) => {
        console.log("[PWA] Service worker registered:", registration.scope);
        setInterval(() => registration.update(), 60 * 60 * 1000);
      },
      (error) => {
        console.warn("[PWA] Service worker registration failed:", error);
      }
    );
  });
}
