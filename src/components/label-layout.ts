// Coloca las etiquetas del mapa sin que se encimen entre sí ni tapen botones, textos y paneles.
// Mientras el mapa gira, una etiqueta conserva su sitio, se desliza al cambiar y no parpadea.

export type Tag = { node: HTMLElement; x: number; y: number; visible: boolean };
type Box = { left: number; top: number; right: number; bottom: number };
type Offset = readonly [number, number];
type Metrics = { left: number; top: number; width: number; height: number };
type State = { target: Offset; shown: [number, number]; hidden: boolean; homeSince: number | null; changeSince: number | null; written: string };

const HOME: Offset = [0, 0];
// Posiciones alternativas [x, y] en píxeles, de la más cercana a la más lejana.
const NEAR: readonly Offset[] = [HOME, [0, 26], [0, -26], [0, 52], [0, -52], [60, 0], [-60, 0]];
// Los ríos con fichas y el río elegido admiten sitios más alejados porque siempre deben leerse.
const FAR: readonly Offset[] = [...NEAR, [0, 78], [0, -78], [80, 26], [-80, 26], [110, 0], [-110, 0], [150, 0], [-150, 0], [0, 110], [0, -110]];
const RETURN_AFTER = 500;
const SHOW_AFTER = 600;
const MEASURE_EVERY = 200;

const states = new WeakMap<HTMLElement, State>();
let measured: { area: HTMLElement; at: number; origin: { width: number; height: number }; blockers: Box[]; tags: Map<HTMLElement, Metrics> } | null = null;

const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const required = (node: HTMLElement) => node.classList.contains("has-studies") || node.classList.contains("is-selected");

function rank(node: HTMLElement) {
  if (node.classList.contains("is-selected")) return 0;
  if (node.classList.contains("has-studies")) return 1;
  return node.classList.contains("river-tag") ? 2 : 3;
}

// Medir obliga al navegador a calcular estilos: se hace unas pocas veces por segundo, no en cada cuadro.
function measure(tags: Tag[], area: HTMLElement, selector: string, now: number) {
  if (measured && measured.area === area && now - measured.at < MEASURE_EVERY && tags.every((tag) => measured!.tags.has(tag.node))) return measured;
  const origin = area.getBoundingClientRect();
  const blockers: Box[] = [];
  for (const element of document.querySelectorAll(selector)) {
    if (getComputedStyle(element).visibility === "hidden") continue;
    const rect = element.getBoundingClientRect();
    if (rect.width) blockers.push({ left: rect.left - origin.left, top: rect.top - origin.top, right: rect.right - origin.left, bottom: rect.bottom - origin.top });
  }
  const metrics = new Map(tags.map(({ node }) => {
    // Los márgenes se leen sin la clase que invierte la etiqueta de un lugar.
    const style = getComputedStyle(node);
    return [node, { left: parseFloat(style.marginLeft), top: parseFloat(style.marginTop), width: node.offsetWidth, height: node.offsetHeight }] as const;
  }));
  measured = { area, at: now, origin: { width: origin.width, height: origin.height }, blockers, tags: metrics };
  return measured;
}

export function placeLabels(tags: Tag[], area: HTMLElement, selector: string, smooth: boolean) {
  const now = performance.now();
  const { origin, blockers, tags: metrics } = measure(tags, area, selector, now);
  const taken = [...blockers];

  for (const tag of [...tags].sort((a, b) => rank(a.node) - rank(b.node))) {
    const { left, top, width, height } = metrics.get(tag.node)!;
    const isRiver = tag.node.classList.contains("river-tag");
    // Un lugar solo puede ir a la derecha o a la izquierda de su punto.
    const flipped: Offset = [-(width + 11), 0];
    const candidates = !isRiver ? [HOME, flipped] : required(tag.node) ? FAR : NEAR;
    // Las etiquetas obligatorias no se salen por los costados mientras su punto esté a la vista.
    const across = (x: number) => (required(tag.node) && tag.visible ? Math.min(Math.max(x, 4 - left), origin.width - 4 - width - left) : x);
    const boxAt = ([dx, dy]: Offset): Box => {
      const x = across(tag.x + dx) + left, y = tag.y + top + dy;
      return { left: x - 2, top: y - 2, right: x + width + 2, bottom: y + height + 2 };
    };
    const free = (offset: Offset) => {
      const box = boxAt(offset);
      return box.left >= 0 && box.top >= 0 && box.right <= origin.width && box.bottom <= origin.height && !taken.some((other) => overlaps(box, other));
    };

    let state = states.get(tag.node);
    const first = !state;
    state ??= { target: HOME, shown: [0, 0], hidden: false, homeSince: null, changeSince: null, written: "" };
    states.set(tag.node, state);
    // El sitio invertido depende del ancho, que puede cambiar.
    if (!isRiver && state.target !== HOME) state.target = flipped;

    let target: Offset | undefined = state.target;
    if (target !== HOME && free(HOME)) {
      state.homeSince ??= now;
      if (now - state.homeSince > RETURN_AFTER) target = HOME;
    } else state.homeSince = null;
    if (!free(target)) target = candidates.find(free);
    if (target) state.target = target;

    const wantHidden = !tag.visible || (!target && !required(tag.node));
    // Se oculta al instante para no encimarse; para volver espera a que el sitio siga libre, y así no parpadea.
    if (first || wantHidden || !state.hidden) {
      state.hidden = wantHidden;
      state.changeSince = null;
    } else {
      state.changeSince ??= now;
      if (now - state.changeSince > SHOW_AFTER) { state.hidden = false; state.changeSince = null; }
    }
    if (!state.hidden) taken.push(boxAt(state.target));

    const ease = smooth && !first && !state.hidden ? 0.2 : 1;
    state.shown[0] += (state.target[0] - state.shown[0]) * ease;
    state.shown[1] += (state.target[1] - state.shown[1]) * ease;
    const transform = `translate(${across(tag.x + state.shown[0]).toFixed(1)}px, ${(tag.y + state.shown[1]).toFixed(1)}px)`;
    const opacity = state.hidden ? "0" : "";
    const flip = !isRiver && state.target !== HOME;
    const written = `${transform}|${opacity}|${flip}`;
    if (written === state.written) continue;
    state.written = written;
    tag.node.style.transform = transform;
    tag.node.style.opacity = opacity;
    if (!isRiver) tag.node.classList.toggle("flip", flip);
  }
}
