import { smoothstep } from './math'

/**
 * The scroll choreography, centralised.
 *
 * Every consumer — volcano halves, embers, smoke, interior, callouts —
 * imports these same curves, so the three milestones can never drift
 * out of sync. Retune the story by editing this one file.
 */

// Milestone 1 · rotation — total yaw across the full scroll (radians)
export const ROTATION_TOTAL = -Math.PI * 0.4

// Milestone 2 · eruption — fully engaged right AT the 60% scroll mark
// (the ramp ends at 0.60, so chapter 3 opens on an active eruption)
export const eruptionAt = (offset) => smoothstep(0.52, 0.6, offset)

// Milestone 3 · cross-section — opens at the 80% scroll mark
export const splitTargetAt = (offset) => (offset >= 0.8 ? 1 : 0)

// Callout annotations fade in as the split completes
export const annotationAt = (offset) => smoothstep(0.8, 0.92, offset)

// How far each half travels along X (scene units) — the finale needs the
// gap wide enough to read as an open diorama from ~45 units out
export const SPLIT_DISTANCE = 5.5
