import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useScrollStore } from '../state/scrollStore'
import { world } from '../state/worldState'

/**
 * Freeform navigation for explore mode.
 *
 * ── The handoff ──────────────────────────────────────────────────────
 * In story mode the camera is driven frame-by-frame by <CameraRig>, so
 * OrbitControls must be inert. While disabled it holds no state of its
 * own — three's OrbitControls derives its orbit sphere from the camera's
 * current position and `target` at the moment it is enabled. So we:
 *
 *   1. keep CameraRig writing its aim point into world.lookTarget
 *   2. on entering explore mode, copy that into controls.target
 *
 * The result is that Shift+F freezes the view exactly where it was and
 * simply *gives the user the wheel*. No jump, no reset.
 *
 * ── Stealing events back from ScrollControls ─────────────────────────
 * drei's ScrollControls puts an absolutely-positioned, overflow-y div on
 * top of the canvas and connects pointer events to it, which would eat
 * every wheel/drag meant for orbiting. We flip that layer to
 * pointer-events:none while exploring (and freeze the scroll with
 * enabled={false}, set in App) so the canvas receives input again.
 * `state.events.connected` is drei's own reference to that element.
 */
export default function ExploreControls() {
  const controls = useRef()
  const mode = useScrollStore((s) => s.mode)
  const connected = useThree((s) => s.events.connected)

  // give wheel + pointer events back to the canvas while exploring
  useEffect(() => {
    if (!connected?.style) return
    connected.style.pointerEvents = mode === 'explore' ? 'none' : 'auto'
    return () => {
      if (connected?.style) connected.style.pointerEvents = 'auto'
    }
  }, [connected, mode])

  // inherit the story camera's exact aim point on entry
  useEffect(() => {
    if (mode === 'explore' && controls.current) {
      controls.current.target.copy(world.lookTarget)
      controls.current.update()
    }
  }, [mode])

  return (
    <OrbitControls
      ref={controls}
      enabled={mode === 'explore'}
      makeDefault
      enableDamping
      dampingFactor={0.075}
      rotateSpeed={0.55}
      zoomSpeed={0.8}
      enablePan={false}
      minDistance={14}
      maxDistance={85}
      // stop just short of the horizon so the user never dives under the sea
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI * 0.485}
    />
  )
}
