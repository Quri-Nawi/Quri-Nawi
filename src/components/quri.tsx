"use client";

import { useEffect, useRef, useState } from "react";
import { riverFacts } from "../lib/quri-brief";

type Spot = "right" | "left";
type Status = "idle" | "connecting" | "listening" | "speaking" | "error";
type Lines = { quri: string; user: string };

const parts = ["torso", "left", "right", "eyeL", "eyeR", "mouth"] as const;
const SESSION_LIMIT_MS = 5 * 60 * 1000;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const rad = (deg: number) => (deg * Math.PI) / 180;
const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/(\d)[.,](\d)/g, "$1,$2").replace(/[^a-z0-9, ]+/g, " ").replace(/\s+/g, " ").trim();

/** Pide al mapa 3D que cambie de río o de año; la portada escucha este evento. */
function control(detail: { action: "river"; river: string } | { action: "year"; year: number | null } | { action: "home" }) {
  window.dispatchEvent(new CustomEvent("quri:control", { detail }));
  document.querySelector(".basin-hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function runTool(name: string, args: Record<string, unknown>) {
  if (name === "enfocar_rio" && typeof args.rio === "string") {
    control({ action: "river", river: args.rio });
    const fichas = riverFacts(args.rio);
    return { rio: args.rio, fichas, nota: fichas.length ? "Explica con estas fichas." : "No hay fichas de este río en el catálogo." };
  }
  if (name === "ver_escenario" && typeof args.anio === "number") {
    control({ action: "year", year: args.anio === 0 ? null : args.anio });
    return { anio: args.anio || "hoy", nota: "El color muestra la antigüedad del dato más reciente; no es contaminación." };
  }
  if (name === "volver_a_la_cuenca") { control({ action: "home" }); return { ok: true }; }
  return { error: "Herramienta desconocida" };
}

export function Quri() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const level = useRef(0); // volumen de la voz de Quri, 0..1, mueve la boca
  const gaze = useRef({ x: 0, y: 0 });
  const wave = useRef(-10);
  const session = useRef<{ pc: RTCPeerConnection; dc: RTCDataChannel; mic: MediaStream; audio: HTMLAudioElement; ctx: AudioContext; timer: number } | null>(null);
  const [spot, setSpot] = useState<Spot>("right");
  const [status, setStatus] = useState<Status>("idle");
  const [lines, setLines] = useState<Lines>({ quri: "", user: "" });
  const [hint, setHint] = useState(false);
  const statusRef = useRef(status);
  statusRef.current = status;

  // El lugar donde se asoma sigue al contexto: borde derecho en la vista general, izquierdo con un río abierto.
  useEffect(() => {
    const hero = document.querySelector(".basin-hero");
    let greet = 0, hide = 0;
    // Saluda cuando el mapa 3D ya está listo; antes, la carga ocupa el navegador y el saludo pasaría sin verse.
    const onHero = () => {
      if (!hero?.classList.contains("is-focused")) setSpot("right");
      if (!greet && hero?.getAttribute("data-status") !== "loading") {
        greet = window.setTimeout(() => { setHint(true); wave.current = performance.now() / 1000; }, 1200);
        hide = window.setTimeout(() => setHint(false), 9200);
      }
    };
    const observer = new MutationObserver(onHero);
    if (hero) observer.observe(hero, { attributes: true, attributeFilter: ["class", "data-status"] });
    onHero();
    return () => { observer.disconnect(); window.clearTimeout(greet); window.clearTimeout(hide); };
  }, []);

  // Rig en canvas: brazos detrás del cuerpo, ojos y boca encima; respira, parpadea, mira y habla con el audio.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sprites = Object.fromEntries(parts.map((name) => { const image = new Image(); image.src = `/quri/${name}.webp`; return [name, image]; })) as Record<(typeof parts)[number], HTMLImageElement>;
    let frame = 0, ready = false, nextBlink = 1.5, blinkAt = -10, open = 0, last = performance.now();
    Promise.all(Object.values(sprites).map((image) => image.decode())).then(() => { ready = true; }).catch(() => undefined);
    const onPointer = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2), dy = event.clientY - (box.top + box.height * 0.3);
      const length = Math.hypot(dx, dy) || 1;
      gaze.current = { x: (dx / length) * Math.min(3.2, length / 60), y: (dy / length) * Math.min(2.4, length / 80) };
    };
    window.addEventListener("pointermove", onPointer);
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const box = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(box.width * ratio));
      canvas.height = Math.max(1, Math.round(box.height * ratio));
    };
    const sizer = new ResizeObserver(resize);
    sizer.observe(canvas);
    const eye = (image: HTMLImageElement, x: number, y: number, closure: number, gx: number, gy: number) => {
      if (closure > 0.75) {
        ctx.save(); ctx.globalAlpha = smooth((closure - 0.75) / 0.25); ctx.strokeStyle = "#28201c"; ctx.lineWidth = 2.7; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x - 8, y + 1); ctx.quadraticCurveTo(x, y + 4, x + 8, y + 1); ctx.stroke(); ctx.restore();
      }
      if (closure < 0.97) {
        ctx.save(); ctx.translate(x + gx, y + gy + closure * 2); ctx.scale(1, Math.max(0.04, 1 - closure)); ctx.drawImage(image, -15, -15);
        ctx.fillStyle = "#ffffffd9"; ctx.beginPath(); ctx.arc(4, -4, 2.6, 0, Math.PI * 2); ctx.fill(); // brillo del ojo
        ctx.beginPath(); ctx.arc(-3, 4, 1.1, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    };
    const arm = (image: HTMLImageElement, px: number, py: number, angle: number) => {
      ctx.save(); ctx.translate(px, py); ctx.rotate(rad(angle)); ctx.translate(-px, -py); ctx.drawImage(image, 0, 0); ctx.restore();
    };
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const time = now / 1000, dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!ready || document.hidden) return;
      ctx.setTransform(canvas.width / 600, 0, 0, canvas.height / 650, 0, 0);
      ctx.clearRect(0, 0, 600, 650);
      const talking = statusRef.current === "speaking" || level.current > 0.02;
      // Si el navegador no entrega el volumen de la voz, la boca igual se mueve mientras Quri habla.
      const voiced = level.current > 0.008 ? clamp(level.current * 3.2) : 0.15 + 0.6 * Math.abs(Math.sin(time * 10.7) * Math.cos(time * 3.3));
      open += ((talking ? voiced : 0) - open) * Math.min(1, dt * 18);
      if (!reduced && time > nextBlink) { blinkAt = time; nextBlink = time + 2.6 + Math.random() * 3.4; }
      const blinkT = (time - blinkAt) / 0.24;
      const closure = blinkT >= 0 && blinkT < 1 ? Math.sin(Math.PI * blinkT) ** 1.5 : 0;
      const waveT = time - wave.current;
      const waving = waveT >= 0 && waveT < 2.4;
      const waveAngle = waving ? smooth(waveT / 0.5) * (1 - smooth((waveT - 1.8) / 0.55)) * (150 + 10 * Math.sin((waveT - 0.5) * Math.PI * 5)) : 0;
      const breath = reduced ? 0 : Math.sin(time * 2 * Math.PI / 4.2);
      const sway = reduced ? 0 : Math.sin(time * 1.3) * (talking ? 2.4 : 1.2);
      ctx.save();
      ctx.translate(300, 600); ctx.rotate(rad(sway * 0.6)); ctx.scale(1 + breath * 0.004, 1 + breath * 0.007); ctx.translate(-300, -600);
      // El brazo izquierdo de la imagen es el que queda a la vista al asomarse: saluda y gesticula al hablar.
      const talkArm = talking ? 22 + 14 * Math.sin(time * 3.1) : 0;
      arm(sprites.left, 149, 310, Math.max(waveAngle, talkArm) + sway);
      arm(sprites.right, 447, 310, -4 - sway);
      ctx.drawImage(sprites.torso, 0, 0);
      // Rubor que se intensifica al hablar.
      for (const cx of [231, 369]) {
        const glow = ctx.createRadialGradient(cx, 203, 2, cx, 203, 26);
        glow.addColorStop(0, `rgba(240,120,130,${0.16 + open * 0.22})`); glow.addColorStop(1, "rgba(240,120,130,0)");
        ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(cx, 203, 26, 18, 0, 0, Math.PI * 2); ctx.fill();
      }
      const gx = reduced ? 0 : gaze.current.x, gy = reduced ? 0 : gaze.current.y;
      eye(sprites.eyeL, 246, 181, closure, gx, gy);
      eye(sprites.eyeR, 354, 181, closure, gx, gy);
      if (open < 0.05) ctx.drawImage(sprites.mouth, 277, 192);
      else {
        const rx = 9 + 6 * open, ry = 2 + 10 * open;
        ctx.save(); ctx.translate(300, 204);
        ctx.fillStyle = "#3a211c"; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e0707a"; ctx.beginPath(); ctx.ellipse(0, ry * 0.45, rx * 0.6, ry * 0.42, 0, 0, Math.PI * 2); ctx.fill(); // lengua
        ctx.restore();
      }
      ctx.restore();
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); sizer.disconnect(); window.removeEventListener("pointermove", onPointer); };
  }, []);

  function stop(message?: string) {
    document.querySelectorAll(".study-label.quri-focus").forEach((label) => label.classList.remove("quri-focus"));
    const current = session.current;
    session.current = null;
    if (current) {
      window.clearTimeout(current.timer);
      current.dc.close(); current.pc.close();
      current.mic.getTracks().forEach((track) => track.stop());
      current.audio.srcObject = null;
      current.ctx.close().catch(() => undefined);
    }
    level.current = 0;
    setStatus(message ? "error" : "idle");
    if (message) setLines({ quri: message, user: "" });
  }

  async function start() {
    setHint(false);
    setStatus("connecting");
    setLines({ quri: "Te escucho en un momento…", user: "" });
    wave.current = performance.now() / 1000;
    let mic: MediaStream;
    const ctx = new AudioContext();
    ctx.resume().catch(() => undefined); // algunos celulares lo crean suspendido
    let voice: MediaStreamTrack;
    try {
      // Sin ganancia automática (subía ruidos lejanos) y con un filtro que quita zumbidos y golpes graves bajo 180 Hz.
      mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 180;
      const filtered = ctx.createMediaStreamDestination();
      ctx.createMediaStreamSource(mic).connect(highpass).connect(filtered);
      voice = filtered.stream.getAudioTracks()[0];
    } catch {
      ctx.close().catch(() => undefined);
      stop("Necesito permiso para usar el micrófono. Actívalo en el navegador y vuelve a tocarme.");
      return;
    }
    try {
      const answer = await fetch("/api/quri-sesion", { method: "POST" });
      const data = (await answer.json()) as { value?: string; error?: string };
      if (!answer.ok || !data.value) { mic.getTracks().forEach((track) => track.stop()); ctx.close().catch(() => undefined); stop(data.error ?? "No pude conectarme."); return; }
      const pc = new RTCPeerConnection();
      const audio = new Audio();
      audio.autoplay = true;
      pc.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        // El analizador mide la voz de Quri para abrir la boca al ritmo del audio.
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(event.streams[0]).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        const sample = () => {
          if (!session.current) return;
          analyser.getByteTimeDomainData(samples);
          let sum = 0;
          for (const value of samples) sum += ((value - 128) / 128) ** 2;
          level.current = Math.sqrt(sum / samples.length);
          requestAnimationFrame(sample);
        };
        sample();
      };
      pc.addTrack(voice, mic);
      const dc = pc.createDataChannel("oai-events");
      const send = (event: object) => { if (dc.readyState === "open") dc.send(JSON.stringify(event)); };
      dc.onopen = () => {
        setStatus("listening");
        send({ type: "response.create", response: { instructions: "Saluda en una sola frase como Quri y pregunta qué río quieren explorar." } });
      };
      dc.onmessage = (message) => {
        const event = JSON.parse(message.data as string) as { type: string; delta?: string; transcript?: string; response?: { output?: { type: string; name?: string; call_id?: string; arguments?: string }[] } };
        if (event.type === "response.created") setLines((current) => ({ ...current, quri: "" }));
        else if (event.type === "response.output_audio_transcript.delta" && event.delta) { setStatus("speaking"); setLines((current) => ({ ...current, quri: current.quri + event.delta })); }
        else if (event.type === "conversation.item.input_audio_transcription.completed" && event.transcript) setLines((current) => ({ ...current, user: event.transcript ?? "" }));
        else if (event.type === "input_audio_buffer.speech_started") { setStatus("listening"); setLines({ quri: "", user: "…" }); }
        else if (event.type === "output_audio_buffer.started") setStatus("speaking");
        else if (event.type === "output_audio_buffer.stopped") setStatus("listening");
        else if (event.type === "response.done") {
          const calls = (event.response?.output ?? []).filter((item) => item.type === "function_call");
          for (const call of calls) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(call.arguments ?? "{}"); } catch { /* argumentos inválidos: la herramienta responde con error */ }
            send({ type: "conversation.item.create", item: { type: "function_call_output", call_id: call.call_id, output: JSON.stringify(runTool(call.name ?? "", args)) } });
          }
          if (calls.length) send({ type: "response.create" });
          else if (statusRef.current !== "speaking") setStatus("listening");
        }
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdp = await fetch("https://api.openai.com/v1/realtime/calls", { method: "POST", body: offer.sdp, headers: { Authorization: `Bearer ${data.value}`, "Content-Type": "application/sdp" } });
      if (!sdp.ok) throw new Error("sdp");
      await pc.setRemoteDescription({ type: "answer", sdp: await sdp.text() });
      // Cada conversación dura como máximo unos minutos para cuidar el saldo del proyecto.
      const timer = window.setTimeout(() => stop(), SESSION_LIMIT_MS);
      session.current = { pc, dc, mic, audio, ctx, timer };
    } catch {
      mic.getTracks().forEach((track) => track.stop());
      ctx.close().catch(() => undefined);
      stop("Se cortó la conexión. Toca a Quri para intentarlo de nuevo.");
    }
  }

  useEffect(() => () => stop(), []);

  // Mientras explica, busca qué ficha menciona (valor o palabras del título), la resalta y se pasa al lado contrario para no taparla.
  useEffect(() => {
    if (!lines.quri) return;
    const said = normalize(lines.quri.slice(-240));
    let best: HTMLElement | null = null, bestScore = 0;
    for (const label of document.querySelectorAll<HTMLElement>(".study-label")) {
      const value = normalize(label.querySelector(".study-value")?.firstChild?.textContent ?? "");
      const words = normalize(label.querySelector("h3")?.textContent ?? "").split(" ").filter((word) => word.length > 5);
      const score = (value && said.includes(value) ? 3 : 0) + words.filter((word) => said.includes(word)).length;
      if (score > bestScore) { best = label; bestScore = score; }
    }
    if (!best || bestScore < 2) return;
    document.querySelectorAll(".study-label.quri-focus").forEach((label) => label !== best && label.classList.remove("quri-focus"));
    best.classList.add("quri-focus");
    if (window.matchMedia("(max-width: 760px)").matches) best.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    else setSpot(best.closest(".study-column.left") ? "right" : "left");
  }, [lines.quri]);

  const active = status === "connecting" || status === "listening" || status === "speaking";
  const label = { idle: "Hablar con Quri", connecting: "Conectando con Quri", listening: "Quri te escucha", speaking: "Quri está hablando", error: "Hablar con Quri" }[status];

  return (
    <div className={"quri-dock spot-" + spot + (active || hint || status === "error" ? " is-out" : "")} data-status={status}>
      <button type="button" className="quri-body" onClick={() => (active ? stop() : start())} aria-label={active ? "Terminar la conversación con Quri" : "Hablar con Quri, la guía del mapa"}>
        <canvas ref={canvasRef} aria-hidden="true" />
        <span className="quri-ring" aria-hidden="true" />
      </button>
      {(active || hint || status === "error") && (
        <div className="quri-bubble" role="status" aria-live="polite">
          <p className="quri-state"><i aria-hidden="true" />{hint && !active ? "Quri · guía del mapa" : label}</p>
          {lines.user && active && <p className="quri-user">{lines.user}</p>}
          <p className="quri-text">{hint && !active ? "¡Hola! Tócame y pregúntame por un río. Yo te muestro sus datos en el mapa." : lines.quri || "Pregúntame, por ejemplo: «¿Qué se midió en el Kaka?»"}</p>
          {active && <button type="button" className="quri-stop" onClick={() => stop()}>Terminar</button>}
        </div>
      )}
    </div>
  );
}
