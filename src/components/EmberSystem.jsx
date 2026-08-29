import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { eruptionAt } from '../lib/scroll'
import useSafeScroll from '../lib/useSafeScroll'
import { ISLAND } from '../lib/island'

const COUNT = 300

/**
 * Milestone 2 (60% mark) — ballistic lava embers, fully GPU-driven.
 *
 * Each particle is a mini ballista shot: it spawns on the crater lip
 * with an upward + radial velocity and the vertex shader integrates a
 * simple parabolic flight,  p = p0 + v·τ + ½g·τ²,  on a per-particle
 * loop (τ = fract(uTime / life + seed)). No CPU buffer writes per frame.
 *
 * uEruption = 0 before the scroll trigger, so the system costs nothing
 * until 60% — then embers arc up and out, cooling as they fall.
 */
const VERT = /* glsl */ `
  attribute vec3 aVel;
  attribute float aLife;
  attribute float aSeed;
  uniform float uTime;
  uniform float uEruption;
  varying float vHeat;
  varying float vFade;

  void main() {
    float tau = fract(uTime / aLife + aSeed);

    // parabolic flight: ½g baked in as 3.5 (g = 7 scene units/s²)
    vec3 p = position + aVel * tau + vec3(0.0, -3.5, 0.0) * tau * tau;

    vHeat = 1.0 - tau;
    vFade = uEruption * (1.0 - smoothstep(0.7, 1.0, tau)); // die out as they land

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.6 + 3.4 * vHeat) * (70.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  varying float vHeat;
  varying float vFade;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, d) * vFade;
    if (a < 0.004) discard;

    // white-hot core → deep red as the ember cools
    vec3 col = mix(vec3(1.0, 0.22, 0.05), vec3(1.0, 0.85, 0.45), vHeat);
    gl_FragColor = vec4(col * 1.6, a);
  }
`

export default function EmberSystem() {
  const mat = useRef()
  const scroll = useSafeScroll()

  const { positions, vels, lives, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const vels = new Float32Array(COUNT * 3)
    const lives = new Float32Array(COUNT)
    const seeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 1.0 + Math.random() * 0.55
      positions[i * 3] = Math.cos(a) * r
      positions[i * 3 + 1] = ISLAND.craterFloor + 0.35
      positions[i * 3 + 2] = Math.sin(a) * r

      const s = 1.2 + Math.random() * 2.8 // radial spread
      vels[i * 3] = Math.cos(a) * s
      vels[i * 3 + 1] = 3.5 + Math.random() * 4.0 // → apices 1–4u above the lip
      vels[i * 3 + 2] = Math.sin(a) * s

      lives[i] = 1.4 + Math.random() * 1.4
      seeds[i] = Math.random()
    }
    return { positions, vels, lives, seeds }
  }, [])

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uEruption: { value: 0 } }),
    [],
  )

  useFrame((state) => {
    const u = mat.current.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uEruption.value = eruptionAt(scroll.offset)
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aVel" args={[vels, 3]} />
        <bufferAttribute attach="attributes-aLife" args={[lives, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
