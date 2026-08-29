/**
 * Cinematic three-point rig for a dusk seascape:
 *  - warm key   : low "setting" sun, long soft shadows over the flank
 *  - cool rim   : edge light from behind-left, separates rock from sky
 *  - hemi fill  : sky vs. sea-bounce ambient, keeps shadows from crushing
 *
 * Shadow camera is sized tightly around the island — a 2048 map over 36u
 * gives clean facets without bleeding into the open sea.
 */
export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.12} color="#31435c" />
      <hemisphereLight intensity={0.4} color="#22405f" groundColor="#04070d" />

      <directionalLight
        castShadow
        position={[26, 14, 18]}
        intensity={2.2}
        color="#ffb36b"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0004}
      />

      <directionalLight position={[-22, 9, -16]} intensity={0.9} color="#5f8fd0" />
    </>
  )
}
