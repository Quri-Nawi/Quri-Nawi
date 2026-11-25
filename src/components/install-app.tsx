"use client";

import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallApp() {
  const [available, setAvailable] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    setInstalled(standalone.matches);
    const registerPrompt = (event: Event) => {
      event.preventDefault();
      setAvailable(event as InstallEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setAvailable(null);
    };
    window.addEventListener("beforeinstallprompt", registerPrompt);
    window.addEventListener("appinstalled", markInstalled);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then(() => setOfflineReady(true))
        .catch(() => setOfflineReady(false));
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", registerPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  async function install() {
    if (!available) {
      dialog.current?.showModal();
      return;
    }
    try {
      const answer = await available.prompt();
      if (answer.outcome === "accepted") setInstalled(true);
    } catch {
      dialog.current?.showModal();
    } finally {
      setAvailable(null);
    }
  }

  return <>
    <button className="install-button" type="button" onClick={install}><span aria-hidden="true">↓</span> {installed ? "App instalada" : "Instalar app"}</button>
    <dialog ref={dialog} aria-labelledby="install-title">
      <div className="dialog-head"><h2 id="install-title">Instalar Curinawi</h2><form method="dialog"><button type="submit" aria-label="Cerrar instalación">×</button></form></div>
      <p>{installed ? "Ya puedes abrir Curinawi desde tu pantalla de inicio." : "Abre el menú del navegador y selecciona Instalar aplicación. En Safari para iPhone, usa Compartir y luego Añadir a pantalla de inicio."}</p>
      <p role="status">{offlineReady ? "El catálogo de esta versión está preparado para consulta sin conexión." : "Abre la aplicación en línea para preparar la consulta sin conexión."}</p>
    </dialog>
  </>;
}
