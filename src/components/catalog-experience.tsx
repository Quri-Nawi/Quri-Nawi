"use client";

import { useEffect, useState } from "react";
import { Atlas } from "./atlas";
import { BasinHero } from "./basin-hero";
import { Guide } from "./guide";
import { includedSnapshot, loadPublicCatalog, type CatalogSnapshot } from "../lib/public-catalog";

export function CatalogExperience() {
  const [snapshot, setSnapshot] = useState<CatalogSnapshot>(includedSnapshot);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    loadPublicCatalog(controller.signal)
      .then((next) => { if (mounted) { setSnapshot(next); setState(next.records.length ? "ready" : "empty"); } })
      .catch(() => { if (mounted) setState("error"); })
      .finally(() => window.clearTimeout(timeout));
    return () => { mounted = false; controller.abort(); window.clearTimeout(timeout); };
  }, []);

  return <>
    <BasinHero records={snapshot.records} />
    <div className="section-inner guide-strip"><p>¿Primera vez? Sigue el recorrido de tres pasos.</p><Guide /></div>
    <Atlas snapshot={snapshot} state={state} onRetry={() => window.location.reload()} />
  </>;
}
