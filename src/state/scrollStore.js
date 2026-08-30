import { create } from 'zustand'

/**
 * Bridge between the R3F world (where the scroll offset lives) and the DOM
 * overlay (the HUD), plus the presentation-mode switch.
 *
 * `mode` has two values:
 *   'story'   — the scroll-driven film (default)
 *   'explore' — freeform 3D inspection: no text, orbit/zoom around the
 *               island. Entered with Shift+F, left with Esc.
 */
export const useScrollStore = create((set) => ({
  offset: 0,
  mode: 'story',
  setOffset: (offset) => set({ offset }),
  setMode: (mode) => set({ mode }),
}))
