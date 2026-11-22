const RING_RADIUS = 46
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/** The ring that fills around a hold button while it is being held. */
export function HoldRing({ progress, color }: { progress: number; color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full -rotate-90" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r={RING_RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={RING_LENGTH * (1 - progress)}
        opacity={progress > 0 ? 1 : 0}
      />
    </svg>
  )
}
