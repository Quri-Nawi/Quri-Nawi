"use client";

import { useEffect, useRef, useState } from "react";
import { areas, verificationLabel } from "../lib/catalog";
import type { CatalogRecord } from "../lib/public-catalog";
import type { BasinScene, Geo } from "./basin-scene";

const checked = ["agua", "sedimentos", "peces"];
const studiesOf = (records: readonly CatalogRecord[], river: string) => records.filter((record) => record.area === river);
const plural = (count: number) => (count === 1 ? "1 ficha" : count + " fichas");

function gapText(records: readonly CatalogRecord[], river: string) {
  const present = new Set(studiesOf(records, river).map((record) => record.matrix.toLowerCase()));
  const missing = checked.filter((matrix) => !present.has(matrix)).map((matrix) => "de " + matrix);
  if (missing.length === 0) return "";
  const list = missing.length === 1 ? missing[0] : missing.slice(0, -1).join(", ") + " ni " + missing[missing.length - 1];
  return `En este catálogo todavía no hay fichas ${list} para este río.`;
}

function StudyLabel({ record, setRef }: { record: CatalogRecord; setRef: (node: HTMLElement | null) => void }) {
  return (
    <article className="study-label" ref={setRef}>
      <p className="study-top"><span className={"matrix-chip matrix-" + record.matrix.split(" ")[0].toLowerCase()}>{record.matrix}</span><span className={"verif verif-" + record.verification}>{verificationLabel[record.verification]}</span></p>
      <h3>{record.title}</h3>
      <p className="study-identity">{record.id} · v{record.version} · pendiente de autorización MCP</p>
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

export function BasinHero({ records }: { records: readonly CatalogRecord[] }) {
  const anchors = records.flatMap((record) => record.places.map((place) => ({ id: record.id, lon: place.lon, lat: place.lat })));
  const highlighted = new Set<string>(records.map((record) => record.area));
  const hostRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BasinScene | null>(null);
  const linesRef = useRef<SVGSVGElement>(null);
  const tagRefs = useRef(new Map<string, HTMLElement>());
  const labelRefs = useRef(new Map<string, HTMLElement>());
  const selectedRef = useRef<string | null>(null);
  const sharedRiver = useRef<string | undefined>(undefined);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<{ river: string; x: number; y: number } | null>(null);
  const [rotating, setRotating] = useState(true);
  const [places, setPlaces] = useState<Geo["places"]>([]);
  const [riverTags, setRiverTags] = useState<{ name: string; lon: number; lat: number }[]>([]);

  useEffect(() => {
    let disposed = false;
    // Un enlace como /?rio=Kaka abre la portada directamente en ese río; se lee antes de que la selección reescriba la URL.
    if (sharedRiver.current === undefined) sharedRiver.current = new URLSearchParams(window.location.search).get("rio") ?? "";
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
        const texture = await new TextureLoader().loadAsync("/geo/satelite.jpg");
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
          highlighted,
          anchors,
          reducedMotion,
          coarsePointer: window.matchMedia("(pointer: coarse)").matches,
          onPick: (river) => { if (river || selectedRef.current) setSelected(river); },
          onHover: (river, x, y) => setHover(river ? { river, x, y } : null),
          onContextLost: () => { if (!disposed) setStatus("error"); },
          onFrame: (project) => {
            for (const node of tagRefs.current.values()) {
              const [kind, lon, lat] = node.dataset.at!.split("|");
              const point = project(Number(lon), Number(lat), kind === "river" ? 0.05 : 0.02);
              node.style.transform = `translate(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px)`;
              node.style.opacity = point.visible ? "" : "0";
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
        if (selectedRef.current) sceneRef.current.focus(selectedRef.current);
        setStatus("ready");
        if (sharedRiver.current && geo.rivers.some((river) => river.name === sharedRiver.current)) {
          setSelected(sharedRiver.current);
          sharedRiver.current = "";
        }
      } catch {
        if (!disposed) setStatus("error");
      }
    })();
    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [records]);

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

  const studies = selected ? studiesOf(records, selected) : [];
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
          <span key={river.name} className={"river-tag" + (highlighted.has(river.name) ? " has-studies" : "")} ref={tag("river", river.name, river.lon, river.lat)}>
            Río {river.name}{highlighted.has(river.name) ? <b>{studiesOf(records, river.name).length}</b> : null}
          </span>
        ))}
      </div>}

      {hover && !selected && <p className="river-hover" style={{ transform: `translate(${hover.x + 14}px, ${hover.y + 12}px)` }} aria-hidden="true">
        <strong>Río {hover.river}</strong>{studiesOf(records, hover.river).length ? plural(studiesOf(records, hover.river).length) + " · clic para acercar" : "Sin fichas en el catálogo · clic para ver"}
      </p>}

      <div className="basin-intro">
        <p className="eyebrow">Cuenca del Beni · Bolivia</p>
        <h1 id="hero-title">Explora un río.<br /><em>Comprueba qué se sabe del mercurio.</em></h1>
        <p>Toca un río dorado para acercarte y ver sus estudios, con la fuente, la fecha de muestreo y lo que falta saber.</p>
        <div className="basin-actions">
          <button className="button gold" type="button" onClick={() => setSelected("Kaka")} disabled={status !== "ready"}>Ver el río Kaka <span aria-hidden="true">↗</span></button>
          <a className="button ghost" href="#explorar">Vista 2D y lista <span aria-hidden="true">↓</span></a>
        </div>
      </div>

      <nav className="river-chips" aria-label="Ríos con fichas">
        {areas.map((river) => (
          <button key={river} type="button" aria-pressed={selected === river} onClick={() => setSelected(selected === river ? null : river)} disabled={status !== "ready"}>
            Río {river}<span>{studiesOf(records, river).length}</span>
          </button>
        ))}
      </nav>

      <div className="basin-tools">
        <button type="button" onClick={() => sceneRef.current?.zoom(0.75)} aria-label="Acercar" disabled={status !== "ready"}>+</button>
        <button type="button" onClick={() => sceneRef.current?.zoom(1.33)} aria-label="Alejar" disabled={status !== "ready"}>−</button>
        <button type="button" onClick={toggleRotation} aria-pressed={!rotating} aria-label={rotating ? "Pausar el giro" : "Reanudar el giro"} disabled={status !== "ready"}>{rotating ? "❚❚" : "▶"}</button>
      </div>

      <aside className="basin-legend" aria-label="Leyenda del mapa">
        <p><i className="legend-gold" />Río con fichas</p>
        <p><i className="legend-blue" />Río sin fichas todavía</p>
        <p><i className="legend-pin" />Lugar aproximado de un estudio</p>
        <small>Relieve real exagerado ×11. Ríos © colaboradores de OpenStreetMap · Relieve: Mapzen/AWS (SRTM) · Imagen: NASA Blue Marble.</small>
      </aside>

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
          <p>{studies.length ? gapText(records, selected) : "Todavía no cargamos estudios de este río. ¿Conoces uno? Propónlo para revisión."}{studies.length > 4 && <span className="solo-escritorio"> En pantalla se muestran 4; el resto está en la lista.</span>}</p>
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
