import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ErrorBoundary } from "./components/error-boundary";

function PWASetup() {
  useEffect(() => {
    // ─── Inject manifest link ───
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "/manifest.json";
      document.head.appendChild(link);
    }

    // ─── Theme color meta ───
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = "#8DB596";
      document.head.appendChild(meta);
    }

    // ─── Apple-specific PWA meta ───
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const appleMeta = document.createElement("meta");
      appleMeta.name = "apple-mobile-web-app-capable";
      appleMeta.content = "yes";
      document.head.appendChild(appleMeta);
    }
    if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
      const appleStatus = document.createElement("meta");
      appleStatus.name = "apple-mobile-web-app-status-bar-style";
      appleStatus.content = "default";
      document.head.appendChild(appleStatus);
    }
    if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
      const appleTitle = document.createElement("meta");
      appleTitle.name = "apple-mobile-web-app-title";
      appleTitle.content = "Листик";
      document.head.appendChild(appleTitle);
    }

    // ─── Register Service Worker ───
    // Skip in iframes (Figma preview, embedded contexts) — avoids AbortError
    const isInIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();

    if (!isInIframe && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[PWA] Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          // Non-fatal: app works without SW
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }
  }, []);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <PWASetup />
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}