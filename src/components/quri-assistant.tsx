"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getQuriScript } from "../lib/quri-scripts";
import { QuriMascot } from "./quri-mascot";

type PlaybackState = "idle" | "loading" | "playing" | "paused";
type AudioSourceKind = "none" | "elevenlabs" | "browser" | "text-fallback";

type QuriAssistantProps = {
  river: string;
  theme?: "dark" | "light";
};

const STORAGE_MINIMIZED = "quri-nawi:quri-minimized:v1";

export function QuriAssistant({ river, theme = "dark" }: QuriAssistantProps) {
  const instanceId = useId();
  const script = getQuriScript(river);
  const transcriptId = useId();

  const [minimized, setMinimized] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const [sourceKind, setSourceKind] = useState<AudioSourceKind>("none");
  const [attribution, setAttribution] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeModeRef = useRef<"audio" | "speech" | null>(null);

  const stopAll = useCallback((clearNotice = true) => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (activeModeRef.current === "speech" && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    activeModeRef.current = null;
    setPlayback("idle");
    if (clearNotice) setNotice("");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    try {
      if (sessionStorage.getItem(STORAGE_MINIMIZED) === "1") setMinimized(true);
    } catch {
      // sessionStorage puede no estar disponible en modo restringido.
    }
    return () => media.removeEventListener("change", update);
  }, []);

  // Detiene cualquier audio activo al cambiar de río o desmontar el asistente.
  useEffect(() => {
    stopAll(true);
    setSourceKind("none");
    setAttribution(null);
    return () => stopAll(true);
  }, [river, stopAll]);

  // Evita que dos instancias (3D y 2D) reproduzcan al mismo tiempo.
  useEffect(() => {
    const onClaim = (event: Event) => {
      const owner = (event as CustomEvent<string>).detail;
      if (owner !== instanceId) stopAll(true);
    };
    window.addEventListener("quri:audio-claim", onClaim);
    return () => window.removeEventListener("quri:audio-claim", onClaim);
  }, [instanceId, stopAll]);

  function toggleMinimized(next: boolean) {
    setMinimized(next);
    try {
      sessionStorage.setItem(STORAGE_MINIMIZED, next ? "1" : "0");
    } catch {
      // Ignorar errores de almacenamiento de sesión.
    }
  }

  function activateTextFallback(reason: string) {
    stopAll(false);
    setSourceKind("text-fallback");
    setTranscriptOpen(true);
    setNotice(reason);
  }

  function startBrowserSpeech(fallbackNote: string): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      return false;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(script.transcript);
      utterance.lang = "es-BO";
      utterance.rate = 0.98;
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice =
        voices.find((voice) => voice.lang.toLowerCase().startsWith("es-bo"))
        ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("es-419") || voice.lang.toLowerCase().startsWith("es-la"))
        ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("es"));
      if (spanishVoice) utterance.voice = spanishVoice;

      utterance.onend = () => {
        activeModeRef.current = null;
        setPlayback("idle");
      };
      utterance.onerror = () => {
        activateTextFallback("No se pudo reproducir el audio en este dispositivo. Puedes leer el resumen completo abajo.");
      };

      activeModeRef.current = "speech";
      setSourceKind("browser");
      setAttribution(null);
      setNotice(fallbackNote);
      setPlayback("playing");
      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      return false;
    }
  }

  async function handlePlayOrResume() {
    window.dispatchEvent(new CustomEvent("quri:audio-claim", { detail: instanceId }));

    if (playback === "paused") {
      if (activeModeRef.current === "audio" && audioRef.current) {
        try {
          await audioRef.current.play();
          setPlayback("playing");
          return;
        } catch {
          activateTextFallback("No se pudo reanudar el audio. Tienes la transcripción disponible abajo.");
          return;
        }
      }
      if (activeModeRef.current === "speech" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
        setPlayback("playing");
        return;
      }
    }

    stopAll(true);
    setPlayback("loading");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const endpoint = `/api/quri-tts?rio=${encodeURIComponent(script.river)}&v=${encodeURIComponent(script.version)}`;
      const response = await fetch(endpoint, { signal: controller.signal });

      if (response.ok && (response.headers.get("content-type") ?? "").includes("audio/")) {
        const creditHeader = response.headers.get("x-quri-attribution");
        const blob = await response.blob();
        if (controller.signal.aborted) return;

        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        activeModeRef.current = "audio";

        audio.onended = () => {
          setPlayback("idle");
        };
        audio.onerror = () => {
          if (!startBrowserSpeech("El archivo de voz falló; escuchando con el lector del navegador.")) {
            activateTextFallback("No se pudo reproducir el audio. Puedes leer la transcripción completa abajo.");
          }
        };

        await audio.play();
        setSourceKind("elevenlabs");
        setAttribution(creditHeader || null);
        setNotice("");
        setPlayback("playing");
        return;
      }

      if (controller.signal.aborted) return;
      if (!startBrowserSpeech("Voz de estudio no disponible; reproduciendo resumen con voz local del navegador.")) {
        activateTextFallback("Audio no disponible en este momento. Puedes leer la transcripción completa a continuación.");
      }
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      if (!startBrowserSpeech("Sin conexión al servicio de voz; reproduciendo con voz local del navegador.")) {
        activateTextFallback("Audio no disponible sin conexión. Puedes leer la transcripción completa a continuación.");
      }
    }
  }

  function handlePause() {
    if (playback !== "playing") return;
    if (activeModeRef.current === "audio" && audioRef.current) {
      audioRef.current.pause();
      setPlayback("paused");
    } else if (activeModeRef.current === "speech" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setPlayback("paused");
    }
  }

  const isSpeaking = playback === "playing";

  if (minimized) {
    return (
      <div className={`quri-minimized-bar quri-theme-${theme}`}>
        <button
          type="button"
          className="quri-medallion-btn"
          onClick={() => toggleMinimized(false)}
          aria-label={`Mostrar ayuda de Quri para el río ${script.river}`}
        >
          <QuriMascot variant="medallion" speaking={isSpeaking} reducedMotion={reducedMotion} />
          <span>Quri · {isSpeaking ? "Reproduciendo resumen" : "Escuchar resumen"}</span>
        </button>
        {playback !== "idle" && (
          <button
            type="button"
            className="quri-ctrl-btn"
            onClick={() => stopAll(true)}
            aria-label="Detener audio de Quri"
          >
            ■ Detener
          </button>
        )}
      </div>
    );
  }

  return (
    <aside className={`quri-box quri-theme-${theme}`} aria-label={`Resumen de Quri para el río ${script.river}`}>
      <div className="quri-top">
        <div className="quri-avatar">
          <QuriMascot variant="bust" speaking={isSpeaking} reducedMotion={reducedMotion} />
        </div>
        <div className="quri-main">
          <div className="quri-head-row">
            <p className="quri-badge">
              <strong>Quri</strong>
              <span>{script.reviewStatus}</span>
            </p>
            <button
              type="button"
              className="quri-minimize-btn"
              onClick={() => toggleMinimized(true)}
              aria-label="Minimizar asistente Quri"
              title="Minimizar Quri"
            >
              Minimizar −
            </button>
          </div>

          <p className="quri-hint">{script.contextHint}</p>

          <div className="quri-controls">
            {playback === "playing" ? (
              <button type="button" className="quri-play-btn" onClick={handlePause}>
                <span aria-hidden="true">❚❚</span> Pausar
              </button>
            ) : (
              <button
                type="button"
                className="quri-play-btn"
                onClick={handlePlayOrResume}
                disabled={playback === "loading"}
              >
                <span aria-hidden="true">▶</span>{" "}
                {playback === "loading"
                  ? "Preparando audio…"
                  : playback === "paused"
                    ? "Continuar"
                    : `Escuchar resumen (${script.durationEstimate})`}
              </button>
            )}

            {playback !== "idle" && (
              <button type="button" className="quri-ctrl-btn" onClick={() => stopAll(true)}>
                <span aria-hidden="true">■</span> Detener
              </button>
            )}

            <button
              type="button"
              className="quri-ctrl-btn quri-transcript-toggle"
              aria-expanded={transcriptOpen}
              aria-controls={transcriptId}
              onClick={() => setTranscriptOpen(!transcriptOpen)}
            >
              {transcriptOpen ? "Ocultar texto" : "Leer transcripción"}
            </button>
          </div>

          {notice && (
            <p className="quri-notice" role="status" aria-live="polite">
              {notice}
            </p>
          )}
        </div>
      </div>

      {transcriptOpen && (
        <div className="quri-transcript" id={transcriptId}>
          <p className="quri-transcript-text">{script.transcript}</p>
          <div className="quri-meta">
            <span>Estado: {script.reviewStatus}</span>
            {sourceKind === "elevenlabs" && attribution && (
              <span>Voz sintetizada · {attribution}</span>
            )}
            {sourceKind === "browser" && (
              <span>Voz local del navegador</span>
            )}
          </div>
          {script.sources.length > 0 ? (
            <ul className="quri-sources" aria-label="Fuentes citadas en el guion">
              {script.sources.map((source) => (
                <li key={source.url}>
                  Fuente:{" "}
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="quri-empty-source">
              Sin fuentes registradas aún para este río ·{" "}
              <a href="#aportar">Proponer un estudio para revisión ↓</a>
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
