import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { useScrollStore } from '../state/scrollStore'
import { world } from '../state/worldState'

const lookTarget = new THREE.Vector3()

/**
 * Scroll-driven dolly. Two CatmullRom splines — one for the camera, one
 * for the look-at target — sampled by the damped scroll offset. A pinch
 * of pointer parallax keeps the shot alive between scrolls.
 *
 * Four control points, one per chapter. The film now closes on the
 * erupting summit rather than pulling back for a cutaway, so the last
 * point sits high and close on the crater.
 */
export default function CameraRig() {
  const scroll = useScroll()
  const p = useRef({ t: 0, px: 0, py: 0 })

  const camPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 11, 46), // ch.1 — wide establishing shot over the sea
          new THREE.Vector3(12, 6.0, 30), // ch.2 — glide in, sun at our back
          new THREE.Vector3(16, 4.2, 18), // ch.3 — skim past the eastern flank
          new THREE.Vector3(9, 10.5, 16), // ch.4 — rise to watch the eruption
        ],
        false,
        'catmullrom',
        0.5,
      ),
    [],
  )

  const lookPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 3.5, 0),
          new THREE.Vector3(0, 4.5, 0),
          new THREE.Vector3(0, 5.4, 0),
          new THREE.Vector3(0, 6.4, 0),
        ],
        false,
        'catmullrom',
        0.5,
      ),
    [],
  )

  useFrame((state, delta) => {
    // explore mode owns the camera — stand down completely, but stay
    // mounted so the spline state (and therefore the return position)
    // is preserved for when Esc hands control back
    if (useScrollStore.getState().mode === 'explore') return

    const s = p.current
    s.t = THREE.MathUtils.damp(s.t, scroll.offset, 3.2, delta)
    s.px = THREE.MathUtils.damp(s.px, state.pointer.x, 4, delta)
    s.py = THREE.MathUtils.damp(s.py, state.pointer.y, 4, delta)

    const t = THREE.MathUtils.clamp(s.t, 0, 1)
    camPath.getPointAt(t, state.camera.position)
    state.camera.position.x += s.px * 1.1
    state.camera.position.y += s.py * 0.7
    lookPath.getPointAt(t, lookTarget)
    state.camera.lookAt(lookTarget)

    // publish the aim point so ExploreControls can inherit it on Shift+F
    world.lookTarget.copy(lookTarget)
  })

  return null
}
