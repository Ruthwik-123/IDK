import { Scroll } from '@react-three/drei'
import { SECTIONS } from '../content/sections'

/**
 * DOM story panels that share the same virtual scroll as the WebGL scene.
 *
 * TWO drei v10 gotchas baked into this structure:
 *
 * 1. ONE <Scroll html> per scene, not one per page. Every ScrollHtml
 *    instance creates its React root on the SAME ScrollControls container,
 *    so only the last one's content survives — all five sections must live
 *    in a single chunk.
 *
 * 2. Per-page positioning is manual. The single wrapper is moved by one
 *    global transform (translateY = -H·(pages-1)·offset), so each section
 *    places itself at `top: i·100%`; at offset = i/(pages-1) the two
 *    cancel and that section sits in the viewport.
 */
export default function Sections() {
  return (
    <Scroll html style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
      {SECTIONS.map((s, i) => (
        <div
          key={s.id}
          style={{ position: 'absolute', top: `${i * 100}%`, left: 0, width: '100%', height: '100%' }}
        >
          {s.hero ? (
            /* Chapter 1 — full-bleed hero title */
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="font-mono text-[10px] tracking-[0.45em] text-lava-300 md:text-xs">
                {s.n} · {s.tag.toUpperCase()} · ANDAMAN SEA
              </p>
              <h2 className="mt-4 text-5xl font-black tracking-tight text-slate-50 drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] md:text-7xl">
                {s.title}
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300 md:text-lg">{s.body}</p>
            </div>
          ) : (
            /* Standard chapter card */
            <div
              className={`absolute inset-0 flex items-center px-6 ${
                s.align === 'right' ? 'justify-end md:pr-[13%]' : 'justify-start md:pl-[13%]'
              }`}
            >
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
                <p className="font-mono text-[10px] tracking-[0.35em] text-lava-300 md:text-xs">
                  {s.n} · {s.tag.toUpperCase()}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-50 md:text-4xl">{s.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">{s.body}</p>
                {s.stats && (
                  <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                    {s.stats.map(([value, label]) => (
                      <div key={label}>
                        <dt className="font-mono text-[9px] tracking-[0.2em] text-slate-500">
                          {label.toUpperCase()}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-100 md:text-lg">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </Scroll>
  )
}
