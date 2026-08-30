import * as THREE from 'three'

/** JS-side smoothstep (GLSL has its own in shaders). */
export const smoothstep = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

export const fract = (v) => v - Math.floor(v)
