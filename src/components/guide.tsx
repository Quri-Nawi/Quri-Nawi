"use client";

import { useRef } from "react";
import { QuriMascot } from "./quri-mascot";

const steps = [
  {
    title: "Selecciona un río y escucha a Quri",
    text: "En el mapa 3D o en el filtro del atlas, Quri resume qué estudios hay, separa muestreo de publicación y señala qué falta verificar.",
    href: "#explorar",
  },
  {
    title: "Compara dos fichas",
    text: "Revisa la fecha de muestreo, la unidad, el método y los límites de cada registro antes de interpretar diferencias.",
    href: "#comparar",
  },
  {
    title: "Propón un estudio",
    text: "Cuando faltan fichas en el catálogo, guarda una fuente pública o DOI como borrador para revisión.",
    href: "#aportar",
  },
];

export function Guide() {
  const dialog = useRef<HTMLDialogElement>(null);

  function openSampleRiver(river: "Kaka" | "Beni") {
    dialog.current?.close();
    window.dispatchEvent(new CustomEvent("quri:focus-river", { detail: river }));
    window.dispatchEvent(new CustomEvent("quri:area", { detail: river }));
  }

  return (
    <>
      <button className="button outline guide-trigger" type="button" onClick={() => dialog.current?.showModal()}>
        <QuriMascot variant="medallion" className="guide-trigger-icon" />
        Recorrido con Quri <span aria-hidden="true">↗</span>
      </button>
      <dialog ref={dialog} aria-labelledby="guide-title">
        <div className="dialog-head">
          <h2 id="guide-title">Recorrido con Quri</h2>
          <form method="dialog">
            <button type="submit" aria-label="Cerrar recorrido">×</button>
          </form>
        </div>
        <div className="guide-intro">
          <QuriMascot variant="full" className="guide-figure" />
          <div>
            <p>
              Soy <strong>Quri</strong>, guía del catálogo. Al elegir un río te cuento qué estudios existen, en qué año se tomaron las muestras y qué datos faltan por verificar.
            </p>
            <div className="guide-quick-rivers">
              <button className="button primary" type="button" onClick={() => openSampleRiver("Kaka")}>
                Ir al río Kaka ↗
              </button>
              <button className="button outline" type="button" onClick={() => openSampleRiver("Beni")}>
                Ir al río Beni ↗
              </button>
            </div>
          </div>
        </div>
        <ol className="guide-list">
          {steps.map((step) => (
            <li key={step.href}>
              <a href={step.href} onClick={() => dialog.current?.close()}>{step.title} ↗</a>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </dialog>
    </>
  );
}
