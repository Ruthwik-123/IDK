import { useFrame } from '@react-three/fiber'
import { Stars, useScroll } from '@react-three/drei'
import Lighting from './Lighting'
import IslandEnvironment from './IslandEnvironment'
import Ocean from './Ocean'
import Volcano from './Volcano'
import CameraRig from './CameraRig'
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
 * Order here is render order for transparents; keep it meaningful.
 */
export default function Scene() {
  return (
    <>
      {/* Dusk palette — fog colour == background so the horizon dissolves */}
      <color attach="background" args={['#071019']} />
      <fog attach="fog" args={['#071019', 42, 170]} />

      <Lighting />
      <IslandEnvironment />
      <Stars radius={140} depth={60} count={1800} factor={4} saturation={0} fade speed={0.4} />

      <Volcano />
      <Ocean />

      <CameraRig />
      <ScrollBridge />
    </>
  )
}
