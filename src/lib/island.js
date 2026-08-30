/**
 * World-space constants + the island's analytic surface function.
 *
 * Scene modules import from here (never from Volcano.jsx) to avoid
 * circular imports between sibling components. Crucially the PHYSICS
 * collider is built from the *same* ringPoint() as the visible mesh,
 * so rigid bodies can never drift out of sync with the rock.
 */
import * as THREE from 'three'

export const ISLAND = {
  baseRadius: 7.5,
  height: 9,
  seaLevel: 0.55,
  craterFloor: 5.6,
  craterRadius: 1.9,
}

/**
 * One point on the island surface at (theta, t): layered angular noise,
 * a flared coastline skirt, a carved crater.
 *
 * The surface is sampled around the FULL circle with wrap-around faces,
 * so there is no boundary column anywhere on the mesh — which is why the
 * old seam artifact cannot come back.
 */
export function ringPoint(theta, t, out) {
  const { baseRadius, height, craterFloor, craterRadius } = ISLAND
  const r0 = baseRadius * (1 - t)

  const n1 = Math.sin(theta * 3.1 + 1.7) * Math.sin(t * 9.0 + theta * 2.0)
  const n2 = Math.sin(theta * 7.3 - 0.8) * Math.sin(t * 17.0 + theta * 1.1)
  const n3 = Math.sin(theta * 15.1 + 3.3) * Math.sin(t * 31.0)
  const n = 0.55 * n1 + 0.3 * n2 + 0.15 * n3

  let x, y, z
  if (t < 0.14) {
    // coastline skirt flares out below the sea line — a clean, circular
    // caldera platform (no noise term here)
    const k = 1 - t / 0.14
    const R = r0 * (1 + 1.05 * Math.pow(k, 1.7))
    x = Math.sin(theta) * R
    z = Math.cos(theta) * R
    y = t * height * 0.6
  } else {
    // rocky relief, faded to zero near the apex so the crater stays clean
    const relief =
      n *
      (0.45 + 1.1 * Math.sin(Math.min(t * 1.6, 1) * Math.PI)) *
      Math.min(1, r0 / 0.9)
    const R = r0 + relief
    x = Math.sin(theta) * R
    z = Math.cos(theta) * R
    y = t * height + n * 0.3
  }

  // carve the crater: flatten everything above the floor inside the opening
  const r = Math.hypot(x, z)
  if (y > craterFloor && r < craterRadius + (y - craterFloor) * 0.12) {
    y = craterFloor + Math.sin(theta * 5.0) * 0.05
  }

  out.set(x, y, z)
  return out
}

/**
 * Radius of the island at the waterline — the ocean shader uses this to
 * place the surf ring and the shallow shelf, so surf always hugs the rock.
 * (Solved analytically: skirt y = t·height·0.6 → t = seaLevel / 5.4.)
 */
export function waterlineRadius() {
  const t = ISLAND.seaLevel / (ISLAND.height * 0.6)
  const r0 = ISLAND.baseRadius * (1 - t)
  const k = 1 - t / 0.14
  return r0 * (1 + 1.05 * Math.pow(k, 1.7))
}

/**
 * Build the island as ONE closed surface of revolution.
 *
 * `cols` columns span theta = 0 .. 2π with the last column wrapping back
 * to the first, so every vertex has a full triangle fan around it and
 * computeVertexNormals() produces continuous shading the whole way round.
 * This is what removes the visible crack/hole that the old two-half build
 * produced at its shared boundary.
 *
 * Returns raw arrays so both the renderer and the physics collider can be
 * generated from the identical call (just at different resolutions).
 */
export function buildIslandArrays(cols = 128, rows = 80) {
  const verts = cols * rows
  const positions = new Float32Array(verts * 3)
  const thetas = new Float32Array(verts)
  const ts = new Float32Array(verts)
  const p = new THREE.Vector3()

  let k = 0
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1)
    for (let j = 0; j < cols; j++) {
      const theta = (j / cols) * Math.PI * 2 // NOTE: /cols, not /(cols-1)
      ringPoint(theta, t, p)
      positions[k * 3] = p.x
      positions[k * 3 + 1] = p.y
      positions[k * 3 + 2] = p.z
      thetas[k] = theta
      ts[k] = t
      k++
    }
  }

  const indices = new Uint32Array((rows - 1) * cols * 6)
  let n = 0
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols; j++) {
      const jn = (j + 1) % cols // wraps theta back to 0 — the closed seam
      const a = i * cols + j
      const b = i * cols + jn
      const up = (i + 1) * cols + j
      const d = (i + 1) * cols + jn
      indices[n++] = a
      indices[n++] = d
      indices[n++] = up
      indices[n++] = a
      indices[n++] = b
      indices[n++] = d
    }
  }

  return { positions, indices, thetas, ts, cols, rows }
}

/**
 * Low-res triangle soup for the Rapier trimesh collider. Deliberately
 * coarser than the render mesh (physics does not need 20k triangles) but
 * generated from the identical surface function.
 */
export function buildColliderArrays(cols = 56, rows = 30) {
  const { positions, indices } = buildIslandArrays(cols, rows)
  return { positions, indices }
}
