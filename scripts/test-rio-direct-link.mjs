import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

const origin = new URL(process.env.QURI_SMOKE_URL ?? "http://localhost:3000");
const browser = process.env.CHROME_BIN ?? (process.platform === "win32"
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : "google-chrome");
const profile = mkdtempSync(join(tmpdir(), "quri-rio-"));
const chrome = spawn(browser, [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-background-networking",
  "--disable-extensions", "--enable-unsafe-swiftshader", "--no-first-run",
  `--user-data-dir=${profile}`, "--remote-debugging-port=0", "about:blank",
], { stdio: "ignore" });
const pending = new Map();
let socket;
let nextId = 0;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deadline = Date.now() + 20_000;

async function command(method, params = {}) {
  const id = ++nextId;
  const response = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method}: Chrome no respondió`));
    }, 5000);
    pending.set(id, {
      resolve: (value) => { clearTimeout(timer); resolve(value); },
      reject: (error) => { clearTimeout(timer); reject(error); },
    });
  });
  socket.send(JSON.stringify({ id, method, params }));
  const result = await response;
  if (result.error) throw new Error(`${method}: ${result.error.message}`);
  return result.result;
}

async function inspect() {
  const { result } = await command("Runtime.evaluate", {
    expression: `({
      url: location.href,
      map: document.querySelector('.basin-hero')?.dataset.status,
      api: document.querySelector('.catalog-provenance')?.textContent?.includes('Consulta de la web revisada'),
      panel: document.querySelector('.river-panel')?.getAttribute('aria-label'),
      study: document.querySelector('.study-columns')?.textContent?.includes('kaka-seca')
    })`,
    returnByValue: true,
  });
  return result.value;
}

try {
  const portFile = join(profile, "DevToolsActivePort");
  let port;
  while (!port && Date.now() < deadline) {
    if (chrome.exitCode !== null) throw new Error(`Chrome terminó con código ${chrome.exitCode}`);
    try { port = readFileSync(portFile, "utf8").split("\n")[0]; }
    catch (error) { if (error.code !== "ENOENT" && error.code !== "EBUSY") throw error; }
    await pause(100);
  }
  assert.ok(port, "Chrome debe abrir el puerto de depuración");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((item) => item.type === "page");
  assert.ok(target, "Chrome debe crear una página");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    const task = pending.get(message.id);
    if (task) { pending.delete(message.id); task.resolve(message); }
  });
  await command("Runtime.enable");
  await command("Page.enable");
  const sharedUrl = new URL("/?rio=Kaka", origin).href;
  await command("Page.navigate", { url: sharedUrl });

  let state;
  while (Date.now() < deadline) {
    try { state = await inspect(); }
    catch (error) {
      if (!/context|frame|navigation/i.test(error.message)) throw error;
    }
    if (state?.api && state?.map === "ready" && state?.url === sharedUrl && state?.panel === "Río Kaka" && state?.study) break;
    await pause(200);
  }
  if (state?.api && state?.panel === "Río Kaka") {
    await pause(1000);
    state = await inspect();
  }
  assert.ok(state?.api, `El catálogo debe terminar de cargar: ${JSON.stringify(state)}`);
  assert.equal(state.map, "ready", `El mapa debe terminar de cargar: ${JSON.stringify(state)}`);
  assert.equal(state.url, sharedUrl, "el enlace compartido debe conservar el río");
  assert.equal(state.panel, "Río Kaka", "el panel del río debe seguir abierto tras actualizar el catálogo");
  assert.equal(state.study, true, "el panel debe mostrar la ficha del catálogo actualizado");
  console.log("Enlace /?rio=Kaka verificado tras cargar las API: URL, panel y ficha kaka-seca conservados.");
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    try { await command("Browser.close"); } catch { /* Chrome puede cerrarse antes de responder. */ }
  }
  socket?.close();
  chrome.kill();
  if (profile.startsWith(tmpdir() + sep)) {
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); }
    catch { /* Windows puede retener el perfil brevemente después de cerrar Chrome. */ }
  }
}
