import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { Stars, OrbitControls } from '@react-three/drei'
import Lighting from './Lighting'
import IslandEnvironment from './IslandEnvironment'
import Ocean from './Ocean'
import Volcano from './Volcano'
import CameraRig from './CameraRig'
import { useScrollStore } from '../state/scrollStore'
import useSafeScroll from '../lib/useSafeScroll'

/**
 * Mirrors drei's (mutable, per-frame) scroll offset into the DOM-facing
 * zustand store, throttled so the HUD doesn't re-render on micro-moves.
 */
function ScrollBridge() {
  const scroll = useSafeScroll()
  useFrame(() => {
    const store = useScrollStore.getState()
    if (Math.abs(store.offset - scroll.offset) > 0.0008) store.setOffset(scroll.offset)
  })
  return null
}

/** On entering the bench, park the camera on a clean three-quarter shot. */
function BenchCameraBoot() {
  const { camera } = useThree()
  useLayoutEffect(() => {
    camera.position.set(0, 8, 40)
    camera.lookAt(0, 5, 0)
  }, [camera])
  return null
}

/**
 * Scene — everything that lives inside the WebGL world.
 * Order here is render order for transparents; keep it meaningful.
 *
 * `bench` swaps the directed film for the free-orbit study model: the camera
 * is handed to <OrbitControls> (drag to orbit, scroll to zoom) and the
 * volcano is forced into eruption so the user can look at it from any angle.
 */
export default function Scene({ bench = false } = {}) {
  return (
    <>
      {/* Dusk palette — fog colour == background so the horizon dissolves */}

      <color attach="background" args={bench ? ['#0a1420'] : ['#071019']} />
      <fog attach="fog" args={['#071019', bench ? 30 : 42, bench ? 120 : 170]} />

      <Lighting />
      <IslandEnvironment />
      <Stars radius={140} depth={60} count={1800} factor={4} saturation={0} fade speed={0.4} />

      <Volcano bench={bench} />
      <Ocean />

      {bench ? (
        <>
          <BenchCameraBoot />
          <OrbitControls
            makeDefault
            target={[0, 5, 0]}
            enableDamping
            dampingFactor={0.08}
            minDistance={12}
            maxDistance={90}
            minPolarAngle={0.05}
            maxPolarAngle={Math.PI / 2 - 0.04}
            enablePan
            panSpeed={0.6}
          />
        </>
      ) : (
        <>
          <CameraRig />
          <ScrollBridge />
        </>
      )}
    </>
  )
}
