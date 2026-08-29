import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import useSafeScroll from '../lib/useSafeScroll'

const lookTarget = new THREE.Vector3()

/**
 * Scroll-driven dolly. Two CatmullRom splines — one for the camera,
 * one for the look-at target — sampled by the damped scroll offset.
 * A pinch of pointer parallax keeps the shot alive between scrolls.
 *
 * Re-plot the five control points per chapter and the whole film
 * re-blocks; nothing else in the scene needs to know.
 */
export default function CameraRig() {
  const scroll = useSafeScroll()
  const p = useRef({ t: 0, px: 0, py: 0 })

  const camPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 11, 46), // ch.1 — wide establishing shot over the sea
          new THREE.Vector3(11, 5.5, 30), // ch.2 — glide in, sun at our back
          new THREE.Vector3(15.5, 3.2, 17), // ch.3 — skim past the eastern flank
          new THREE.Vector3(7, 8.4, 9.5), // ch.4 — rise up over the crater rim
          // ch.5 — three-quarter aerial across the OPEN gap. Looking
          // straight down the gap axis only shows the near half's flat cut
          // face (chamber hidden); from the side the gap opens diagonally,
          // the near half frames the foreground and the chamber glows mid
          // frame, clear of the story card. Line of sight to the chamber
          // clears the crater rim (passes the near half at y≈10.6 > 6.9).
          // (Island-local (10, 16, 17) rotated by the final -72° yaw:
          //  world x = 0.309·10 − 0.951·17, z = 0.951·10 + 0.309·17.)
          new THREE.Vector3(-13.1, 16, 14.8),
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
          new THREE.Vector3(0, 6.5, 0),
          new THREE.Vector3(0, 2.5, 0),
        ],
        false,
        'catmullrom',
        0.5,
      ),
    [],
  )

  useFrame((state, delta) => {
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
  })

  return null
}
