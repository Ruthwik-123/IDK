/**
 * World-space constants for the placeholder island (scene units).
 * Scene modules import from here (never from Volcano.jsx) to avoid
 * circular imports between sibling components.
 */
export const ISLAND = {
  baseRadius: 7.5,
  height: 9,
  seaLevel: 0.55,
  craterFloor: 5.6,
  craterRadius: 1.9,
}
