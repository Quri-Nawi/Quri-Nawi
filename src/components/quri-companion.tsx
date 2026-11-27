"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getQuriScript } from "../lib/quri-scripts";
import { QuriMascot } from "./quri-mascot";

type SectionKey = "inicio" | "explorar" | "comparar" | "metodo" | "aportar";
type FeaturedRiver = "Kaka" | "Beni" | "Madre de Dios";
type PlaybackState = "idle" | "loading" | "playing" | "paused";

const FEATURED_RIVERS: readonly FeaturedRiver[] = ["Kaka", "Beni", "Madre de Dios"];

const SECTION_CONTEXT: Record<
  SectionKey,
  {
    eyebrow: string;
    title: string;
    text: string;
    checklist?: readonly string[];
    actionLabel?: string;
    actionHref?: string;
    external?: boolean;
  }
> = {
  inicio: {
    eyebrow: "Portada 3D",
    title: "Explora un río con Quri",
    text: "Elige un río para escuchar su resumen de evidencia, separar muestreo de publicación y ver qué falta investigar.",
  },
  explorar: {
    eyebrow: "Atlas 2D",
    title: "Filtra y comprueba fuentes",
    text: "Puedes filtrar por territorio o tipo de muestra y escuchar el resumen del río sin salir de la lista.",
    actionLabel: "Ir al comparador ↓",
    actionHref: "#comparar",
  },
  comparar: {
    eyebrow: "Lectura comparada",
    title: "Antes de comparar dos fichas",
    text: "Dos valores solo son comparables si comparten matriz, método y unidad. En el Kaka ambos datos son de 1998 y vienen de la misma revisión.",
    checklist: [
      "Muestreo vs. publicación (ej. 1998 vs. 2025)",
      "Unidad, matriz y método analítico",
      "Precisión del lugar (tramo o mercado vs. captura)",
    ],
    actionLabel: "Volver al catálogo ↑",
    actionHref: "#explorar",
  },
  metodo: {
    eyebrow: "Método e interoperabilidad",
    title: "Cada dato conserva su origen",
    text: "Todas las fichas semilla enlazan a su fuente pública y se sirven también en JSON para consulta abierta y agentes.",
    actionLabel: "Abrir catálogo JSON ↗",
    actionHref: "/api/catalogo",
    external: true,
  },
  aportar: {
    eyebrow: "Ampliar el catálogo",
    title: "Cómo proponer un estudio",
    text: "Incluye un título claro, territorio y un DOI o enlace público https://. El borrador se guarda en tu navegador para revisión.",
    checklist: [
      "Enlace público https:// o DOI verificable",
      "Distinguir año de muestreo y publicación",
    ],
    actionLabel: "Explorar cuenca 3D ↑",
    actionHref: "#inicio",
  },
};

const STORAGE_COMPANION_OPEN = "quri-nawi:companion-open:v1";

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function QuriCompanion() {
  const instanceId = useId();
  const [section, setSection] = useState<SectionKey>("inicio");
  const [open, setOpen] = useState(false);
  const [heroRiver, setHeroRiver] = useState<string | null>(null);
  const [activeRiver, setActiveRiver] = useState<FeaturedRiver>("Kaka");
  const [externalSpeaking, setExternalSpeaking] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showText, setShowText] = useState(false);
  const [notice, setNotice] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const speechActiveRef = useRef(false);

  const script = getQuriScript(activeRiver);

  const stopAudio = useCallback((clearNotice = true) => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (speechActiveRef.current && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speechActiveRef.current = false;
    setPlayback("idle");
    setElapsed(0);
    setDuration(0);
    if (clearNotice) setNotice("");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const updateMotion = () => setReducedMotion(media.matches);
    media.addEventListener("change", updateMotion);

    try {
      if (sessionStorage.getItem(STORAGE_COMPANION_OPEN) === "1") setOpen(true);
    } catch {
      // Ignorar errores de almacenamiento.
    }

    const onRiverSelected = (event: Event) => {
      const detail = (event as CustomEvent<string | null>).detail;
      setHeroRiver(detail ?? null);
      if (detail === "Kaka" || detail === "Beni" || detail === "Madre de Dios") {
        setActiveRiver(detail);
      }
    };
    const onAreaSelected = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (detail === "Kaka" || detail === "Beni" || detail === "Madre de Dios") {
        setActiveRiver(detail);
      }
    };
    const onSpeaking = (event: Event) => {
      const detail = (event as CustomEvent<{ speaking: boolean }>).detail;
      setExternalSpeaking(Boolean(detail?.speaking));
    };
    const onClaim = (event: Event) => {
      const owner = (event as CustomEvent<string>).detail;
      if (owner !== instanceId) stopAudio(true);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("quri:river-selected", onRiverSelected);
    window.addEventListener("quri:area", onAreaSelected);
    window.addEventListener("quri:speaking", onSpeaking);
    window.addEventListener("quri:audio-claim", onClaim);
    window.addEventListener("keydown", onKeyDown);

    const targets: [SectionKey, HTMLElement | null][] = [
      ["inicio", document.querySelector(".basin-hero")],
      ["explorar", document.getElementById("explorar")],
      ["comparar", document.getElementById("comparar")],
      ["metodo", document.getElementById("metodo")],
      ["aportar", document.getElementById("aportar")],
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const matched = targets.find(([, node]) => node === visible.target);
        if (matched) setSection(matched[0]);
      },
      { threshold: [0.2, 0.45] },
    );

    for (const [, node] of targets) {
      if (node) observer.observe(node);
    }

    return () => {
      media.removeEventListener("change", updateMotion);
      window.removeEventListener("quri:river-selected", onRiverSelected);
      window.removeEventListener("quri:area", onAreaSelected);
      window.removeEventListener("quri:speaking", onSpeaking);
      window.removeEventListener("quri:audio-claim", onClaim);
      window.removeEventListener("keydown", onKeyDown);
      observer.disconnect();
      stopAudio(true);
    };
  }, [instanceId, stopAudio]);

  // Detiene audio si cambia el río elegido dentro del ojo.
  useEffect(() => {
    stopAudio(true);
  }, [activeRiver, stopAudio]);

  function toggleOpen(next: boolean) {
    setOpen(next);
    try {
      sessionStorage.setItem(STORAGE_COMPANION_OPEN, next ? "1" : "0");
    } catch {
      // Ignorar errores de almacenamiento.
    }
  }

  function focusRiverInMap(river: FeaturedRiver) {
    stopAudio(true);
    toggleOpen(false);
    window.dispatchEvent(new CustomEvent("quri:focus-river", { detail: river }));
    window.dispatchEvent(new CustomEvent("quri:area", { detail: river }));
  }

  function startBrowserFallback(msg: string) {
    if (typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(script.transcript);
        utterance.lang = "es-BO";
        utterance.onend = () => {
          speechActiveRef.current = false;
          setPlayback("idle");
        };
        utterance.onerror = () => {
          speechActiveRef.current = false;
          setPlayback("idle");
          setShowText(true);
          setNotice("Audio no disponible; puedes leer el texto completo abajo.");
        };
        speechActiveRef.current = true;
        setNotice(msg);
        setPlayback("playing");
        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        // Caer a modo texto.
      }
    }
    setPlayback("idle");
    setShowText(true);
    setNotice("Audio no disponible; puedes leer la transcripción completa abajo.");
  }

  async function handlePlayOrResume() {
    window.dispatchEvent(new CustomEvent("quri:audio-claim", { detail: instanceId }));

    if (playback === "paused") {
      if (audioRef.current) {
        await audioRef.current.play();
        setPlayback("playing");
        return;
      }
      if (speechActiveRef.current && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
        setPlayback("playing");
        return;
      }
    }

    stopAudio(true);
    setPlayback("loading");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const targetUrl = script.staticAudioPath ?? `/api/quri-tts?rio=${encodeURIComponent(script.river)}&v=${encodeURIComponent(script.version)}`;
      const res = await fetch(targetUrl, { signal: controller.signal });
      if (res.ok && (res.headers.get("content-type") ?? "").includes("audio/")) {
        const blob = await res.blob();
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onloadedmetadata = () => {
          if (Number.isFinite(audio.duration)) setDuration(audio.duration);
        };
        audio.ontimeupdate = () => {
          setElapsed(audio.currentTime);
          if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
        };
        audio.onended = () => {
          setPlayback("idle");
          setElapsed(0);
        };
        audio.onerror = () => startBrowserFallback("Reproduciendo con voz local del navegador.");
        await audio.play();
        setNotice("");
        setPlayback("playing");
        return;
      }
      if (!controller.signal.aborted) startBrowserFallback("Reproduciendo con voz local del navegador.");
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        startBrowserFallback("Sin conexión al audio; usando voz local.");
      }
    }
  }

  function handlePause() {
    if (playback !== "playing") return;
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayback("paused");
    } else if (speechActiveRef.current && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setPlayback("paused");
    }
  }

  // En portada 3D con río enfocado ya se muestra el panel principal de Quri.
  if (section === "inicio" && heroRiver) return null;

  const info = SECTION_CONTEXT[section];
  const inHero = section === "inicio";
  const isSpeaking = playback === "playing" || externalSpeaking;
  const isAudioActive = playback === "playing" || playback === "paused";
  const progressPct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

  return (
    <aside
      className={"quri-companion" + (open ? " is-open" : "") + (inHero ? " in-hero" : "")}
      aria-label="Asistente Quri"
    >
      <button
        type="button"
        className={"quri-companion-orb" + (isSpeaking ? " is-speaking" : "")}
        onClick={() => toggleOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Cerrar asistente Quri" : "Abrir asistente Quri"}
        title={open ? "Cerrar Quri" : "Abrir Quri · guía y resúmenes"}
      >
        <QuriMascot variant="medallion" speaking={isSpeaking} reducedMotion={reducedMotion} />
      </button>

      {open && (
        <div className="quri-companion-bubble" role="dialog" aria-label={`Quri: ${info.title}`}>
          <div className="quri-companion-hero">
            <div className={"quri-portrait quri-portrait-mini" + (isSpeaking ? " is-speaking" : "")}>
              <QuriMascot variant="bust" speaking={isSpeaking} reducedMotion={reducedMotion} />
            </div>
            <div className="quri-companion-title">
              <p className="quri-companion-eyebrow">{info.eyebrow}</p>
              <strong>{info.title}</strong>
            </div>
            <button
              type="button"
              className="quri-companion-close"
              onClick={() => toggleOpen(false)}
              aria-label="Cerrar asistente Quri"
            >
              ×
            </button>
          </div>

          <p className="quri-companion-copy">{info.text}</p>

          {info.checklist && (
            <ul className="quri-companion-checks">
              {info.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          {/* Mini reproductor de ríos integrado en el ojo */}
          <div className="quri-companion-player">
            <div className="quri-companion-rivers" role="group" aria-label="Elegir río para escuchar">
              {FEATURED_RIVERS.map((river) => (
                <button
                  key={river}
                  type="button"
                  aria-pressed={activeRiver === river}
                  onClick={() => setActiveRiver(river)}
                >
                  {river}
                </button>
              ))}
            </div>

            {isAudioActive && (
              <div className="quri-progress" aria-hidden="true">
                <div
                  className={"quri-progress-fill" + (duration === 0 ? " is-indeterminate" : "")}
                  style={duration > 0 ? { width: `${progressPct}%` } : undefined}
                />
              </div>
            )}

            <div className="quri-companion-controls">
              {playback === "playing" ? (
                <button type="button" className="quri-play-btn" onClick={handlePause}>
                  ❚❚ Pausar {duration > 0 ? `(${formatSeconds(elapsed)})` : ""}
                </button>
              ) : (
                <button
                  type="button"
                  className="quri-play-btn"
                  onClick={handlePlayOrResume}
                  disabled={playback === "loading"}
                >
                  ▶ {playback === "loading" ? "Cargando…" : playback === "paused" ? "Continuar" : `Escuchar ${activeRiver}`}
                </button>
              )}

              {playback !== "idle" && (
                <button type="button" className="quri-ctrl-btn" onClick={() => stopAudio(true)} aria-label="Detener audio">
                  ■
                </button>
              )}

              <button
                type="button"
                className="quri-ctrl-btn"
                aria-expanded={showText}
                onClick={() => setShowText(!showText)}
              >
                {showText ? "Ocultar" : "Texto"}
              </button>

              <button
                type="button"
                className="quri-companion-map-btn"
                onClick={() => focusRiverInMap(activeRiver)}
              >
                Ver 3D ↗
              </button>
            </div>

            {notice && <p className="quri-notice" role="status">{notice}</p>}

            {showText && (
              <div className="quri-companion-transcript">
                <p>{script.transcript}</p>
                <span>{script.reviewStatus}</span>
              </div>
            )}
          </div>

          {info.actionLabel && info.actionHref && (
            <div className="quri-companion-footer">
              <a
                href={info.actionHref}
                target={info.external ? "_blank" : undefined}
                rel={info.external ? "noreferrer" : undefined}
                onClick={info.external ? undefined : () => toggleOpen(false)}
              >
                {info.actionLabel}
              </a>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
