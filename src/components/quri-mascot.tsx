type QuriMascotProps = {
  variant?: "medallion" | "bust" | "full";
  speaking?: boolean;
  reducedMotion?: boolean;
  className?: string;
};

function EyeHead({ cx, cy, rx, ry, speaking }: { cx: number; cy: number; rx: number; ry: number; speaking: boolean }) {
  const irisR = Math.min(rx, ry) * 0.72;
  const riverColor = speaking ? "#8fdcff" : "#122d24";
  const irisColor = speaking ? "#ffe08a" : "#d6b66a";

  return (
    <g>
      {/* Destellos radiales discretos */}
      <line x1={cx} y1={cy - ry - 9} x2={cx} y2={cy - ry - 4} stroke="#d6b66a" strokeWidth="1.3" strokeLinecap="round" />
      <line x1={cx} y1={cy + ry + 4} x2={cx} y2={cy + ry + 8} stroke="#d6b66a" strokeWidth="1.2" strokeLinecap="round" />
      <line x1={cx - rx - 9} y1={cy} x2={cx - rx - 4} y2={cy} stroke="#d6b66a" strokeWidth="1.3" strokeLinecap="round" />
      {!speaking && <line x1={cx + rx + 4} y1={cy} x2={cx + rx + 9} y2={cy} stroke="#d6b66a" strokeWidth="1.3" strokeLinecap="round" />}
      <line x1={cx - rx * 0.72} y1={cy - ry - 6} x2={cx - rx * 0.58} y2={cy - ry - 2.5} stroke="#d6b66a" strokeWidth="1.1" strokeLinecap="round" />
      <line x1={cx + rx * 0.72} y1={cy - ry - 6} x2={cx + rx * 0.58} y2={cy - ry - 2.5} stroke="#d6b66a" strokeWidth="1.1" strokeLinecap="round" />

      {/* Contorno de ojo almendrado */}
      <path
        d={`M ${cx - rx} ${cy} Q ${cx} ${cy - ry * 1.38} ${cx + rx} ${cy} Q ${cx} ${cy + ry * 1.38} ${cx - rx} ${cy} Z`}
        fill="#102820"
        stroke="#fff6dd"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />

      {/* Iris ocre/dorado con meandro del río */}
      <circle cx={cx} cy={cy} r={irisR} fill={irisColor} />
      <path
        d={`M ${cx + irisR * 0.22} ${cy - irisR * 0.96}
           C ${cx + irisR * 0.52} ${cy - irisR * 0.55}, ${cx - irisR * 0.55} ${cy - irisR * 0.35}, ${cx - irisR * 0.28} ${cy - irisR * 0.05}
           C ${cx - irisR * 0.02} ${cy + irisR * 0.2}, ${cx + irisR * 0.55} ${cy + irisR * 0.36}, ${cx + irisR * 0.14} ${cy + irisR * 0.68}
           C ${cx - irisR * 0.08} ${cy + irisR * 0.84}, ${cx - irisR * 0.28} ${cy + irisR * 0.92}, ${cx - irisR * 0.35} ${cy + irisR * 0.98}`}
        fill="none"
        stroke={riverColor}
        strokeWidth={irisR * 0.4}
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - rx} ${cy} Q ${cx} ${cy - ry * 1.38} ${cx + rx} ${cy} Q ${cx} ${cy + ry * 1.38} ${cx - rx} ${cy} Z`}
        fill="none"
        stroke="#fff6dd"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function QuriMascot({
  variant = "bust",
  speaking = false,
  reducedMotion = false,
  className = "",
}: QuriMascotProps) {
  const stateClass = [
    "quri-svg",
    `quri-svg-${variant}`,
    speaking ? "is-speaking" : "",
    reducedMotion ? "is-static" : "",
    className,
  ].filter(Boolean).join(" ");

  if (variant === "medallion") {
    return (
      <svg className={stateClass} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r="29" fill="#0d241d" stroke="#d6b66a" strokeWidth="2.2" />
        <circle cx="32" cy="32" r="25" fill="none" stroke="#d6b66a" strokeOpacity="0.35" strokeWidth="0.9" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="32"
            y1="6.5"
            x2="32"
            y2={deg % 90 === 0 ? "11" : "9.2"}
            stroke="#d6b66a"
            strokeWidth={deg % 90 === 0 ? "1.4" : "1"}
            strokeLinecap="round"
            transform={`rotate(${deg} 32 32)`}
          />
        ))}
        <path
          d="M 14 32 Q 32 17.5 50 32 Q 32 46.5 14 32 Z"
          fill="#102820"
          stroke="#fff6dd"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="32" r="8.2" fill={speaking ? "#ffe08a" : "#d6b66a"} />
        <path
          d="M 33.8 24.1 C 36.2 27.4, 27.6 29.2, 29.8 31.8 C 31.8 34, 36.2 35.1, 33.1 37.8 C 31.4 39.1, 29.8 39.8, 29.1 40.2"
          fill="none"
          stroke={speaking ? "#8fdcff" : "#122d24"}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M 14 32 Q 32 17.5 50 32 Q 32 46.5 14 32 Z"
          fill="none"
          stroke="#fff6dd"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (variant === "full") {
    return (
      <svg className={stateClass} viewBox="0 0 132 196" aria-hidden="true" focusable="false">
        {/* Piernas y botas */}
        <path d="M 56 126 L 57 176 L 49 183 L 61 183 L 62 126" fill="none" stroke="#fff6dd" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M 76 126 L 75 176 L 83 183 L 71 183 L 70 126" fill="none" stroke="#fff6dd" strokeWidth="1.8" strokeLinejoin="round" />

        {/* Brazos */}
        <path d="M 41 78 L 32 118 L 35 125" fill="none" stroke="#fff6dd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 91 78 L 100 118 L 97 125" fill="none" stroke="#fff6dd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Capa larga cartográfica */}
        <path
          d="M 55 52 L 42 62 L 37 142 L 58 148 L 62 72 L 70 72 L 74 148 L 95 142 L 90 62 L 77 52 Z"
          fill="#163a2f"
          stroke="#d6b66a"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Esclavina superior y cuello */}
        <path
          d="M 56 48 L 56 56 Q 45 64 38 82 L 56 79 Q 62 67 64 59 L 68 59 Q 70 67 76 79 L 94 82 Q 87 64 76 56 L 76 48 Z"
          fill="#1b4639"
          stroke="#d6b66a"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <rect x="61.5" y="56.5" width="9" height="4.5" rx="2.2" fill="#163a2f" stroke="#ffd36b" strokeWidth="1.5" />

        {/* Líneas topográficas punteadas en la capa */}
        <path d="M 42 104 Q 52 114 45 132" fill="none" stroke="#d6b66a" strokeOpacity="0.65" strokeWidth="1.1" strokeDasharray="3 2.5" />
        <path d="M 90 104 Q 80 114 87 132" fill="none" stroke="#d6b66a" strokeOpacity="0.65" strokeWidth="1.1" strokeDasharray="3 2.5" />
        <path d="M 48 68 L 52 68 M 50 66 L 50 70" stroke="#d6b66a" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M 80 102 L 84 102 M 82 100 L 82 104" stroke="#d6b66a" strokeWidth="1.1" strokeLinecap="round" />

        {/* Cuello y cabeza de ojo */}
        <line x1="63" y1="42" x2="63" y2="49" stroke="#fff6dd" strokeWidth="1.7" />
        <line x1="69" y1="42" x2="69" y2="49" stroke="#fff6dd" strokeWidth="1.7" />
        <EyeHead cx={66} cy={29} rx={22} ry={12} speaking={speaking} />
      </svg>
    );
  }

  // variant === "bust" (predeterminado en panel de río y vista 2D)
  return (
    <svg className={stateClass} viewBox="0 0 124 104" aria-hidden="true" focusable="false">
      {/* Brazo presentador cuando habla vs reposo */}
      {speaking ? (
        <path
          d="M 76 66 L 90 74 L 103 58 L 109 56"
          fill="none"
          stroke="#fff6dd"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path d="M 79 68 L 86 96" fill="none" stroke="#fff6dd" strokeWidth="1.9" strokeLinecap="round" />
      )}
      <path d="M 27 68 L 21 96" fill="none" stroke="#fff6dd" strokeWidth="1.9" strokeLinecap="round" />

      {/* Capa / torso cartográfico */}
      <path
        d="M 42 50 L 28 60 L 24 99 L 47 99 L 51 67 L 55 67 L 59 99 L 82 99 L 78 60 L 64 50 Z"
        fill="#163a2f"
        stroke="#d6b66a"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M 44 46 L 44 53 Q 33 60 26 76 L 44 73 Q 49 63 51 56 L 55 56 Q 57 63 62 73 L 80 76 Q 73 60 62 53 L 62 46 Z"
        fill="#1b4639"
        stroke="#d6b66a"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <rect x="48.5" y="53.5" width="9" height="4.4" rx="2.2" fill="#163a2f" stroke="#ffd36b" strokeWidth="1.5" />

      {/* Detalles topográficos */}
      <path d="M 31 80 Q 40 87 34 97" fill="none" stroke="#d6b66a" strokeOpacity="0.7" strokeWidth="1.1" strokeDasharray="3 2.5" />
      <path d="M 75 80 Q 66 87 72 97" fill="none" stroke="#d6b66a" strokeOpacity="0.7" strokeWidth="1.1" strokeDasharray="3 2.5" />
      <path d="M 36 64 L 40 64 M 38 62 L 38 66" stroke="#d6b66a" strokeWidth="1.1" strokeLinecap="round" />

      {/* Cuello y cabeza */}
      <line x1="50" y1="40" x2="50" y2="47" stroke="#fff6dd" strokeWidth="1.7" />
      <line x1="56" y1="40" x2="56" y2="47" stroke="#fff6dd" strokeWidth="1.7" />
      <EyeHead cx={53} cy={27} rx={21} ry={11.5} speaking={speaking} />

      {/* Ondas sonoras doradas cuando está reproduciendo */}
      {speaking && (
        <g className="quri-waves">
          <path className="quri-wave quri-wave-1" d="M 81 20 Q 87 27 81 34" fill="none" stroke="#ffd36b" strokeWidth="1.8" strokeLinecap="round" />
          <path className="quri-wave quri-wave-2" d="M 88 15 Q 97 27 88 39" fill="none" stroke="#ffd36b" strokeWidth="1.7" strokeLinecap="round" />
          <path className="quri-wave quri-wave-3" d="M 95 10 Q 107 27 95 44" fill="none" stroke="#ffd36b" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M 80 27 Q 84 21 88 27 T 96 27 T 104 27 T 112 27"
            fill="none"
            stroke="#ffe6ae"
            strokeWidth="1.1"
            strokeDasharray="1.5 2.2"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
