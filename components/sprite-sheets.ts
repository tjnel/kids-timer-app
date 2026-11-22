/**
 * Every sprite sheet the app draws. `public/sw.js` precaches the same list,
 * so a sheet added or renamed here needs the same change there.
 */

/** Shown on the setup screen straight away; the page preloads these. */
export const SETUP_SPRITES = [
  "/sprites/mouse-idle.png",
  "/sprites/cheese-idle.png",
  "/sprites/car-idle.png",
  "/sprites/flag-wave.png",
] as const

/** First shown after Start; warmed while the setup screen is idle. */
export const RUNNING_SPRITES = [
  "/sprites/mouse-run.png",
  "/sprites/mouse-eat.png",
  "/sprites/cheese-eat.png",
  "/sprites/car-drive.png",
] as const
