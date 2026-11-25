"use client";

import { useRef } from "react";

const steps = [
  { title: "Explora el Beni", text: "Filtra por territorio y tipo de muestra.", href: "#explorar" },
  { title: "Compara dos fichas", text: "Distingue la fecha de muestreo, la publicación y el método.", href: "#comparar" },
  { title: "Propón un estudio", text: "Guarda una referencia para revisión.", href: "#aportar" },
];

export function Guide() {
  const dialog = useRef<HTMLDialogElement>(null);

  return <>
    <button className="button outline" type="button" onClick={() => dialog.current?.showModal()}>Recorrido guiado <span aria-hidden="true">↗</span></button>
    <dialog ref={dialog} aria-labelledby="guide-title">
      <div className="dialog-head"><h2 id="guide-title">Recorrido con Quri</h2><form method="dialog"><button type="submit" aria-label="Cerrar recorrido">×</button></form></div>
      <ol className="guide-list">
        {steps.map((step) => <li key={step.href}><a href={step.href} onClick={() => dialog.current?.close()}>{step.title} ↗</a><p>{step.text}</p></li>)}
      </ol>
    </dialog>
  </>;
}
