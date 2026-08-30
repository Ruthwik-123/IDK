import { useFrame } from '@react-three/fiber'
import { Stars, useScroll } from '@react-three/drei'
import Lighting from './Lighting'
import IslandEnvironment from './IslandEnvironment'
import SkyDome from './SkyDome'
import Ocean from './Ocean'
import Volcano from './Volcano'
import PhysicsWorld from './PhysicsWorld'
import CameraRig from './CameraRig'
import ExploreControls from './ExploreControls'
import Effects from './Effects'
import { useScrollStore } from '../state/scrollStore'

/**
 * Mirrors drei's (mutable, per-frame) scroll offset into the DOM-facing
 * zustand store, throttled so the HUD doesn't re-render on micro-moves.
 */
function ScrollBridge() {
  const scroll = useScroll()
  useFrame(() => {
    const store = useScrollStore.getState()
    if (Math.abs(store.offset - scroll.offset) > 0.0008) store.setOffset(scroll.offset)
  })
  return null
}

/**
 * Scene — everything that lives inside the WebGL world.
 *
 * Order matters twice over:
 *  1. render order for transparents (island before ocean before particles)
 *  2. <Volcano> must mount BEFORE <PhysicsWorld> so its useFrame writes
 *     the shared world matrices before the colliders read them.
 */
export default function Scene() {
  return (
    <>
      {/* Dusk sky + atmospheric fog — fog matches the sky's horizon so the
          sea dissolves into the air instead of into a flat rectangle */}
      <color attach="background" args={['#060d18']} />
      <SkyDome />
      <fog attach="fog" args={['#0a1523', 48, 175]} />

      <Lighting />
      <IslandEnvironment />
      <Stars radius={140} depth={60} count={1800} factor={4} saturation={0} fade speed={0.4} />

      <Volcano />
      <PhysicsWorld />
      <Ocean />

      <CameraRig />
      <ExploreControls />
      <ScrollBridge />
      <Effects />
    </>
  )
}
