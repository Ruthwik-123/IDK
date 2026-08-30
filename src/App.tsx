import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
// @ts-expect-error — JSX component (no local type declarations)
import Scene from './components/Scene'
// @ts-expect-error — JSX component (no local type declarations)
import Sections from './components/Sections'
// @ts-expect-error — JSX component (no local type declarations)
import Overlay from './components/Overlay'
// @ts-expect-error — JSX component (no local type declarations)
import IntroReveal from './components/IntroReveal'
// @ts-expect-error — JS module (no local type declarations)
import { PAGES } from './content/sections'
// @ts-expect-error — JS module (no local type declarations)
import { useScrollStore } from './state/scrollStore'
// @ts-expect-error — JS module (no local type declarations)
import { introBlurPx } from './lib/scroll'
// @ts-expect-error — JS module (no local type declarations)
import { useExploreMode } from './hooks/useExploreMode'

/**
 * Blurs the 3D canvas during chapter 1's transition into the photographic
 * reference (and un-blurs it again as that photo dissolves away), driven
 * by the exact same offset/curve IntroReveal uses for the photo's opacity
 * — so the blur and the photo can never fall out of sync.
 */
function CanvasStage({ children }: { children: ReactNode }) {
  const offset = useScrollStore((s: { offset: number }) => s.offset)
  const blur = introBlurPx(offset)
  return (
    <div
      className="absolute inset-0"
      style={{ filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none' }}
    >
      {children}
    </div>
  )
}

export default function App() {
  // Shift+F → explore, Esc → back to the presentation
  useExploreMode()

  // freeze the virtual scroll while exploring so neither the camera nor
  // the eruption can be nudged by a stray wheel event
  const mode = useScrollStore((s: { mode: string }) => s.mode)

  return (
    <div className="grain fixed inset-0 overflow-hidden bg-abyss-950 text-slate-100 antialiased">
      <CanvasStage>
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMappingExposure: 1.0,
          }}
          camera={{ position: [0, 11, 46], fov: 40, near: 0.5, far: 400 }}
        >
          <ScrollControls pages={PAGES} damping={0.2} enabled={mode !== 'explore'}>
            <Scene />
            <Sections />
          </ScrollControls>
        </Canvas>
      </CanvasStage>

      <IntroReveal />
      <Overlay />
    </div>
  )
}
