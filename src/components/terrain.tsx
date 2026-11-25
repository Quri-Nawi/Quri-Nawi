"use client";

import { useEffect, useRef, useState } from "react";
import type { Area } from "../lib/catalog";

type Point = [number, number];
type View = "map" | "relief";

const places: Record<Area, Point> = { Beni: [0.51, 0.48], Kaka: [0.35, 0.65], "Madre de Dios": [0.76, 0.33] };
const rivers: Point[][] = [
  [[.19,.91],[.23,.83],[.22,.78],[.29,.72],[.35,.65],[.38,.66],[.43,.57],[.46,.54],[.51,.48],[.47,.42],[.53,.38],[.58,.34],[.61,.29],[.66,.26],[.7,.23],[.74,.13],[.79,.08]],
  [[.95,.66],[.9,.59],[.83,.57],[.82,.49],[.76,.43],[.77,.38],[.76,.33],[.71,.31],[.68,.32],[.66,.26]],
  [[.14,.73],[.19,.66],[.27,.63],[.35,.65]],
];

function project([x, y]: Point, view: View): Point {
  if (view === "map") return [x, y];
  const height = Math.max(0, .1 + .06 * Math.sin(17 * x + 11 * y) + .045 * Math.sin(28 * x - 19 * y));
  return [.5 + (x - y) * .43, .14 + (x + y) * .36 - height];
}

export function Terrain({ selected, onSelect }: { selected: Area | ""; onSelect: (area: Area) => void }) {
  const [view, setView] = useState<View>("map");
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = canvas.current;
    const ctx = node?.getContext("2d");
    if (!node || !ctx) return;
    const draw = () => {
      const { width, height } = node.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      node.width = Math.max(1, Math.round(width * density));
      node.height = Math.max(1, Math.round(height * density));
      ctx.scale(density, density);
      ctx.fillStyle = "#16372d";
      ctx.fillRect(0, 0, width, height);
      const path = (points: Point[]) => {
        ctx.beginPath();
        points.forEach((point, index) => {
          const [x, y] = project(point, view);
          if (index === 0) ctx.moveTo(x * width, y * height);
          else ctx.lineTo(x * width, y * height);
        });
        ctx.stroke();
      };
      ctx.lineWidth = .65;
      for (let stripe = 0; stripe <= 37; stripe++) {
        ctx.strokeStyle = stripe % 5 === 0 ? "#74917a68" : "#74917a37";
        const y = stripe / 37;
        path(Array.from({ length: 91 }, (_, i): Point => {
          const x = i / 90;
          return [x, view === "map" ? y + .044 * Math.sin(x * 18 + stripe / 17) + .03 * Math.sin(x * 31 + y * 8) : y];
        }));
      }
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const river of rivers) {
        ctx.lineWidth = 9;
        ctx.strokeStyle = "#84d2b441";
        path(river);
        ctx.lineWidth = 3.3;
        ctx.strokeStyle = "#a8d9b8";
        path(river);
      }
    };
    const observer = new ResizeObserver(draw);
    observer.observe(node);
    draw();
    return () => observer.disconnect();
  }, [view]);

  return (
    <div className="terrain">
      <canvas ref={canvas} aria-hidden="true" />
      <div className="map-switch" role="group" aria-label="Vista territorial">
        <button type="button" onClick={() => setView("map")} aria-pressed={view === "map"}>Mapa</button>
        <button type="button" onClick={() => setView("relief")} aria-pressed={view === "relief"}>Relieve 3D</button>
      </div>
      {(Object.entries(places) as [Area, Point][]).map(([area, point]) => {
        const [x, y] = project(point, view);
        return <button className="map-pin" key={area} type="button" style={{ left: String(x * 100) + "%", top: String(y * 100) + "%" }} onClick={() => onSelect(area)} aria-pressed={selected === area}>{area}</button>;
      })}
      <span className="map-caption">Esquema del Beni · ubicaciones aproximadas</span>
    </div>
  );
}
