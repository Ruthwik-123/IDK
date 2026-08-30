import * as THREE from 'three'

/**
 * A single mutable snapshot of the island's world-space transform,
 * written by <Volcano> each frame and read by the physics proxy.
 *
 * Why not props/context? Because these change EVERY frame — pushing them
 * through React would re-render the tree 60x a second. A module-level
 * mutable object keeps the render loop allocation-free and React-free.
 *
 * This is what guarantees the invisible Rapier collider is rigidly welded
 * to the visible rock: it is driven by the *same* matrix, not by a copy
 * of the same numbers.
 */
export const world = {
  /** island root (rotates across the film) */
  island: new THREE.Matrix4(),
  /** 0 → 1 damped eruption value */
  eruption: 0,
  /**
   * Wherever the story camera was last looking. Written every frame by
   * <CameraRig> while in story mode, and read ONCE when freeform mode
   * engages so OrbitControls inherits the exact aim point — that is what
   * makes the handoff seamless instead of snapping the view.
   */
  lookTarget: new THREE.Vector3(0, 4, 0),
}
