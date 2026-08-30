import { Scroll } from '@react-three/drei'
import { SECTIONS } from '../content/sections'
import { useScrollStore } from '../state/scrollStore'

/**
 * DOM story panels riding the same virtual scroll as the 3D world.
 *
 * Each panel is exactly ONE viewport tall, positioned with `vh` units
 * (not a percentage of the panel's own container — that previously caused
 * neighbouring chapter cards to overlap, since drei's <Scroll html> layer
 * is a single fixed-size overlay, not a tall scrolling document).
 *
 * In explore mode this renders nothing at all: Shift+F is the bare 3D
 * model with no copy on screen.
 */
export default function Sections() {
  const mode = useScrollStore((s) => s.mode)
  const panels = mode === 'explore' ? [] : SECTIONS

  return (
    <Scroll html style={{ width: '100%' }}>
      {panels.map((s, i) => {
        if (s.hero) return null // chapter 1: visuals only, no text overlay

        const docked = s.dock === 'bottom'

        return (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              top: `${i * 100}vh`,
              left: 0,
              width: '100vw',
              height: '100vh',
              pointerEvents: 'none',
            }}
          >
            <div
              className={`absolute inset-0 flex px-5 md:px-0 ${
                docked ? 'items-end pb-24 md:pb-28' : 'items-center'
              }`}
            >
              <div
                className={`flex flex-col rounded-2xl border border-white/10 bg-slate-950/45 p-5 backdrop-blur-md md:p-7 ${
                  s.align === 'right'
                    ? 'ml-auto mr-0 items-end text-right md:mr-[10%] md:max-w-md'
                    : 'mr-auto ml-0 items-start text-left md:ml-[10%] md:max-w-md'
                }`}
              >
                <p className="font-mono text-[10px] tracking-[0.35em] text-lava-300 md:text-xs">
                  {s.n} · {s.tag.toUpperCase()}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-50 md:text-4xl">
                  {s.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">{s.body}</p>
                {s.stats && (
                  <dl
                    className={`mt-5 grid w-full grid-cols-3 gap-3 border-t border-white/10 pt-4 ${
                      s.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {s.stats.map(([value, label]) => (
                      <div key={label}>
                        <dt className="font-mono text-[9px] tracking-[0.2em] text-slate-500">
                          {label.toUpperCase()}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-100 md:text-lg">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </Scroll>
  )
}
