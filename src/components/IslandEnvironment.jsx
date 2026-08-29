import { Environment, Lightformer } from '@react-three/drei'

/**
 * Procedural image-based lighting — no HDR download, works fully offline.
 *
 * Lightformers are rendered ONCE (frames={1}) into a small cube map and
 * feed reflections to every PBR material in the scene. This is what gives
 * the basalt its warm/cool split and the ocean its mirror.
 *
 * Swap for `<Environment preset="sunset" />` if you're fine with the
 * runtime CDN fetch in your own deployment.
 */
export default function IslandEnvironment() {
  return (
    <Environment resolution={128} frames={1}>
      <color attach="background" args={['#0a1526']} />

      {/* low warm sun disc on the horizon */}
      <Lightformer form="ring" intensity={4} color="#ff9d5c" position={[0, 3, -14]} scale={10} />

      {/* sunset slab behind the island */}
      <Lightformer form="rect" intensity={2.2} color="#ffb36b" position={[0, 7, -12]} scale={[18, 5, 1]} />

      {/* cool sky bounce overhead */}
      <Lightformer
        form="rect"
        intensity={0.9}
        color="#274b73"
        position={[0, 14, 0]}
        rotation-x={Math.PI / 2}
        scale={[14, 14, 1]}
      />

      {/* sea-level cool fill from camera-left */}
      <Lightformer
        form="rect"
        intensity={1.1}
        color="#4f7fb8"
        position={[-14, 3, 6]}
        rotation-y={Math.PI / 3}
        scale={[9, 6, 1]}
      />
    </Environment>
  )
}
