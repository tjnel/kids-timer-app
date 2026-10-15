"use client"

export function IconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="relative flex size-12 shrink-0 items-center justify-center rounded-full text-foreground-strong hover:bg-foreground/10 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-foreground-strong active:bg-foreground/15 sm:size-11"
    >
      {/* Keeps a 48px hit area on touch screens when the visible button is smaller. */}
      <span
        aria-hidden="true"
        data-hit-area
        className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
      />
      {children}
    </button>
  )
}
