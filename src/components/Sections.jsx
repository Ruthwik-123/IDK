import { Scroll } from '@react-three/drei'
import { SECTIONS, SPEC, TOTAL_POINTS } from '../content/sections'

/**
 * DOM story panels that share the same virtual scroll as the WebGL scene.
 *
 * TWO drei v10 gotchas baked into this structure:
 *
 * 1. ONE <Scroll html> per scene, not one per page. Every ScrollHtml
 *    instance creates its React root on the SAME ScrollControls container,
 *    so only the last one's content survives — all sections must live in a
 *    single chunk.
 *
 * 2. Per-page positioning is manual. The single wrapper is moved by one
 *    global transform (translateY = -H·(pages-1)·offset), so each section
 *    places itself at `top: i·100%`; at offset = i/(pages-1) the two cancel
 *    and that section sits in the viewport.
 *
 * Story beats are short (label → headline → one line). The final "on the
 * record" section is a clean 15-row data sheet, its rows numbered 01→15.
 */
export default function Sections() {
  // Continuous 01→15 row numbers across the SPEC groups.
  let counter = 1

  return (
    <Scroll html style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
      {SECTIONS.map((s, i) => (
        <div
          key={s.id}
          style={{ position: 'absolute', top: `${i * 100}%`, left: 0, width: '100%', height: '100%' }}
        >
          {s.spec ? (
            /* Chapter 5 — the 15-point data sheet */
            <div className="absolute inset-0 flex items-center justify-end px-6 md:pr-[9%]">
              <div className="w-full max-w-2xl">
                <p className="font-mono text-[10px] tracking-[0.35em] text-lava-300 md:text-xs">
                  {s.n} · {s.tag.toUpperCase()}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-50 md:text-4xl">{s.title}</h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">{s.line}</p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {SPEC.map((group) => (
                    <div key={group.q} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur-md">
                      <p className="border-b border-white/10 pb-2 font-mono text-[10px] tracking-[0.25em] text-lava-300">
                        {group.q} · {group.title.toUpperCase()}
                      </p>
                      <dl className="mt-2 flex flex-col gap-1.5">
                        {group.items.map(([value, label]) => {
                          const num = String(counter++).padStart(2, '0')
                          return (
                            <div key={num} className="flex items-start justify-between gap-3">
                              <dt className="flex items-baseline gap-2 text-[12px] font-semibold text-slate-100 md:text-sm">
                                <span className="font-mono text-[9px] text-lava-400/80">{num}</span>
                                {value}
                              </dt>
                              <dd className="text-right text-[11px] leading-snug text-slate-400 md:text-xs">{label}</dd>
                            </div>
                          )
                        })}
                      </dl>
                    </div>
                  ))}
                </div>

                <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-slate-500">
                  {TOTAL_POINTS} POINTS · 4 QUESTIONS · {SPEC.length} GROUPS
                </p>
              </div>
            </div>
          ) : s.hero ? (
            /* Chapter 1 — full-bleed hero title + one line */
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="font-mono text-[10px] tracking-[0.45em] text-lava-300 md:text-xs">
                {s.n} · {s.tag.toUpperCase()}
              </p>
              <h2 className="mt-4 text-5xl font-black tracking-tight text-slate-50 drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] md:text-7xl">
                {s.title}
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-200 md:text-lg">{s.line}</p>
            </div>
          ) : (
            /* Story beat — label + headline + one line */
            <div
              className={`absolute inset-0 flex items-center px-6 ${
                s.align === 'right' ? 'justify-end md:pr-[13%]' : 'justify-start md:pl-[13%]'
              }`}
            >
              <div className="max-w-md">
                <p className="font-mono text-[10px] tracking-[0.35em] text-lava-300 md:text-xs">{s.tag.toUpperCase()}</p>
                <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-50 md:text-5xl">
                  {s.title}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-300 md:text-base">{s.line}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </Scroll>
  )
}
