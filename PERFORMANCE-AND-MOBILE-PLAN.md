# Kids Timer — Performance, Mobile, and Animation Plan

## Cursor `/write-plan` note

The **`/write-plan` Cursor command is deprecated** and is slated to be removed in a future major release. For structured, step-by-step implementation plans, use the **Superpowers `writing-plans`** skill so the plan matches that workflow.

---

## 1. Timer interval: avoid resetting every second (`hooks/use-timer.ts`)

**Issue:** `useEffect` depends on `totalSeconds`, so each tick tears down and recreates `setInterval`, adding jitter and extra work.

**Direction:** Keep **one** interval while running and read the latest values from refs. Store `onIntervalComplete` / `onTimerComplete` in refs so the effect does not re-subscribe when parents pass new function identities.

```ts
// Pattern: stable interval, refs for "initial total" and callbacks
const totalSecondsRef = useRef(totalSeconds)
const initialTotalRef = useRef(initialMinutes * 60 + initialSeconds)

useEffect(() => {
  totalSecondsRef.current = totalSeconds
}, [totalSeconds])

useEffect(() => {
  initialTotalRef.current = initialMinutes * 60 + initialSeconds
}, [initialMinutes, initialSeconds])

useEffect(() => {
  if (!isRunning) return
  const id = window.setInterval(() => {
    setTotalSeconds((prev) => {
      if (prev <= 0) return 0
      const next = prev - 1
      const elapsed = initialTotalRef.current - next
      const done = Math.floor(elapsed / intervalDuration)
      if (done > lastIntervalCheck.current) {
        lastIntervalCheck.current = done
        setCompletedIntervals(done)
        onIntervalCompleteRef.current?.(done)
      }
      if (next <= 0) {
        setIsRunning(false)
        onTimerCompleteRef.current?.()
        return 0
      }
      return next
    })
  }, 1000)
  return () => clearInterval(id)
}, [isRunning, intervalDuration]) // not totalSeconds
```

---

## 2. Progress bar direction (`components/kids-timer.tsx`)

**Issue:** The bar uses **remaining** intervals over total, so it **shrinks** as segments finish. Typical UX is “fill up as you go.”

**Fix (if you want completed progress):**

```tsx
animate={{
  width: `${(timer.completedIntervals / timer.totalIntervals) * 100}%`,
}}
```

If “time left” is intentional, rename the label or invert the visual so it is obvious.

---

## 3. `TimerGrid`: `window` during render + no resize (`components/timer-grid.tsx`)

**Issue:** `getGridCols()` reads `window.innerWidth` **during render** without subscribing to resize; first paint and orientation changes can be wrong.

**Direction:** Use `useSyncExternalStore` or `matchMedia` + state (or existing `useIsMobile` patterns).

```tsx
const [cols, setCols] = useState(7)

useEffect(() => {
  const mq = window.matchMedia("(max-width: 399px)")
  const update = () => setCols(mq.matches ? 5 : 7)
  update()
  mq.addEventListener("change", update)
  return () => mq.removeEventListener("change", update)
}, [])

// Then apply your existing logic with `cols` as maxCols
```

---

## 4. `prevCompleted` / `justAte` effect (`components/timer-grid.tsx`)

**Issue:** When `completedIntervals > prevCompleted`, `setPrevCompleted(completedIntervals)` was not called in that branch, leaving `prevCompleted` stale.

**Safer pattern:**

```tsx
useEffect(() => {
  if (completedIntervals > prevCompleted) {
    setJustAte(true)
    const t = setTimeout(() => setJustAte(false), 600)
    setPrevCompleted(completedIntervals)
    return () => clearTimeout(t)
  }
}, [completedIntervals, prevCompleted])
```

---

## 5. Reuse `AudioContext` (`components/kids-timer.tsx`)

**Issue:** Creating a **new** `AudioContext` on every chime and fanfare is costly and can fail on strict mobile policies after many plays.

**Direction:** One shared context (module-level or `useRef`) + `resume()` on first user gesture.

```tsx
const audioCtxRef = useRef<AudioContext | null>(null)
function getAudioContext() {
  if (!audioCtxRef.current) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtxRef.current = new Ctx()
  }
  void audioCtxRef.current.resume()
  return audioCtxRef.current
}
```

---

## 6. Celebration / confetti: stabilize randomness and ease mobile (`components/timer-grid.tsx`)

**Issue:** `CelebrationOverlay` calls `Math.random()` **during render** for many confetti nodes, so values change every re-render. Many pieces use `repeat: Infinity`, which is heavy on mobile GPUs.

**Direction:**

- Memoize confetti props **once** when the overlay opens (`useMemo`, keyed by open state).
- Reduce count on small viewports (e.g. 40 → 12).
- Respect **`prefers-reduced-motion`** via `useReducedMotion()` from Framer Motion.

```tsx
const reduceMotion = useReducedMotion()
const confettiCount = reduceMotion ? 0 : isNarrow ? 12 : 40

const confetti = useMemo(
  () =>
    Array.from({ length: confettiCount }, (_, i) => ({
      id: i,
      shape: confettiShapes[Math.floor(Math.random() * 3)],
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      startX: Math.random() * 100,
      // ...endX, duration, delay, rotate
    })),
  [confettiCount]
)
```

---

## 7. Wake Lock + visibility (`components/kids-timer.tsx`)

**Issue:** If the tab goes to background, the screen wake lock may release.

**Direction:** Re-request when the document becomes visible.

```tsx
useEffect(() => {
  let sentinel: WakeLockSentinel | null = null
  const request = async () => {
    if (!timer.isRunning || !("wakeLock" in navigator)) return
    try {
      sentinel = await navigator.wakeLock.request("screen")
    } catch {
      /* ignore */
    }
  }
  void request()
  const onVis = () => {
    if (document.visibilityState === "visible") void request()
  }
  document.addEventListener("visibilitychange", onVis)
  return () => {
    document.removeEventListener("visibilitychange", onVis)
    void sentinel?.release()
  }
}, [timer.isRunning])
```

---

## 8. Animation polish (fewer concurrent springs)

- **`TimerDisplay`:** `key={seconds}` + spring every second is heavy on low-end phones. Prefer lighter transitions, animate only on minute changes, or shorten duration without spring for seconds.
- **Grid “current” pulse:** Multiple `repeat: Infinity` layers per cell — consider focusing motion on the character / one pulsing layer.
- **`whileHover`:** Mostly desktop; on touch, optional `pointer: coarse` media query to skip hover scale.

---

## 9. Viewport / accessibility (`app/layout.tsx`)

**Issue:** `maximumScale: 1` and `userScalable: false` help an app-like layout but **reduce zoom for low vision**.

**Optional loosening:**

```ts
export const viewport: Viewport = {
  themeColor: '#c9a86c',
  width: 'device-width',
  initialScale: 1,
  // maximumScale: 5,
  // userScalable: true,
}
```

---

## Summary table

| Area | Issue | Direction |
|------|--------|-----------|
| `use-timer` | Effect depends on `totalSeconds` → interval reset every tick | Single interval + refs |
| Progress UI | Bar shows “remaining” not “done” | Use `completedIntervals / totalIntervals` if you want fill-up |
| `TimerGrid` | `window` in render, no resize | `matchMedia` / state |
| `TimerGrid` effect | `prevCompleted` not updated in success branch | Set prev when incrementing |
| Audio | New context per beep | Shared context + `resume()` |
| Celebration | Random in render, many infinite loops | `useMemo`, fewer pieces, `useReducedMotion` |
| Wake lock | Lost on background | `visibilitychange` re-request |
| Motion | Many infinite animations | Reduce on mobile / reduced motion |

---

## Suggested implementation order

1. Fix `use-timer` interval + callback refs (behavior + performance).
2. Fix progress bar semantics (or document “time left”).
3. Fix `TimerGrid` column logic + `prevCompleted` effect.
4. Shared `AudioContext` + wake lock visibility handling.
5. Celebration confetti memoization, counts, and reduced motion.
6. Motion and viewport tweaks as polish.
