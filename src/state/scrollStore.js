import { create } from 'zustand'

/**
 * Bridge between the R3F world (where the scroll offset lives) and the DOM
 * overlay (the HUD). Written at most when the offset moves by more than a
 * hair, so React work on the HUD stays bounded.
 *
 * Also owns the app "mode": 'film' (the directed scroll story) or 'bench'
 * (the free-orbit study model — drag to orbit, scroll to zoom). The bench
 * swaps the camera out of the story and hands it to the user.
 */
export const useScrollStore = create((set) => ({
  offset: 0,
  setOffset: (offset) => set({ offset }),
  mode: 'film',
  setMode: (mode) => set({ mode }),
  // When the bench is open, optionally "slice" the island to expose the
  // cross-section so you can orbit around the open cutaway.
  slice: false,
  setSlice: (slice) => set({ slice }),
}))
