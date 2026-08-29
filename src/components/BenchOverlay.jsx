import { useScrollStore } from '../state/scrollStore'

/**
 * DOM HUD for the bench mode — the free-orbit study model.
 *
 * Mirrors the reference product story's "Bench · freeform" section: the film
 * is a directed cut, this is the same model with the camera in your hands.
 * Provides a title, short instructions, a slice toggle (open the cutaway and
 * orbit into it), and a way back to the film.
 */
export default function BenchOverlay() {
  const setMode = useScrollStore((s) => s.setMode)
  const slice = useScrollStore((s) => s.slice)
  const setSlice = useScrollStore((s) => s.setSlice)

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* vignette + letterbox */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_55%,rgba(2,4,8,0.6)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

      {/* header */}
      <header className="absolute inset-x-0 top-0 flex items-start justify-between px-5 pt-5 md:px-10 md:pt-7">
        <div>
          <p className="font-mono text-[10px] tracking-[0.35em] text-lava-300 md:text-xs">
            BENCH · FREEFORM · 12.28°N 93.86°E
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-wide text-slate-100 md:text-2xl">
            Handle the volcano.
          </h1>
        </div>
        <button
          onClick={() => {
            setSlice(false)
            setMode('film')
          }}
          className="pointer-events-auto rounded-full border border-white/15 bg-black/30 px-4 py-1.5 font-mono text-[10px] tracking-[0.25em] text-slate-200 backdrop-blur-sm transition-colors hover:border-lava-400/60 hover:text-lava-300"
        >
          ← BACK TO FILM
        </button>
      </header>

      {/* instructions */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 md:left-10">
        <p className="max-w-[180px] font-mono text-[10px] leading-relaxed tracking-[0.2em] text-slate-400 md:text-xs">
          DRAG TO ORBIT · SCROLL TO ZOOM · <br className="hidden md:block" />
          <span className="text-slate-200">TURN IT OVER</span>
        </p>
      </div>

      {/* slice toggle */}
      <div className="pointer-events-auto absolute bottom-8 left-1/2 -translate-x-1/2">
        <button
          onClick={() => setSlice(!slice)}
          className={`rounded-full border px-5 py-2 font-mono text-[11px] tracking-[0.25em] backdrop-blur-sm transition-colors ${
            slice
              ? 'border-lava-400/70 bg-lava-500/20 text-lava-200 shadow-[0_0_20px_rgba(255,106,31,0.4)]'
              : 'border-white/15 bg-black/30 text-slate-200 hover:border-lava-400/60 hover:text-lava-300'
          }`}
        >
          {slice ? 'CLOSE CUTAWAY' : 'SLICE IT OPEN'}
        </button>
      </div>
    </div>
  )
}
