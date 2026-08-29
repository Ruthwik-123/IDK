import { create } from 'zustand'

/**
 * Bridge between the R3F world (where the scroll offset lives) and the DOM
 * overlay (the HUD). Written at most when the offset moves by more than a
 * hair, so React work on the HUD stays bounded.
 */
export const useScrollStore = create((set) => ({
  offset: 0,
  setOffset: (offset) => set({ offset }),
}))
