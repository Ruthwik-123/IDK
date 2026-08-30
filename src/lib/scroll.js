import { smoothstep } from './math'

/**
 * The scroll choreography, centralised.
 *
 * Every consumer — the island, embers, smoke, camera rig — imports these
 * same curves, so the milestones can never drift out of sync. Retune the
 * story by editing this one file.
 *
 * With 4 pages, drei reports offset = scrollTop / (contentH - viewportH),
 * so chapter i is centred on screen at offset i/3:
 *   ch.1 → 0.000   ch.2 → 0.333   ch.3 → 0.667   ch.4 → 1.000
 */

// Milestone 1 · rotation — total yaw across the full scroll (radians)
export const ROTATION_TOTAL = -Math.PI * 0.32

// Milestone 2 · eruption — the story now CLOSES on the eruption ("It Is
// Still Breathing"), so this ramps up into chapter 4 and stays lit rather
// than winding back down.
export const eruptionAt = (offset) => smoothstep(0.62, 0.86, offset)

/* ---------------------------------------------------------------------
 * Chapter-1 intro transition: 3D model → blur → photographic reference →
 * blur back to the crisp 3D model. All timings live here so the DOM layer
 * (IntroReveal) and the canvas blur wrapper (App) can never disagree.
 * ------------------------------------------------------------------- */
export const INTRO_PHOTO = {
  inStart: 0.018,
  inEnd: 0.07,
  outStart: 0.145,
  outEnd: 0.2,
}

export const introPhotoOpacity = (offset) => {
  const { inStart, inEnd, outStart, outEnd } = INTRO_PHOTO
  return smoothstep(inStart, inEnd, offset) * (1 - smoothstep(outStart, outEnd, offset))
}

/** 0 → max → 0 blur amount (px) applied to the 3D canvas during the transition. */
export const introBlurPx = (offset, max = 16) => {
  const { inStart, inEnd, outStart, outEnd } = INTRO_PHOTO
  const rise = smoothstep(inStart, inEnd, offset)
  const fall = 1 - smoothstep(outStart, outEnd, offset)
  return max * rise * fall
}
