import { useScrollStore } from '../state/scrollStore'
import { CHAPTERS } from '../content/sections'

/**
 * DOM HUD layered above the canvas — title block, chapter rail, progress
 * bar and scroll hint. Everything is pointer-events-none; it only reads
 * the throttled offset from the zustand scroll bridge.
 */
export default function Overlay() {
  const offset = useScrollStore((s) => s.offset)
  // Chapter = the panel that contains the viewport's centre: with 5 panels
  // laid out over 4 intervals, panel i is centred on screen at offset
  // (i+0.5)/4, so the switch points are (i+0.5)/4 — i.e. floor(o·4 + 0.5).
  const chapter = Math.min(CHAPTERS.length - 1, Math.floor(offset * (CHAPTERS.length - 1) + 0.5))

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* cinematic vignette + letterbox gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_55%,rgba(2,4,8,0.55)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />

      {/* top bar */}
      <header className="absolute inset-x-0 top-0 flex items-start justify-between px-5 pt-5 md:px-10 md:pt-7">
        <div>
          <p className="font-mono text-[10px] tracking-[0.35em] text-lava-300/90 md:text-xs">
            BARREN ISLAND · 12.28°N 93.86°E
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-wide text-slate-100 md:text-2xl">
            India&rsquo;s Only Active Volcano
          </h1>
        </div>
        <p className="hidden rounded-full border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] text-slate-300 backdrop-blur-sm sm:block">
          SST · VOLCANOLOGY UNIT
        </p>
      </header>

      {/* chapter rail (desktop) */}
      <nav className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-4 md:flex md:right-8">
        {CHAPTERS.map((c, i) => (
          <div key={c.n} className="group flex items-center justify-end gap-3">
            <span
              className={`font-mono text-[10px] tracking-[0.2em] transition-all duration-300 ${
                i === chapter
                  ? 'text-slate-200 opacity-100'
                  : 'text-slate-400 opacity-0 group-hover:opacity-100'
              }`}
            >
              {c.label.toUpperCase()}
            </span>
            <span
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                i === chapter
                  ? 'scale-125 bg-lava-400 shadow-[0_0_12px_rgba(255,138,61,0.8)]'
                  : 'bg-white/25'
              }`}
            />
          </div>
        ))}
      </nav>

      {/* bottom bar: hint, progress, page counter */}
      <footer className="absolute inset-x-0 bottom-0 px-5 pb-5 md:px-10 md:pb-7">
        <div
          className={`mx-auto mb-4 flex max-w-fit flex-col items-center gap-1 font-mono text-[10px] tracking-[0.4em] text-slate-400 transition-opacity duration-700 ${
            offset > 0.02 ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span>SCROLL TO EXPLORE</span>
          <svg className="h-3 w-3 animate-bounce" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M2 4l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="h-px w-full overflow-hidden rounded bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-lava-500 via-lava-400 to-lava-300"
            style={{ transform: `scaleX(${offset})`, transformOrigin: 'left' }}
          />
        </div>

        <div className="mt-2 flex justify-between font-mono text-[10px] tracking-[0.25em] text-slate-500">
          <span>ANDAMAN SEA · BENGAL</span>
          <span>
            {String(chapter + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
          </span>
        </div>
      </footer>
    </div>
  )
}
