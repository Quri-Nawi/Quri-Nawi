"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { areas, records, verificationLabel, type Record as Study } from "../lib/catalog";
import type { BasinScene, Geo } from "./basin-scene";
import { placeLabels, type Tag } from "./label-layout";
import { ageColor, cssColor, levelLabel, outlookYears, riverOutlook, type Level, type OutlookYear } from "../lib/outlook";

const checked = ["agua", "sedimentos", "peces"];
// Lo que las etiquetas del mapa no deben tapar.
const BLOCKERS = ".outlook-bar,.site-header a,.site-header button,.basin-intro h1,.basin-intro>p,.basin-intro .button,.river-chips,.basin-tools button,.basin-legend,.basin-credit,.study-label,.river-panel";
const studiesOf = (river: string) => records.filter((record) => record.area === river);
const plural = (count: number) => (count === 1 ? "1 ficha" : count + " fichas");

function gapText(river: string) {
  const present = new Set(studiesOf(river).map((record) => record.matrix.toLowerCase()));
  const missing = checked.filter((matrix) => !present.has(matrix)).map((matrix) => "de " + matrix);
  if (missing.length === 0) return "";
  const list = missing.length === 1 ? missing[0] : missing.slice(0, -1).join(", ") + " ni " + missing[missing.length - 1];
  return `En este catálogo todavía no hay fichas ${list} para este río.`;
}

// Cada año tiñe un poco más el terreno: el mismo río se lee distinto en 2027 y en 2030.
const yearTint: { readonly [K in OutlookYear]: number } = { 2026: 0xffffff, 2027: 0xf7e9e2, 2028: 0xefd6cb, 2029: 0xe6c0b2, 2030: 0xdba597 };
// Colores oficiales de los ODS de la ONU; Minamata es el convenio sobre mercurio del que Bolivia es parte.
const goals = [
  { id: "3", name: "Salud y bienestar", why: "exposición de las personas", color: "#4c9f38" },
  { id: "6", name: "Agua limpia", why: "calidad del agua y sedimentos", color: "#26bde2" },
  { id: "12", name: "Producción responsable", why: "oro sin mercurio", color: "#bf8b2e" },
  { id: "15", name: "Vida de ecosistemas", why: "peces y ríos", color: "#56c02b" },
] as const;
const joinList = (items: readonly string[]) => (items.length < 2 ? items.join("") : items.slice(0, -1).join(", ") + " ni " + items[items.length - 1]);
const ageLevel = (age: number): Level => (age <= 5 ? "reciente" : age <= 10 ? "envejece" : age <= 20 ? "antiguo" : "critico");

function Goals() {
  return (
    <ul className="goal-chips" aria-label="Objetivos que apoya esta evidencia">
      {goals.map((goal) => <li key={goal.id} style={{ ["--goal" as string]: goal.color }} title={goal.name + ": " + goal.why}><b>ODS {goal.id}</b>{goal.name}</li>)}
      <li className="minamata" title="Convenio de Minamata sobre el Mercurio, del que Bolivia es parte"><b>Minamata</b>Convenio sobre el mercurio</li>
    </ul>
  );
}

const anchors = records.flatMap((record) => record.places.map((place) => ({ id: record.id, lon: place.lon, lat: place.lat })));
const highlighted = new Set<string>(areas);

function StudyLabel({ record, setRef }: { record: Study; setRef: (node: HTMLElement | null) => void }) {
  return (
    <article className="study-label" ref={setRef}>
      <p className="study-top"><span className={"matrix-chip matrix-" + record.matrix.split(" ")[0].toLowerCase()}>{record.matrix}</span><span className={"verif verif-" + record.verification}>{verificationLabel[record.verification]}</span></p>
      <h3>{record.title}</h3>
      {record.observation && <p className="study-value">{record.observation.value}<small>{record.observation.unit}</small><span>{record.observation.season}</span></p>}
      <dl className="study-dates">
        <div><dt>Muestreo</dt><dd>{record.sample}</dd></div>
        <div><dt>Publicación</dt><dd>{record.published}</dd></div>
      </dl>
      <p className="study-precision">{record.precision}</p>
      <a href={record.url} target="_blank" rel="noreferrer">{record.source} ↗</a>
    </article>
  );
}

// La licencia CC BY 4.0 exige este crédito, sus enlaces y avisar de los cambios hechos a la imagen.
function ImageCredit({ short = false }: { short?: boolean }) {
  return (
    <>
      <a href="https://cloudless.eox.at" target="_blank" rel="noreferrer">EOxCloudless</a> de EOX IT Services GmbH ({short ? "Copernicus Sentinel 2016" : "contiene datos Copernicus Sentinel modificados 2016"}), <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>; {short ? "modificada" : "color y sombreado modificados"}
    </>
  );
}

export function BasinHero() {
  const hostRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BasinScene | null>(null);
  const linesRef = useRef<SVGSVGElement>(null);
  const tagRefs = useRef(new Map<string, HTMLElement>());
  const labelRefs = useRef(new Map<string, HTMLElement>());
  const selectedRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<{ river: string; x: number; y: number } | null>(null);
  const [rotating, setRotating] = useState(true);
  const [places, setPlaces] = useState<Geo["places"]>([]);
  const [riverTags, setRiverTags] = useState<{ name: string; lon: number; lat: number }[]>([]);
  const [year, setYear] = useState<OutlookYear | null>(null);
  const outlooks = useMemo(() => new Map(riverTags.map((river) => [river.name, riverOutlook(records, river.name, year ?? 2026)])), [riverTags, year]);

  useEffect(() => {
    if (status !== "ready") return;
    sceneRef.current?.setOutlook(year === null ? null : {
      colors: new Map([...outlooks].map(([name, outlook]) => [name, ageColor(outlook.age)])),
      alerts: new Set([...outlooks].filter(([, outlook]) => outlook.level === "critico").map(([name]) => name)),
      tint: yearTint[year],
      fade: (year - 2026) / 4,
    });
  }, [status, year, outlooks]);

  useEffect(() => {
    let disposed = false;
    // Un enlace como /?rio=Kaka abre la portada directamente en ese río; se lee antes de que la selección reescriba la URL.
    const shared = new URLSearchParams(window.location.search).get("rio");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) setRotating(false);
    (async () => {
      try {
        const [{ createBasinScene }, { TextureLoader }, geo, buffer] = await Promise.all([
          import("./basin-scene"),
          import("three"),
          fetch("/geo/rios.json").then((response) => { if (!response.ok) throw new Error("rios"); return response.json() as Promise<Geo>; }),
          fetch("/geo/relieve.bin").then((response) => { if (!response.ok) throw new Error("relieve"); return response.arrayBuffer(); }),
        ]);
        const loader = new TextureLoader();
        // Las normales solo añaden detalle: si fallan, el mapa se muestra sin ellas.
        const [texture, normals] = await Promise.all([loader.loadAsync("/geo/satelite.jpg"), loader.loadAsync("/geo/normales.jpg").catch(() => null)]);
        if (disposed || !hostRef.current) return;
        setPlaces(geo.places);
        setRiverTags(geo.rivers.map((river) => {
          const longest = river.segments.reduce((a, b) => (b.length > a.length ? b : a));
          const [lon, lat] = longest[Math.floor(longest.length * 0.55)];
          return { name: river.name, lon, lat };
        }));
        sceneRef.current = createBasinScene({
          host: hostRef.current,
          geo,
          elevation: new Uint16Array(buffer),
          texture,
          normals,
          highlighted,
          anchors,
          reducedMotion,
          coarsePointer: window.matchMedia("(pointer: coarse)").matches,
          onPick: (river) => { if (river || selectedRef.current) setSelected(river); },
          onHover: (river, x, y) => setHover(river ? { river, x, y } : null),
          onContextLost: () => { if (!disposed) setStatus("error"); },
          onFrame: (project) => {
            const hero = hostRef.current?.parentElement;
            if (hero) {
              const tags: Tag[] = [...tagRefs.current.values()].map((node) => {
                const [kind, lon, lat] = node.dataset.at!.split("|");
                return { node, ...project(Number(lon), Number(lat), kind === "river" ? 0.05 : 0.02) };
              });
              placeLabels(tags, hero, BLOCKERS, !reducedMotion);
            }
            const svg = linesRef.current;
            if (!svg) return;
            const box = svg.getBoundingClientRect();
            for (const path of svg.querySelectorAll("path")) {
              const label = labelRefs.current.get(path.dataset.id!);
              const record = records.find((item) => item.id === path.dataset.id);
              if (!label || !record) continue;
              const rect = label.getBoundingClientRect();
              if (!rect.width) { path.removeAttribute("d"); continue; }
              const left = rect.left + rect.width / 2 < box.left + box.width / 2;
              const x0 = (left ? rect.right : rect.left) - box.left;
              const y0 = rect.top + 34 - box.top;
              path.setAttribute("d", record.places.map((place) => {
                const point = project(place.lon, place.lat);
                const elbow = x0 + (left ? 26 : -26);
                return `M${x0},${y0} L${elbow},${y0} L${point.x},${point.y} m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0`;
              }).join(" "));
            }
          },
        });
        setStatus("ready");
        // En pantallas grandes se cambia a la textura nítida cuando llega; si falla, queda la ligera.
        const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
        if (!saveData && window.matchMedia("(min-width: 761px) and (pointer: fine)").matches) {
          loader.loadAsync("/geo/satelite-hd.jpg").then((sharp) => {
            if (disposed) sharp.dispose(); else sceneRef.current?.setTexture(sharp);
          }).catch(() => undefined);
        }
        if (shared && geo.rivers.some((river) => river.name === shared)) setSelected(shared);
        // /?escenario=2050 abre la portada en ese año del escenario, para presentarlo directamente.
        const scenario = outlookYears.find((option) => String(option) === new URLSearchParams(window.location.search).get("escenario"));
        if (scenario) setYear(scenario);
      } catch {
        if (!disposed) setStatus("error");
      }
    })();
    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    selectedRef.current = selected;
    sceneRef.current?.focus(selected);
    const url = new URL(window.location.href);
    if (selected) url.searchParams.set("rio", selected); else url.searchParams.delete("rio");
    if (url.href !== window.location.href) window.history.replaceState(null, "", url);
    if (!selected) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selected]);

  useEffect(() => {
    const panel = panelRef.current;
    const hero = panel?.closest<HTMLElement>(".basin-hero");
    if (!panel || !hero) return;
    const resize = new ResizeObserver(() => {
      hero.style.setProperty("--river-panel-height", `${panel.getBoundingClientRect().height}px`);
    });
    resize.observe(panel);
    return () => resize.disconnect();
  }, [selected]);

  function toggleRotation() {
    sceneRef.current?.setRotation(!rotating);
    setRotating(!rotating);
  }

  function showInList(river: string) {
    window.dispatchEvent(new CustomEvent("quri:area", { detail: river }));
    document.getElementById("explorar")?.scrollIntoView();
  }

  const studies = selected ? studiesOf(selected) : [];
  const tag = (kind: string, name: string, lon: number, lat: number) => (node: HTMLElement | null) => {
    const key = kind + name;
    if (node) { node.dataset.at = `${kind}|${lon}|${lat}`; tagRefs.current.set(key, node); } else tagRefs.current.delete(key);
  };

  return (
    <section className={"basin-hero" + (selected ? " is-focused" : "")} aria-labelledby="hero-title" data-status={status}>
      <div className="basin-canvas" ref={hostRef} />
      <div className="basin-scrim" aria-hidden="true" />

      {status === "loading" && <p className="basin-status" role="status">Cargando la cuenca en 3D…</p>}
      {status === "error" && <p className="basin-status" role="status">Este navegador no puede mostrar el mapa 3D. <a href="#explorar">Usa la vista 2D y la lista ↓</a></p>}

      {status === "ready" && <div className="basin-tags" aria-hidden="true">
        {places.map((place) => <span key={place.name} className="place-tag" ref={tag("place", place.name, place.lon, place.lat)}>{place.name}</span>)}
        {riverTags.filter((river) => !selected || river.name === selected).map((river) => (
          <span key={river.name} style={year !== null ? { ["--lv" as string]: cssColor(ageColor(outlooks.get(river.name)?.age ?? null)) } : undefined} className={"river-tag" + (year !== null ? " level-" + outlooks.get(river.name)?.level : "") + (highlighted.has(river.name) ? " has-studies" : "") + (selected === river.name ? " is-selected" : "")} ref={tag("river", river.name, river.lon, river.lat)}>
            Río {river.name}{year === null && highlighted.has(river.name) ? <b>{studiesOf(river.name).length}</b> : null}
            {year !== null && <em className="age">{outlooks.get(river.name)?.newest ? outlooks.get(river.name)?.newest + " · " + outlooks.get(river.name)?.age + " años" : "sin datos"}</em>}
          </span>
        ))}
      </div>}

      {hover && !selected && <p className="river-hover" style={{ transform: `translate(${hover.x + 14}px, ${hover.y + 12}px)` }} aria-hidden="true">
        <strong>Río {hover.river}</strong>{studiesOf(hover.river).length ? plural(studiesOf(hover.river).length) + " · clic para acercar" : "Sin fichas en el catálogo · clic para ver"}
      </p>}

      <div className="outlook-bar" role="group" aria-label="Escenario: si nadie vuelve a medir" style={{ ["--progress" as string]: year === null ? 0 : outlookYears.indexOf(year) / (outlookYears.length - 1) }}>
        <span>Si nadie vuelve a medir</span>
        <div className="outlook-years">
          <i className="outlook-fill" aria-hidden="true" />
          {outlookYears.map((option) => (
            <button key={option} type="button" aria-pressed={year === option} onClick={() => setYear(year === option ? null : option)} disabled={status !== "ready"}>{option === 2026 ? "Hoy" : option}</button>
          ))}
        </div>
      </div>

      <div className={"basin-intro" + (year !== null ? " is-outlook" : "")}>
        {year === null ? <>
          <p className="eyebrow">Cuenca del Beni · Bolivia</p>
          <h1 id="hero-title">Explora un río.<br /><em>Comprueba qué se sabe del mercurio.</em></h1>
          <p>Toca un río dorado para acercarte y ver sus estudios, con la fuente, la fecha de muestreo y lo que falta saber.</p>
        </> : <>
          <p className="eyebrow">{year === 2026 ? "Hoy" : "Escenario " + year} · si nadie vuelve a medir</p>
          <h1 id="hero-title">{year === 2026 ? "Hoy, el último dato del Kaka tiene" : "En " + year + ", el último dato del Kaka tendría"} <em>{outlooks.get("Kaka")?.age} años.</em></h1>
          <p>El color de cada río muestra la antigüedad de su medición de mercurio más reciente en este catálogo. No proyecta contaminación: muestra dónde la evidencia envejece y qué conviene medir primero.</p>
          <ol className="priority-list" aria-label="Dónde medir primero">
            {[...areas].sort((a, b) => (outlooks.get(b)?.age ?? 999) - (outlooks.get(a)?.age ?? 999)).map((river) => {
              const outlook = outlooks.get(river);
              return <li key={river} className={"level-" + outlook?.level}><strong>Río {river}</strong>{outlook?.newest ? "último dato " + outlook.newest + " · " + outlook.age + " años" : "sin datos"}{outlook?.missing.length ? <small>Falta: {joinList(outlook.missing)}</small> : null}</li>;
            })}
          </ol>
          <Goals />
        </>}
        <div className="basin-actions">
          <button className="button gold" type="button" onClick={() => setSelected("Kaka")} disabled={status !== "ready"}>Ver el río Kaka <span aria-hidden="true">↗</span></button>
          {year === null ? <a className="button ghost" href="#explorar">Vista 2D y lista <span aria-hidden="true">↓</span></a>
            : <button className="button ghost" type="button" onClick={() => setYear(null)}>Volver al mapa de evidencia</button>}
        </div>
      </div>

      <nav className="river-chips" aria-label="Ríos con fichas">
        {areas.map((river) => (
          <button key={river} type="button" aria-pressed={selected === river} onClick={() => setSelected(selected === river ? null : river)} disabled={status !== "ready"}>
            Río {river}<span>{studiesOf(river).length}</span>
          </button>
        ))}
      </nav>

      <div className="basin-tools">
        <button type="button" onClick={() => sceneRef.current?.zoom(0.75)} aria-label="Acercar" disabled={status !== "ready"}>+</button>
        <button type="button" onClick={() => sceneRef.current?.zoom(1.33)} aria-label="Alejar" disabled={status !== "ready"}>−</button>
        <button type="button" onClick={toggleRotation} aria-pressed={!rotating} aria-label={rotating ? "Pausar el giro" : "Reanudar el giro"} disabled={status !== "ready"}>{rotating ? "❚❚" : "▶"}</button>
      </div>

      <aside className="basin-legend" aria-label="Leyenda del mapa">
        {year === null ? <>
          <p><i className="legend-gold" />Río con fichas</p>
          <p><i className="legend-blue" />Río sin fichas todavía</p>
          <p><i className="legend-pin" />Lugar aproximado de un estudio</p>
        </> : <>
          <p className="legend-title">Antigüedad del dato más reciente en {year}</p>
          {(Object.keys(levelLabel) as Level[]).map((level) => <p key={level}><i className={"legend-level level-" + level} />{levelLabel[level]}</p>)}
          <p className="legend-note">Criterio del equipo para priorizar dónde medir; no es un umbral científico.</p>
        </>}
        <small>Relieve real exagerado ×11. Ríos © colaboradores de OpenStreetMap · Relieve: Mapzen/AWS (SRTM) · Imagen: <ImageCredit /> · Tono: NASA Blue Marble.</small>
      </aside>
      <p className="basin-credit">Imagen: <ImageCredit short /></p>

      {selected && <>
        <svg className="basin-lines" ref={linesRef} aria-hidden="true">
          {studies.filter((record) => record.places.length).map((record) => <path key={record.id} data-id={record.id} />)}
        </svg>
        <div className="study-columns">
          {[0, 1].map((side) => (
            <div key={side} className={"study-column " + (side ? "right" : "left")}>
              {studies.filter((_, index) => index % 2 === side).map((record) => (
                <StudyLabel key={record.id} record={record} setRef={(node) => { if (node) labelRefs.current.set(record.id, node); else labelRefs.current.delete(record.id); }} />
              ))}
            </div>
          ))}
        </div>
        <div className="river-panel" ref={panelRef} role="region" aria-label={"Río " + selected}>
          <p className="eyebrow">{studies.length ? plural(studies.length) + " en el catálogo" : "Sin fichas en el catálogo"}</p>
          <h2>Río {selected}</h2>
          {year !== null && <ul className="outlook-lines" aria-label={"Antigüedad de los datos en " + year}>
            {outlooks.get(selected)?.latest.map((line) => <li key={line.key} className={"level-" + (line.year === null ? "sin-datos" : ageLevel(year - line.year))}>
              <span>{line.label}</span><strong>{line.year === null ? "sin dato" : line.year + " · " + (year - line.year) + " años"}</strong><small>ODS {line.ods.join(" · ")}</small>
            </li>)}
          </ul>}
          <p>{studies.length ? gapText(selected) : "Todavía no cargamos estudios de este río. ¿Conoces uno? Propónlo para revisión."}{studies.length > 4 && <span className="solo-escritorio"> En pantalla se muestran 4; el resto está en la lista.</span>}</p>
          <div className="basin-actions">
            <button className="button gold" type="button" onClick={() => setSelected(null)}>← Volver a la cuenca</button>
            {studies.length ? <button className="button ghost" type="button" onClick={() => showInList(selected)}>Ver en la lista ↓</button>
              : <a className="button ghost" href="#aportar">Proponer un estudio ↓</a>}
          </div>
        </div>
      </>}
    </section>
  );
}
