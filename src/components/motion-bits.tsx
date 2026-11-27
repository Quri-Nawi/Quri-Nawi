"use client";

import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Número que cuenta desde su valor anterior hasta el nuevo. */
export function Counter({ value, duration = 700 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value || reduced()) { from.current = value; setShown(value); return; }
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min((now - began) / duration, 1);
      const current = Math.round(start + (value - start) * (1 - (1 - t) ** 3));
      setShown(current);
      from.current = current;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{shown}</>;
}

/** Curva pequeña con un punto que marca el valor actual; se dibuja al aparecer. */
export function Spark({ values, current, width = 86, height = 28 }: { values: readonly number[]; current: number; width?: number; height?: number }) {
  const max = Math.max(...values), min = Math.min(...values);
  const point = (value: number, index: number) => [4 + (index / Math.max(values.length - 1, 1)) * (width - 8), height - 4 - ((value - min) / Math.max(max - min, 1)) * (height - 8)];
  const path = values.map((value, index) => point(value, index).join(",")).join(" ");
  const [x, y] = point(values[current], current);
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={path} pathLength={1} />
      <circle cx={x} cy={y} r={3.5} />
    </svg>
  );
}

/** Fila de puntos escalonados; cada uno con su color y su etiqueta accesible. */
export function Dots({ items }: { items: readonly { label: string; color: string }[] }) {
  return (
    <span className="dots" role="img" aria-label={items.map((item) => item.label).join(", ")}>
      {items.map((item, index) => <i key={item.label} title={item.label} style={{ background: item.color, ["--d" as string]: index }} />)}
    </span>
  );
}
