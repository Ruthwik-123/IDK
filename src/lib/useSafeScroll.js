import { useScroll } from '@react-three/drei'

/**
 * useScroll() but safe to call OUTSIDE a <ScrollControls> provider.
 *
 * drei's useScroll() just reads a context; outside the provider it returns
 * undefined, so `scroll.offset` would throw. In the film mode every component
 * sits inside <ScrollControls>, but the free-orbit bench deliberately omits it —
 * so the volcano, embers, smoke and interior read this hook instead. It falls
 * back to a neutral offset (0) and a no-op scroll object.
 */
export default function useSafeScroll() {
  const scroll = useScroll()
  if (!scroll) return { offset: 0 }
  return scroll
}
