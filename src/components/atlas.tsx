"use client";

import { useState } from "react";
import { areas, matrices, records, type Area } from "../lib/catalog";
import { Comparison } from "./comparison";
import { Terrain } from "./terrain";

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function Atlas() {
  const [area, setArea] = useState<Area | "">("");
  const [matrix, setMatrix] = useState("");
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<string[]>(["kaka-seca", "kaka-humeda"]);
  const [selectionNote, setSelectionNote] = useState("");
  const matching = records.filter((record) =>
    (!area || record.area === area) && (!matrix || record.matrix === matrix)
    && normalize([record.title, record.area, record.source, record.sample].join(" ")).includes(normalize(search)),
  );
  const selected = chosen.flatMap((id) => records.filter((item) => item.id === id));

  function select(id: string) {
    if (chosen.includes(id)) {
      setChosen(chosen.filter((item) => item !== id));
      setSelectionNote("Quitaste una ficha de la comparación.");
    } else if (chosen.length === 2) {
      setSelectionNote("Ya hay dos fichas. Quita una antes de agregar otra.");
    } else {
      setChosen([...chosen, id]);
      setSelectionNote("Ficha añadida para comparar.");
    }
  }

  function reset() {
    setArea("");
    setMatrix("");
    setSearch("");
  }

  return (
    <>
      <section className="section-inner explorer anchor-section" id="explorar" aria-labelledby="atlas-title">
        <div className="section-head">
          <div><p className="eyebrow">Explorar evidencia</p><h2 id="atlas-title">La cuenca del Beni</h2></div>
          <p>Selecciona un río o filtra el catálogo para encontrar el estudio y abrir su referencia.</p>
        </div>
        <div className="atlas-grid">
          <div className="atlas-map">
            <Terrain selected={area} onSelect={(place) => setArea(area === place ? "" : place)} />
            <div className="map-sub"><span><i /> Territorio piloto</span><span>Bolivia · ORO-3.3</span></div>
          </div>
          <div className="atlas-side" id="evidencia">
            <div className="filters">
              <label className="search-field">Buscar evidencia<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Estudio, río o año de muestreo" /></label>
              <label>Territorio<select value={area} onChange={(event) => setArea(event.target.value as Area | "")}><option value="">Todos</option>{areas.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Tipo de muestra<select value={matrix} onChange={(event) => setMatrix(event.target.value)}><option value="">Todos</option>{matrices.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className="result-head">
              <p aria-live="polite">{matching.length} {matching.length === 1 ? "ficha" : "fichas"}</p>
              <a href="#comparar">Comparar ({chosen.length}) ↓</a>
            </div>
            {matching.length === 0 ? <div className="empty"><p>Sin registros en este catálogo para esos filtros.</p><button type="button" className="text-button" onClick={reset}>Limpiar filtros</button></div>
              : <div className="record-list">
                {matching.map((record) => <article className="record" key={record.id}>
                  <div className="record-main">
                    <p className="record-meta">{record.area} <span>·</span> {record.matrix} <span>·</span> Publicación {record.published}</p>
                    <h3>{record.title}</h3>
                    <details><summary>Ver ficha</summary><p>{record.note}</p><p>Muestreo: {record.sample}</p><a href={record.url} target="_blank" rel="noreferrer">{record.source} ↗</a></details>
                  </div>
                  <button className="select-record" type="button" aria-label={"Comparar " + record.title} aria-pressed={chosen.includes(record.id)} onClick={() => select(record.id)}>{chosen.includes(record.id) ? "✓" : "+"}</button>
                </article>)}
              </div>}
            <p className="selection-feedback" aria-live="polite">{selectionNote}</p>
          </div>
        </div>
      </section>
      <Comparison selected={selected} onClear={() => { setChosen([]); setSelectionNote(""); }} />
    </>
  );
}
