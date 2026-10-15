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
      className="flex size-11 items-center justify-center rounded-full text-foreground-strong hover:bg-foreground/10 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-foreground-strong active:bg-foreground/15"
    >
      {children}
    </button>
  )
}
