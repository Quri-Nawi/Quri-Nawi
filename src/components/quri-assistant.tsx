"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getQuriScript } from "../lib/quri-scripts";
import { QuriMascot } from "./quri-mascot";

type PlaybackState = "idle" | "loading" | "playing" | "paused";
type AudioSourceKind = "none" | "static" | "elevenlabs" | "browser" | "text-fallback";

type QuriAssistantProps = {
  river: string;
  theme?: "dark" | "light";
  layout?: "river-panel" | "card";
  studyCount?: number;
  onBack?: () => void;
  onShowInList?: () => void;
  onSpeakingChange?: (speaking: boolean) => void;
};

const STORAGE_MINIMIZED = "quri-nawi:quri-minimized:v1";

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function QuriAssistant({
  river,
  theme = "dark",
  layout = "card",
  studyCount,
  onBack,
  onShowInList,
  onSpeakingChange,
}: QuriAssistantProps) {
  const instanceId = useId();
  const transcriptId = useId();
  const script = getQuriScript(river);

  const [minimized, setMinimized] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const [sourceKind, setSourceKind] = useState<AudioSourceKind>("none");
  const [attribution, setAttribution] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

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
    if (activeModeRef.current === "speech" && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    activeModeRef.current = null;
    setPlayback("idle");
    setElapsed(0);
    setDuration(0);
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
      // sessionStorage puede no estar disponible.
    }
    return () => media.removeEventListener("change", update);
  }, []);

  // Detiene cualquier audio activo y cierra transcripción al cambiar de río o desmontar.
  useEffect(() => {
    stopAll(true);
    setSourceKind("none");
    setAttribution(null);
    setTranscriptOpen(false);
    return () => stopAll(true);
  }, [river, stopAll]);

  // Evita superposición de audio entre vista 3D y vista 2D.
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
      // Ignorar errores de almacenamiento.
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

  async function playAudioBlob(
    blob: Blob,
    kind: "static" | "elevenlabs",
    credit: string | null,
    signal: AbortSignal,
  ): Promise<boolean> {
    if (signal.aborted) return false;
    const url = URL.createObjectURL(blob);
    objectUrlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    activeModeRef.current = "audio";

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
    audio.onerror = () => {
      if (!startBrowserSpeech("El audio falló; reproduciendo con voz local del dispositivo.")) {
        activateTextFallback("No se pudo reproducir el audio. Puedes leer la transcripción completa.");
      }
    };

    await audio.play();
    setSourceKind(kind);
    setAttribution(credit);
    setNotice("");
    setPlayback("playing");
    return true;
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
          activateTextFallback("No se pudo reanudar el audio. Puedes leer el texto completo.");
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
      // 1. Intentar MP3 pre-generado versionado en public/audio/ (rápido y compatible con PWA offline).
      if (script.staticAudioPath) {
        const staticRes = await fetch(script.staticAudioPath, { signal: controller.signal });
        if (staticRes.ok && (staticRes.headers.get("content-type") ?? "").includes("audio/")) {
          const blob = await staticRes.blob();
          if (blob.size > 0 && await playAudioBlob(blob, "static", null, controller.signal)) return;
        }
      }

      // 2. Intentar síntesis controlada en servidor (/api/quri-tts con ElevenLabs y caché).
      const endpoint = `/api/quri-tts?rio=${encodeURIComponent(script.river)}&v=${encodeURIComponent(script.version)}`;
      const response = await fetch(endpoint, { signal: controller.signal });

      if (response.ok && (response.headers.get("content-type") ?? "").includes("audio/")) {
        const creditHeader = response.headers.get("x-quri-attribution");
        const blob = await response.blob();
        if (blob.size > 0 && await playAudioBlob(blob, "elevenlabs", creditHeader || null, controller.signal)) return;
      }

      if (controller.signal.aborted) return;
      if (!startBrowserSpeech("Audio pregrabado no disponible; usando voz local del navegador.")) {
        activateTextFallback("Audio no disponible en este momento. Puedes leer la transcripción completa.");
      }
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      if (!startBrowserSpeech("Sin conexión al servicio de voz; usando voz local del navegador.")) {
        activateTextFallback("Audio no disponible sin conexión. Puedes leer la transcripción completa.");
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

  const onSpeakingRef = useRef(onSpeakingChange);
  onSpeakingRef.current = onSpeakingChange;

  const isSpeaking = playback === "playing";
  const isAudioActive = playback === "playing" || playback === "paused";
  const progressPct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

  useEffect(() => {
    onSpeakingRef.current?.(isSpeaking);
    window.dispatchEvent(new CustomEvent("quri:speaking", { detail: { speaking: isSpeaking, river } }));
  }, [isSpeaking, river]);

  useEffect(() => {
    return () => {
      onSpeakingRef.current?.(false);
      window.dispatchEvent(new CustomEvent("quri:speaking", { detail: { speaking: false, river } }));
    };
  }, [river]);

  const transcriptContent = (
    <div className="quri-transcript-body" id={transcriptId}>
      <div className="quri-sheet-head">
        <strong>Resumen de Quri · Río {script.river}</strong>
        <button
          type="button"
          className="quri-sheet-close"
          onClick={() => setTranscriptOpen(false)}
          aria-label="Cerrar transcripción"
        >
          ×
        </button>
      </div>
      <p className="quri-transcript-text">{script.transcript}</p>
      <div className="quri-meta">
        <span>{script.reviewStatus}</span>
        {sourceKind === "elevenlabs" && attribution && <span>Voz sintetizada · {attribution}</span>}
        {sourceKind === "static" && <span>Audio neural pregrabado ({script.version})</span>}
        {sourceKind === "browser" && <span>Voz local del navegador</span>}
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
          Faltan fichas en este catálogo para este río ·{" "}
          <a href="#aportar">Proponer un estudio para revisión ↓</a>
        </p>
      )}
    </div>
  );

  // Diseño unificado para la portada 3D: Quri ES el presentador del .river-panel (sin caja anidada).
  if (layout === "river-panel") {
    const countLabel = studyCount
      ? `${studyCount === 1 ? "1 ficha" : `${studyCount} fichas`} en el catálogo`
      : "Faltan fichas en este catálogo";

    return (
      <div className="river-panel-wrap">
        {transcriptOpen && (
          <div className="quri-sheet" role="region" aria-label={`Transcripción de Quri para el río ${script.river}`}>
            {transcriptContent}
          </div>
        )}
        <div className={"river-panel quri-river-panel" + (minimized ? " is-minimized" : "")} role="region" aria-label={"Río " + script.river}>
          {!minimized && (
            <div className={"quri-portrait" + (isSpeaking ? " is-speaking" : "")}>
              <QuriMascot variant="bust" speaking={isSpeaking} reducedMotion={reducedMotion} />
            </div>
          )}

          <div className="quri-panel-content">
            <div className="quri-panel-top">
              <p className="eyebrow">
                {countLabel} · <span>Quri {script.version}</span>
              </p>
              <button
                type="button"
                className="quri-min-toggle"
                onClick={() => toggleMinimized(!minimized)}
                aria-label={minimized ? "Mostrar personaje Quri" : "Minimizar personaje Quri"}
              >
                {minimized ? (
                  <>
                    <QuriMascot variant="medallion" speaking={isSpeaking} reducedMotion={reducedMotion} />
                    <span>Mostrar Quri</span>
                  </>
                ) : (
                  <span>Minimizar −</span>
                )}
              </button>
            </div>

            <div className="quri-title-line">
              <h2>Río {script.river}</h2>
              {isAudioActive && duration > 0 && (
                <span className="quri-time" aria-live="off">
                  {formatSeconds(elapsed)} / {formatSeconds(duration)}
                </span>
              )}
            </div>

            <p className="quri-hint">{script.contextHint}</p>

            {isAudioActive && (
              <div className="quri-progress" aria-hidden="true">
                <div
                  className={"quri-progress-fill" + (duration === 0 ? " is-indeterminate" : "")}
                  style={duration > 0 ? { width: `${progressPct}%` } : undefined}
                />
              </div>
            )}

            <div className="quri-panel-actions">
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
                    ? "Cargando…"
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
                className="quri-ctrl-btn"
                aria-expanded={transcriptOpen}
                aria-controls={transcriptId}
                onClick={() => setTranscriptOpen(!transcriptOpen)}
              >
                {transcriptOpen ? "Ocultar texto" : "Leer texto"}
              </button>

              <span className="quri-divider" aria-hidden="true" />

              {studyCount ? (
                <button type="button" className="quri-link-btn" onClick={onShowInList}>
                  Ver en lista ↓
                </button>
              ) : (
                <a className="quri-link-btn" href="#aportar">
                  Proponer estudio ↓
                </a>
              )}

              {onBack && (
                <button type="button" className="quri-link-btn" onClick={onBack}>
                  ← Cuenca
                </button>
              )}
            </div>

            {notice && (
              <p className="quri-notice" role="status" aria-live="polite">
                {notice}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Diseño compacto en franja horizontal para la vista 2D (Atlas, modo claro).
  if (minimized) {
    return (
      <div className={`quri-strip quri-strip-min quri-theme-${theme}`}>
        <button
          type="button"
          className="quri-strip-expand"
          onClick={() => toggleMinimized(false)}
          aria-label={`Mostrar resumen de Quri para el río ${script.river}`}
        >
          <QuriMascot variant="medallion" speaking={isSpeaking} reducedMotion={reducedMotion} />
          <span>Quri · Río {script.river}</span>
        </button>
        {playback !== "idle" && (
          <button type="button" className="quri-ctrl-btn" onClick={() => stopAll(true)}>
            ■ Detener
          </button>
        )}
      </div>
    );
  }

  return (
    <aside className={`quri-strip quri-theme-${theme}`} aria-label={`Resumen de Quri para el río ${script.river}`}>
      <div className="quri-strip-row">
        <div className="quri-strip-id">
          <QuriMascot variant="medallion" speaking={isSpeaking} reducedMotion={reducedMotion} />
          <div>
            <strong>Quri · Río {script.river}</strong>
            <span>{script.reviewStatus}</span>
          </div>
        </div>

        <div className="quri-strip-actions">
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
              {playback === "loading" ? "Cargando…" : playback === "paused" ? "Continuar" : "Escuchar"}
            </button>
          )}

          {playback !== "idle" && (
            <button type="button" className="quri-ctrl-btn" onClick={() => stopAll(true)} aria-label="Detener audio">
              ■
            </button>
          )}

          <button
            type="button"
            className="quri-ctrl-btn"
            aria-expanded={transcriptOpen}
            aria-controls={transcriptId}
            onClick={() => setTranscriptOpen(!transcriptOpen)}
          >
            {transcriptOpen ? "Ocultar" : "Texto"}
          </button>

          <button
            type="button"
            className="quri-min-icon"
            onClick={() => toggleMinimized(true)}
            aria-label="Minimizar asistente Quri"
            title="Minimizar"
          >
            −
          </button>
        </div>
      </div>

      {isAudioActive && (
        <div className="quri-progress" aria-hidden="true">
          <div
            className={"quri-progress-fill" + (duration === 0 ? " is-indeterminate" : "")}
            style={duration > 0 ? { width: `${progressPct}%` } : undefined}
          />
        </div>
      )}

      {notice && (
        <p className="quri-notice" role="status" aria-live="polite">
          {notice}
        </p>
      )}

      {transcriptOpen && <div className="quri-card-transcript">{transcriptContent}</div>}
    </aside>
  );
}
