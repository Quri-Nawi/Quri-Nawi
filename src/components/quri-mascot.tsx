"use client";

import { useId } from "react";

type QuriMascotProps = {
  variant?: "medallion" | "bust" | "full";
  speaking?: boolean;
  reducedMotion?: boolean;
  className?: string;
};

function EyeHead({
  cx,
  cy,
  rx,
  ry,
  speaking,
  clipId,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  speaking: boolean;
  clipId: string;
}) {
  const irisR = ry * 0.78;
  const riverColor = speaking ? "#8fdcff" : "#102820";
  const irisColor = speaking ? "#ffe394" : "#d6b66a";
  const eyePath = `M ${cx - rx} ${cy} Q ${cx} ${cy - ry * 2} ${cx + rx} ${cy} Q ${cx} ${cy + ry * 2} ${cx - rx} ${cy} Z`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={irisR} />
        </clipPath>
      </defs>

      {/* Destellos radiales cartográficos */}
      <line x1={cx} y1={cy - ry - 7.5} x2={cx} y2={cy - ry - 3.2} stroke="#ffd36b" strokeWidth="1.4" strokeLinecap="round" />
      <line x1={cx - rx - 7} y1={cy} x2={cx - rx - 3} y2={cy} stroke="#ffd36b" strokeWidth="1.3" strokeLinecap="round" />
      {!speaking && <line x1={cx + rx + 3} y1={cy} x2={cx + rx + 7} y2={cy} stroke="#ffd36b" strokeWidth="1.3" strokeLinecap="round" />}
      <line x1={cx - rx * 0.68} y1={cy - ry - 5.2} x2={cx - rx * 0.52} y2={cy - ry - 2.2} stroke="#d6b66a" strokeWidth="1.2" strokeLinecap="round" />
      <line x1={cx + rx * 0.68} y1={cy - ry - 5.2} x2={cx + rx * 0.52} y2={cy - ry - 2.2} stroke="#d6b66a" strokeWidth="1.2" strokeLinecap="round" />

      {/* Fondo y contorno del ojo */}
      <path d={eyePath} fill="#0b1f19" />
      <g clipPath={`url(#${clipId})`}>
        <circle cx={cx} cy={cy} r={irisR} fill={irisColor} />
        <path
          d={`M ${cx + irisR * 0.25} ${cy - irisR * 1.1}
             C ${cx + irisR * 0.58} ${cy - irisR * 0.55}, ${cx - irisR * 0.58} ${cy - irisR * 0.35}, ${cx - irisR * 0.26} ${cy - irisR * 0.04}
             C ${cx + irisR * 0.04} ${cy + irisR * 0.22}, ${cx + irisR * 0.56} ${cy + irisR * 0.38}, ${cx + irisR * 0.12} ${cy + irisR * 0.72}
             C ${cx - irisR * 0.12} ${cy + irisR * 0.9}, ${cx - irisR * 0.3} ${cy + irisR * 1.02}, ${cx - irisR * 0.38} ${cy + irisR * 1.12}`}
          fill="none"
          stroke={riverColor}
          strokeWidth={irisR * 0.44}
          strokeLinecap="round"
        />
      </g>
      <path d={eyePath} fill="none" stroke="#fff6dd" strokeWidth="2.1" strokeLinejoin="round" />
    </g>
  );
}

export function QuriMascot({
  variant = "bust",
  speaking = false,
  reducedMotion = false,
  className = "",
}: QuriMascotProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `quri-iris-${rawId}`;
  const glowId = `quri-glow-${rawId}`;

  const stateClass = [
    "quri-svg",
    `quri-svg-${variant}`,
    speaking ? "is-speaking" : "",
    reducedMotion ? "is-static" : "",
    className,
  ].filter(Boolean).join(" ");

  if (variant === "medallion") {
    const eyePath = "M 12 32 Q 32 11 52 32 Q 32 53 12 32 Z";
    return (
      <svg
        className={stateClass}
        viewBox="0 0 64 64"
        width={24}
        height={24}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="32" cy="32" r="8" />
          </clipPath>
        </defs>
        <circle cx="32" cy="32" r="29.5" fill="#0d241d" stroke={speaking ? "#ffd36b" : "#d6b66a"} strokeWidth="2.4" />
        <circle cx="32" cy="32" r="25.2" fill="none" stroke="#d6b66a" strokeOpacity="0.35" strokeWidth="0.9" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="32"
            y1="6"
            x2="32"
            y2={deg % 90 === 0 ? "10.2" : "8.6"}
            stroke="#d6b66a"
            strokeWidth={deg % 90 === 0 ? "1.5" : "1"}
            strokeLinecap="round"
            transform={`rotate(${deg} 32 32)`}
          />
        ))}
        <path d={eyePath} fill="#102820" />
        <g clipPath={`url(#${clipId})`}>
          <circle cx="32" cy="32" r="8" fill={speaking ? "#ffe394" : "#d6b66a"} />
          <path
            d="M 34 23 C 36.8 27.2, 27.2 29, 29.8 31.8 C 32 34.2, 36.4 35.4, 33 38.4 C 31.2 39.8, 29.6 40.6, 28.8 41.4"
            fill="none"
            stroke={speaking ? "#8fdcff" : "#102820"}
            strokeWidth="3.3"
            strokeLinecap="round"
          />
        </g>
        <path d={eyePath} fill="none" stroke="#fff6dd" strokeWidth="2.1" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === "full") {
    return (
      <svg
        className={stateClass}
        viewBox="0 0 132 192"
        width={76}
        height={110}
        aria-hidden="true"
        focusable="false"
      >
        <path d="M 56 126 L 57 174 L 49 181 L 61 181 L 62 126" fill="none" stroke="#fff6dd" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M 76 126 L 75 174 L 83 181 L 71 181 L 70 126" fill="none" stroke="#fff6dd" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M 41 78 L 32 116 L 35 123" fill="none" stroke="#fff6dd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 91 78 L 100 116 L 97 123" fill="none" stroke="#fff6dd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M 55 52 L 42 62 L 37 142 L 58 148 L 62 72 L 70 72 L 74 148 L 95 142 L 90 62 L 77 52 Z"
          fill="#163a2f"
          stroke="#d6b66a"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M 56 48 L 56 56 Q 45 64 38 82 L 56 79 Q 62 67 64 59 L 68 59 Q 70 67 76 79 L 94 82 Q 87 64 76 56 L 76 48 Z"
          fill="#1b4639"
          stroke="#d6b66a"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <rect x="61.5" y="56.5" width="9" height="4.5" rx="2.2" fill="#163a2f" stroke="#ffd36b" strokeWidth="1.5" />
        <path d="M 42 104 Q 52 114 45 132" fill="none" stroke="#d6b66a" strokeOpacity="0.65" strokeWidth="1.1" strokeDasharray="3 2.5" />
        <path d="M 90 104 Q 80 114 87 132" fill="none" stroke="#d6b66a" strokeOpacity="0.65" strokeWidth="1.1" strokeDasharray="3 2.5" />
        <path d="M 48 68 L 52 68 M 50 66 L 50 70" stroke="#d6b66a" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M 80 102 L 84 102 M 82 100 L 82 104" stroke="#d6b66a" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="63" y1="41" x2="63" y2="49" stroke="#fff6dd" strokeWidth="1.7" />
        <line x1="69" y1="41" x2="69" y2="49" stroke="#fff6dd" strokeWidth="1.7" />
        <EyeHead cx={66} cy={28} rx={21} ry={11} speaking={speaking} clipId={clipId} />
      </svg>
    );
  }

  // variant === "bust" (retrato editorial con halo sutil para el panel de río y vista 2D)
  return (
    <svg
      className={stateClass}
      viewBox="0 0 116 104"
      width={72}
      height={64}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={glowId} cx="46%" cy="32%" r="54%">
          <stop offset="0%" stopColor={speaking ? "#8fdcff" : "#ffd36b"} stopOpacity={speaking ? "0.28" : "0.18"} />
          <stop offset="100%" stopColor="#0b211a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo cálido/celeste de presencia */}
      <circle cx="52" cy="40" r="44" fill={`url(#${glowId})`} />

      {/* Brazo presentador cuando habla vs reposo */}
      {speaking ? (
        <path
          d="M 74 68 L 88 74 L 101 58 L 107 56"
          fill="none"
          stroke="#fff6dd"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path d="M 76 70 L 84 100" fill="none" stroke="#fff6dd" strokeWidth="1.9" strokeLinecap="round" />
      )}
      <path d="M 28 70 L 21 100" fill="none" stroke="#fff6dd" strokeWidth="1.9" strokeLinecap="round" />

      {/* Capa / torso cartográfico */}
      <path
        d="M 41 53 L 28 63 L 24 102 L 46 102 L 50 70 L 54 70 L 58 102 L 80 102 L 76 63 L 63 53 Z"
        fill="#163c30"
        stroke="#e3c478"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M 43 49 L 43 56 Q 32 63 25 78 L 43 75 Q 48 65 50 59 L 54 59 Q 56 65 61 75 L 79 78 Q 72 63 61 56 L 61 49 Z"
        fill="#1e4d3f"
        stroke="#e3c478"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <rect x="47.5" y="56.5" width="9" height="4.4" rx="2.2" fill="#163c30" stroke="#ffd36b" strokeWidth="1.6" />

      {/* Curvas de nivel y marcas topográficas */}
      <path d="M 31 82 Q 39 89 34 99" fill="none" stroke="#ffd36b" strokeOpacity="0.65" strokeWidth="1.1" strokeDasharray="3 2.5" />
      <path d="M 73 82 Q 65 89 70 99" fill="none" stroke="#ffd36b" strokeOpacity="0.65" strokeWidth="1.1" strokeDasharray="3 2.5" />
      <path d="M 35 66 L 39 66 M 37 64 L 37 68" stroke="#ffd36b" strokeWidth="1.15" strokeLinecap="round" />

      {/* Cuello y cabeza */}
      <line x1="49" y1="41" x2="49" y2="50" stroke="#fff6dd" strokeWidth="1.8" />
      <line x1="55" y1="41" x2="55" y2="50" stroke="#fff6dd" strokeWidth="1.8" />
      <EyeHead cx={52} cy={28} rx={21} ry={11.2} speaking={speaking} clipId={clipId} />

      {/* Ondas sonoras doradas cuando está reproduciendo */}
      {speaking && (
        <g className="quri-waves">
          <path className="quri-wave quri-wave-1" d="M 80 20 Q 86 28 80 36" fill="none" stroke="#ffd36b" strokeWidth="2" strokeLinecap="round" />
          <path className="quri-wave quri-wave-2" d="M 87 15 Q 96 28 87 41" fill="none" stroke="#ffd36b" strokeWidth="1.8" strokeLinecap="round" />
          <path className="quri-wave quri-wave-3" d="M 94 10 Q 106 28 94 46" fill="none" stroke="#ffd36b" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M 79 28 Q 83 22 87 28 T 95 28 T 103 28 T 111 28"
            fill="none"
            stroke="#8fdcff"
            strokeWidth="1.2"
            strokeDasharray="1.6 2.2"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
