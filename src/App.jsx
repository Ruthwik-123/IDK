import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import Scene from './components/Scene'
import Sections from './components/Sections'
import Overlay from './components/Overlay'
import { PAGES } from './content/sections'

/**
 * App — the stage.
 *
 *  ┌─ Canvas (WebGL) ──────────────────────────────────────────────┐
 *  │  ScrollControls  ← single source of scroll truth (pages × 5)  │
 *  │   ├─ Scene     : 3D world — camera rig, island, ocean, lights │
 *  │   └─ Sections  : DOM story panels scrolled in sync (drei html) │
 *  └───────────────────────────────────────────────────────────────┘
 *  Overlay — DOM HUD (title, chapter rail, progress) layered on top,
 *  fed by the zustand scroll bridge (see state/scrollStore.js).
 */
export default function App() {
  return (
    <div className="grain fixed inset-0 overflow-hidden bg-abyss-950 text-slate-100 antialiased">
      <Canvas
        shadows="percentage"
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 11, 46], fov: 40, near: 0.5, far: 400 }}
      >
        <ScrollControls pages={PAGES} damping={0.2}>
          <Scene />
          <Sections />
        </ScrollControls>
      </Canvas>

      <Overlay />
    </div>
  )
}
