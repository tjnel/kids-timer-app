"use client"

/** Flat vector drawings for both themes. Frame-based variants take a `frame` index. */

export function MouseIdleSvg() {
  return (
    <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
      <ellipse cx="32" cy="58" rx="14" ry="3" fill="#2e1a08" opacity="0.16" />
      <path
        d="M46 36c8 4 12 12 10 18"
        fill="none"
        stroke="#c4a484"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="18" cy="16" r="10" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
      <circle cx="18" cy="16" r="5.5" fill="#ffb6c1" />
      <circle cx="46" cy="16" r="10" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
      <circle cx="46" cy="16" r="5.5" fill="#ffb6c1" />
      <ellipse cx="32" cy="42" rx="13" ry="15" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
      <ellipse cx="32" cy="46" rx="8" ry="9" fill="#f6efe6" />
      <circle cx="32" cy="26" r="13" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
      <circle cx="27" cy="25" r="2.2" fill="#2b2118" />
      <circle cx="37" cy="25" r="2.2" fill="#2b2118" />
      <circle cx="27.6" cy="24.4" r="0.7" fill="#fff" />
      <circle cx="37.6" cy="24.4" r="0.7" fill="#fff" />
      <ellipse cx="32" cy="29" rx="2.2" ry="1.6" fill="#ff8fab" />
      <path d="M29 32.5c1.8 1.6 4.2 1.6 6 0" fill="none" stroke="#5c4033" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 28h8M14 31h7M50 28h-8M50 31h-7" stroke="#5c4033" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="20" cy="48" rx="3.5" ry="2.6" fill="#ffb6c1" />
      <ellipse cx="44" cy="48" rx="3.5" ry="2.6" fill="#ffb6c1" />
    </svg>
  )
}

export function MouseEatSvg({ frame }: { frame: number }) {
  const f = Math.max(0, Math.min(3, frame))
  const mouthOpen = f === 0 ? 3 : f === 1 ? 7 : 2
  const cheeks = f === 2 ? 5.5 : 3.2
  const pawY = f === 0 ? 40 : 34
  return (
    <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
      <ellipse cx="32" cy="58" rx="14" ry="3" fill="#2e1a08" opacity="0.16" />
      <circle cx="17" cy="16" r="10" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
      <circle cx="17" cy="16" r="5.5" fill="#ffb6c1" />
      <circle cx="47" cy="16" r="10" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
      <circle cx="47" cy="16" r="5.5" fill="#ffb6c1" />
      <ellipse cx="32" cy="43" rx="13" ry="15" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
      <ellipse cx="32" cy="47" rx="8" ry="9" fill="#f6efe6" />
      <circle cx="32" cy="26" r="13" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
      {f === 2 ? (
        <>
          <path d="M25 24c1.5-2 3-2 4 0" fill="none" stroke="#2b2118" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M35 24c1.5-2 3-2 4 0" fill="none" stroke="#2b2118" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="27" cy="25" r="2.2" fill="#2b2118" />
          <circle cx="37" cy="25" r="2.2" fill="#2b2118" />
          <circle cx="27.6" cy="24.4" r="0.7" fill="#fff" />
          <circle cx="37.6" cy="24.4" r="0.7" fill="#fff" />
        </>
      )}
      <ellipse cx="32" cy="29" rx="2.2" ry="1.6" fill="#ff8fab" />
      <ellipse cx="32" cy="33" rx="3.4" ry={mouthOpen * 0.45} fill="#5c4033" />
      <circle cx="24" cy="31" r={cheeks} fill="#f4c2c2" opacity="0.7" />
      <circle cx="40" cy="31" r={cheeks} fill="#f4c2c2" opacity="0.7" />
      {f < 3 ? (
        <circle cx="40" cy={pawY} r="4" fill="#ffd93d" stroke="#e6b800" strokeWidth="1" />
      ) : (
        <ellipse cx="44" cy="50" rx="5" ry="3" fill="#ffb6c1" />
      )}
      <ellipse cx="20" cy="48" rx="3.5" ry="2.6" fill="#ffb6c1" />
      <ellipse cx="44" cy="48" rx="3.5" ry="2.6" fill="#ffb6c1" />
    </svg>
  )
}

export function MouseRunSvg({ frame }: { frame: number }) {
  const f = Math.max(0, Math.min(3, frame))
  const lean = f === 1 ? -6 : f === 3 ? 4 : 0
  const frontLeg = f === 0 || f === 3 ? 52 : 46
  const backLeg = f === 0 || f === 3 ? 46 : 52
  return (
    <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
      <ellipse cx="32" cy="58" rx="16" ry="3" fill="#2e1a08" opacity="0.16" />
      <g transform={`rotate(${lean} 32 36)`}>
        <path
          d="M48 34c8 2 12 8 11 16"
          fill="none"
          stroke="#c4a484"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <ellipse cx="34" cy="38" rx="14" ry="11" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
        <circle cx="46" cy="26" r="10" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
        <circle cx="42" cy="14" r="7" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
        <circle cx="42" cy="14" r="3.6" fill="#ffb6c1" />
        <circle cx="52" cy="16" r="7" fill="#e8ddd0" stroke="#5c4033" strokeWidth="2.2" />
        <circle cx="52" cy="16" r="3.6" fill="#ffb6c1" />
        <circle cx="49" cy="25" r="1.8" fill="#2b2118" />
        <circle cx="49.5" cy="24.5" r="0.6" fill="#fff" />
        <ellipse cx="52" cy="28" rx="1.8" ry="1.2" fill="#ff8fab" />
        <rect x="28" y={frontLeg} width="4" height="8" rx="2" fill="#e8ddd0" stroke="#5c4033" strokeWidth="1.4" />
        <rect x="38" y={backLeg} width="4" height="8" rx="2" fill="#e8ddd0" stroke="#5c4033" strokeWidth="1.4" />
      </g>
    </svg>
  )
}

export function CheeseSvg({ frame = 0 }: { frame?: number }) {
  const f = Math.max(0, Math.min(3, frame))
  if (f === 3) {
    return (
      <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
        <g transform="translate(32 40) scale(1.3) translate(-32 -46)">
          <ellipse cx="32" cy="54" rx="12" ry="3" fill="#2e1a08" opacity="0.14" />
          <path d="M20 44l6-8 8 4-4 10z" fill="#ffd93d" stroke="#d4a017" strokeWidth="2" />
          <path d="M36 46l8-6 6 8-10 4z" fill="#ffe566" stroke="#d4a017" strokeWidth="2" />
          <circle cx="28" cy="50" r="2.4" fill="#ffd93d" stroke="#d4a017" strokeWidth="1.4" />
          <circle cx="40" cy="52" r="1.8" fill="#ffe566" stroke="#d4a017" strokeWidth="1.2" />
          <circle cx="24" cy="38" r="1.2" fill="#fff4a3" />
          <circle cx="44" cy="36" r="1" fill="#fff4a3" />
        </g>
      </svg>
    )
  }

  const tipCut = f === 0 ? 48 : f === 1 ? 40 : 32
  const bite =
    f === 0
      ? ""
      : f === 1
        ? "M48 28c-4 2-6 6-5 10 3 1 8-2 10-6z"
        : "M44 24c-8 4-12 12-10 20 8 2 16-8 18-16z"

  return (
    <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
      {/* The wedge is drawn in a 32x26 box; scale it up so it fills the cell. */}
      <g transform="translate(32 36) scale(1.45) translate(-33 -37)">
        <ellipse cx="33" cy="51" rx="17" ry="3" fill="#2e1a08" opacity="0.16" />
        <polygon
          points={`18,48 ${tipCut},22 50,48`}
          fill="#ffd93d"
          stroke="#d4a017"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon points="18,48 50,48 46,40 24,40" fill="#f5c518" opacity="0.7" />
        {f === 0 && <polygon points="48,22 50,48 42,40" fill="#ffe566" opacity="0.8" />}
        {f > 0 && <path d={bite} fill="#fff6c2" stroke="#d4a017" strokeWidth="1.4" />}
        <circle cx="28" cy="40" r="3.2" fill="#e6b800" />
        <circle cx="36" cy="36" r="2.2" fill="#e6b800" />
        {f < 2 && <circle cx="32" cy="44" r="2.6" fill="#e6b800" />}
      </g>
    </svg>
  )
}

export function CarSvg({ driving = false, frame = 0 }: { driving?: boolean; frame?: number }) {
  const bounce = driving ? (frame % 2 === 0 ? -1 : 1) : 0
  return (
    <svg viewBox="0 0 80 48" className="size-full" aria-hidden="true">
      <ellipse cx="40" cy="42" rx="22" ry="3" fill="#2e1a08" opacity="0.16" />
      <g transform={`translate(0 ${bounce})`}>
        <path d="M16 30c2-10 10-16 24-16 12 0 22 6 26 16z" fill="#e53935" stroke="#b71c1c" strokeWidth="2" />
        <path d="M28 18c4-6 12-8 20-6l4 8H30z" fill="#81d4fa" stroke="#0288d1" strokeWidth="1.6" />
        <rect x="18" y="26" width="46" height="6" rx="1" fill="#fff" />
        <circle cx="22" cy="28" r="5" fill="#fff" stroke="#b71c1c" strokeWidth="1.4" />
        <text x="22" y="31" textAnchor="middle" fontSize="7" fontWeight="700" fill="#e53935">
          1
        </text>
        <rect x="58" y="14" width="8" height="4" rx="1" fill="#e53935" stroke="#b71c1c" strokeWidth="1.2" />
        <circle cx="26" cy="36" r="6" fill="#2b2118" />
        <circle cx="26" cy="36" r="2.4" fill="#9e9e9e" />
        <circle cx="56" cy="36" r="6" fill="#2b2118" />
        <circle cx="56" cy="36" r="2.4" fill="#9e9e9e" />
        <ellipse cx="68" cy="28" rx="3" ry="2" fill="#ffd93d" />
        {driving && (
          <path d="M10 28h-6M12 32h-8" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        )}
      </g>
    </svg>
  )
}

export function FlagSvg({ frame = 0 }: { frame?: number }) {
  const wave = 4 + (frame % 3) * 2
  return (
    <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
      <ellipse cx="24" cy="56" rx="10" ry="2.6" fill="#2e1a08" opacity="0.16" />
      <rect x="20" y="10" width="4" height="46" rx="1.5" fill="#5c4033" />
      <path
        d={`M24 12h22c-2 ${wave} 2 ${wave + 8} 0 ${wave + 16} 2 ${wave} -2 12 0 16H24z`}
        fill="#fafafa"
        stroke="#2b2118"
        strokeWidth="2"
      />
      <path d="M28 14h6v6h-6zM40 14h6v6h-6zM34 20h6v6h-6zM28 26h6v6h-6zM40 26h6v6h-6z" fill="#2b2118" />
    </svg>
  )
}
