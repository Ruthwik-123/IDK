/**
 * Cinematic rig for a dusk seascape, retuned for the HDR pipeline.
 *
 * Because tone mapping now happens in the composer (Effects.jsx) rather
 * than in each material, the scene is lit in linear light and pushed a
 * little harder than before — ACES then rolls the highlights off, which
 * is what gives the rock its density instead of a washed-out grey.
 *
 *  - warm key   : the low setting sun, from the same vector the sky and
 *                 ocean shaders use, so light, sky and glitter agree
 *  - cool rim   : edge light from behind-left, separates rock from sky
 *  - hemi fill  : sky vs. sea-bounce ambient, keeps shadows from crushing
 *  - sea bounce : a faint cold up-light from the water onto the flanks
 *
 * Shadow camera is sized tightly around the island — a 2048 map over 36u
 * gives clean facets without bleeding into the open sea. normalBias
 * (rather than bias alone) kills the acne the low-poly cone used to get.
 */
const SUN = [26, 14, 18]

export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.16} color="#33465f" />
      <hemisphereLight intensity={0.46} color="#25466a" groundColor="#050a12" />

      <directionalLight
        castShadow
        position={SUN}
        intensity={3.1}
        color="#ffb36b"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-camera-left={-19}
        shadow-camera-right={19}
        shadow-camera-top={19}
        shadow-camera-bottom={-19}
        shadow-bias={-0.0002}
        shadow-normalBias={0.035}
      />

      {/* cool rim / edge, models the silhouette against the bright horizon */}
      <directionalLight position={[-22, 9, -16]} intensity={1.15} color="#6d9ee0" />

      {/* cold bounce off the sea onto the lower flanks */}
      <directionalLight position={[0, -8, 6]} intensity={0.22} color="#2c5a7a" />
    </>
  )
}
