import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import Scene from './components/Scene'
import Sections from './components/Sections'
import Overlay from './components/Overlay'
import BenchOverlay from './components/BenchOverlay'
import { PAGES } from './content/sections'
import { useScrollStore } from './state/scrollStore'

/**
 * App — the stage.
 *
 * Two modes, switched through the zustand store:
 *   FILM  — the directed, scroll-driven story (ScrollControls + story panels)
 *   BENCH — the free-orbit study model (OrbitControls, no scroll film)
 *
 *  ┌─ Canvas (WebGL) ──────────────────────────────────────────────┐
 *  │  FILM  : ScrollControls  ← single source of scroll truth       │
 *  │          ├─ Scene (story camera rig)                           │
 *  │          └─ Sections : DOM story panels (drei html)            │
 *  │  BENCH : Scene bench (OrbitControls) — camera in your hands     │
 *  └───────────────────────────────────────────────────────────────┘
 *  DOM HUD layered on top, driven by the zustand store.
 */
export default function App() {
  const mode = useScrollStore((s) => s.mode)

  return (
    <div className="grain fixed inset-0 overflow-hidden bg-abyss-950 text-slate-100 antialiased">
      <Canvas
        shadows="percentage"
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: mode === 'bench' ? [0, 8, 40] : [0, 11, 46], fov: 40, near: 0.5, far: 400 }}
      >
        {mode === 'film' ? (
          <ScrollControls pages={PAGES} damping={0.2}>
            <Scene />
            <Sections />
          </ScrollControls>
        ) : (
          <Scene bench />
        )}
      </Canvas>

      {mode === 'film' ? <Overlay /> : <BenchOverlay />}
    </div>
  )
}
