import { ISLAND } from './island'

/**
 * JS mirror of the ocean's GLSL wave stack, used by the buoyancy physics.
 *
 * The ocean plane is rotated -90 deg about X, so a plane-local point
 * (px, py) lands at world (x, z) = (px, -py). To ask "how high is the
 * sea at world (x, z)" we therefore evaluate the shader's function at
 * p = (x, -z) — exactly what the vertex shader does. Keeping this in one
 * module means the water the pumice floats on is bit-for-bit the water
 * you see.
 */
export const SEA_LEVEL = ISLAND.seaLevel

export function waveHeight(px, py, t) {
  const n = (x, y) => {
    const l = Math.hypot(x, y)
    return [x / l, y / l]
  }

  let h = 0
  {
    const [a, b] = n(1.0, 0.35)
    h += Math.sin((a * px + b * py) * 0.32 + t * 1.05) * 0.3
  }
  {
    const [a, b] = n(-0.75, 1.0)
    h += Math.sin((a * px + b * py) * 0.52 + t * 1.55) * 0.18
  }
  {
    const [a, b] = n(0.25, -1.0)
    h += Math.sin((a * px + b * py) * 0.86 + t * 2.25) * 0.085
  }
  {
    const [a, b] = n(1.0, 1.0)
    h += Math.sin((a * px + b * py) * 1.7 + t * 3.05) * 0.035
  }
  return h
}

/** Absolute sea-surface height at a world (x, z). */
export function seaSurfaceAt(x, z, t) {
  return SEA_LEVEL + waveHeight(x, -z, t)
}
