import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { SKY_GLSL } from '../lib/glsl'

/**
 * A real sky, not a flat background colour.
 *
 * An inside-facing sphere shaded by the shared analytic sky function,
 * so the horizon actually burns where the sun is, indigo gathers
 * overhead and cirrus bands streak the low air. The HDR sun disc is
 * deliberately > 1.0 so the bloom pass picks it up.
 *
 * It also gives the ocean something truthful to reflect (Ocean.jsx
 * includes the same SKY_GLSL chunk).
 */

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG =
  SKY_GLSL +
  /* glsl */ `
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vDir;

  void main() {
    vec3 d = normalize(vDir);
    // slow drift of the cirrus field, so the dusk feels alive not frozen
    vec3 col = skyColor(d, uSunDir);
    col *= 1.0 + 0.02 * sin(uTime * 0.12);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export default function SkyDome() {
  const mat = useRef()

  const uniforms = useMemo(
    () => ({
      uSunDir: { value: new THREE.Vector3(26, 14, 18).normalize() },
      uTime: { value: 0 },
    }),
    [],
  )

  useFrame((_, delta) => {
    mat.current.uniforms.uTime.value += delta
  })

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[260, 48, 32]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
