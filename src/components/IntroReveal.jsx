import { useScrollStore } from '../state/scrollStore'
import { introPhotoOpacity } from '../lib/scroll'

/**
 * Chapter 1's transition: the bare 3D volcano model blurs (the canvas blur
 * itself is applied in App.tsx, driven by the same offset/curve) and
 * dissolves into a real photographic reference of Barren Island, then
 * dissolves back to the crisp 3D model as the story continues.
 *
 * This is a plain DOM layer above the canvas (not part of the R3F scene),
 * so the "photo" is a real <img>, not a texture — cheap, sharp at any
 * viewport size, and trivially easy to swap for a different reference shot.
 */
export default function IntroReveal() {
  const offset = useScrollStore((s) => s.offset)
  const mode = useScrollStore((s) => s.mode)
  const opacity = mode === 'explore' ? 0 : introPhotoOpacity(offset)

  // otherwise the full-screen reference photo would sit over the model and
  // make freeform exploration pointless if Shift+F is pressed during the intro
  if (mode === 'explore' || opacity <= 0.001) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center bg-abyss-950"
      style={{ opacity }}
    >
      <img
        src="/images/barren-island-reference.jpg"
        alt="Recent aerial photograph of Barren Island, Andaman Sea"
        className="h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_45%,rgba(2,4,8,0.65)_100%)]" />
      <p className="absolute bottom-6 right-6 font-mono text-[9px] tracking-[0.25em] text-slate-300/80 md:bottom-8 md:right-10">
        REFERENCE IMAGERY · BARREN ISLAND, ANDAMAN SEA
      </p>
    </div>
  )
}
