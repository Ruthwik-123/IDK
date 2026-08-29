import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

/**
 * A drei <Html> callout pinned to a structural part of the cutaway.
 *
 * PORTAL GOTCHA: when <ScrollControls> is active, drei's Html portals
 * itself into the SCROLLER element (events.connected), so labels are
 * anchored to the 4800px of scroll content and fly off-screen as the
 * user scrolls. We instead pass an explicit `portal` — a viewport-fixed
 * host div — so callouts track the 3D anchor in screen space.
 *
 * `progress` is a REF, not state — the fade runs on the render loop
 * (direct style write) so the cross-section reveal never re-renders
 * React. `on` gates mounting to the 80% milestone, keeping the DOM
 * clean for the first four chapters.
 */
let sharedHost = null
function getViewportHost() {
  if (!sharedHost) {
    sharedHost = document.createElement('div')
    sharedHost.style.cssText =
      'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:5;'
    document.body.appendChild(sharedHost)
  }
  return sharedHost
}

export function Callout({ anchor, index, label, side = 'right', progress, on }) {
  const el = useRef()
  const [host] = useState(getViewportHost)

  useFrame(() => {
    if (el.current) el.current.style.opacity = progress.current.toFixed(3)
  })

  if (!on) return null

  return (
    <Html position={anchor} center portal={{ current: host }} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <div
        ref={el}
        className={`flex items-center gap-2 ${side === 'left' ? 'flex-row-reverse' : ''}`}
        style={{ opacity: 0 }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-lava-400 shadow-[0_0_10px_2px_rgba(255,138,61,0.7)]" />
        <span
          className={`h-px w-8 shrink-0 ${
            side === 'left'
              ? 'bg-gradient-to-l from-lava-400/90 to-white/20'
              : 'bg-gradient-to-r from-lava-400/90 to-white/20'
          }`}
        />
        <span className="whitespace-nowrap rounded-md border border-white/15 bg-slate-950/85 px-2 py-1 font-mono text-[10px] tracking-[0.2em] text-slate-100 shadow-lg backdrop-blur-sm">
          <span className="text-lava-300">{index}</span> {label}
        </span>
      </div>
    </Html>
  )
}
