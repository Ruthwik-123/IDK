import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { eruptionAt } from '../lib/scroll'
import { ISLAND } from '../lib/island'

const COUNT = 320

/**
 * Fully GPU-driven smoke plume: each particle loops on its own clock
 * from the crater lip upward, spiralling out as it rises. No CPU buffer
 * writes per frame — the vertex shader is the whole animation.
 *
 * Density follows the shared eruption curve (60% milestone), so the
 * plume thickens exactly when the crater ignites.
 */
const VERT = /* glsl */ `
  attribute float aSeed;
  attribute float aOffset;
  uniform float uTime;
  uniform float uActivity;
  varying float vAlpha;

  void main() {
    float t = fract(uTime * (0.045 + 0.05 * aSeed) + aOffset);

    vec3 p = position;
    float spread = 0.35 + t * 2.6;
    p.x += sin(t * 6.2832 * (0.6 + aSeed) + aSeed * 21.0) * spread;
    p.z += cos(t * 6.2832 * (0.5 + aSeed * 1.3) + aSeed * 17.0) * spread;
    p.y += t * (8.5 + 4.5 * aSeed);

    vAlpha = (1.0 - t) * smoothstep(0.0, 0.1, t) * (0.22 + 0.78 * uActivity);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (4.0 + t * 30.0) * (70.0 / -mv.z) * (0.6 + 0.5 * uActivity);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, d) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a * 0.5);
  }
`

export default function SmokePlume() {
  const scroll = useScroll()
  const mat = useRef()

  const { positions, seeds, offsets } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    const offsets = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * 0.55
      positions[i * 3] = Math.cos(a) * r
      positions[i * 3 + 1] = ISLAND.craterFloor + 0.25
      positions[i * 3 + 2] = Math.sin(a) * r
      seeds[i] = Math.random()
      offsets[i] = Math.random()
    }
    return { positions, seeds, offsets }
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0.3 },
      uColor: { value: new THREE.Color('#aab4bd') },
    }),
    [],
  )

  useFrame((state) => {
    // same curve as the embers → the whole eruption stays in sync
    const activity = 0.25 + 0.75 * eruptionAt(scroll.offset)
    mat.current.uniforms.uTime.value = state.clock.elapsedTime
    mat.current.uniforms.uActivity.value = activity
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aOffset" args={[offsets, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
