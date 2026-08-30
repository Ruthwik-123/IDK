import { useEffect } from 'react'
import { useScrollStore } from '../state/scrollStore'

/**
 * Global keyboard shortcuts for the presentation/exploration switch.
 *
 *   Shift + F  → enter freeform exploration (3D model only, no text)
 *   Esc        → return to the scroll-driven presentation
 *
 * Matches on `e.code === 'KeyF'` (physical key) OR the character 'f', so it
 * works on non-QWERTY layouts where Shift+F produces a different glyph.
 * `e.repeat` is guarded so holding the key can't hammer the state toggle.
 */
export function useExploreMode() {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return
      const isF = e.code === 'KeyF' || e.key?.toLowerCase() === 'f'

      if (isF && e.shiftKey) {
        e.preventDefault()
        useScrollStore.getState().setMode('explore')
        return
      }
      if (e.key === 'Escape') {
        // only meaningful while exploring — never swallow Esc otherwise
        if (useScrollStore.getState().mode === 'explore') {
          e.preventDefault()
          useScrollStore.getState().setMode('story')
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
