import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { smoothstep, fract } from '../lib/math'
import { NOISE_GLSL } from '../lib/glsl'
import { ISLAND, ringPoint, buildIslandArrays } from '../lib/island'
import { world } from '../state/worldState'
import { ROTATION_TOTAL, eruptionAt } from '../lib/scroll'
import SmokePlume from './SmokePlume'
import EmberSystem from './EmberSystem'

/* ------------------------------------------------------------------ */
/* Lava lake filling the crater floor                                  */
/* ------------------------------------------------------------------ */
const LAVA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const LAVA_FRAG =
  NOISE_GLSL +
  /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv * 5.0;
    float t = uTime * 0.22;
    float n = fbm(uv + vec2(t, -t * 0.7)) * 0.65
            + fbm(uv * 2.3 - vec2(t * 1.3, t * 0.9)) * 0.35;

    vec3 crust = vec3(0.13, 0.02, 0.01);
    vec3 hot   = vec3(1.00, 0.42, 0.08);
    vec3 white = vec3(1.00, 0.92, 0.72);

    vec3 col = mix(crust, hot, smoothstep(0.30, 0.72, n));
    col = mix(col, white, smoothstep(0.74, 0.95, n));
    col *= uIntensity;

    // darken where the lake meets the crater wall
    float edge = smoothstep(0.0, 0.2, distance(vUv, vec2(0.5)) * 2.0);
    col *= mix(0.3, 1.0, edge);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/* ---------------- exterior rock colour ---------------- */
const C_BASE = new THREE.Color('#1d2329')
const C_MID = new THREE.Color('#39414a')
const C_RIM = new THREE.Color('#5a6470')
const C_FLOW = new THREE.Color('#4b3a33')
const C_ASH = new THREE.Color('#8b9097')

function rockColor(t, theta, i, out) {
  const hash = fract(Math.sin(i * 12.9898) * 43758.5453)
  out.copy(C_BASE).lerp(C_MID, smoothstep(0.05, 0.55, t))
  out.lerp(C_RIM, smoothstep(0.55, 0.85, t) * 0.7)
  const flow = Math.sin(theta * 8.7 + 2.1) * Math.sin(theta * 3.3 + 0.4)
  if (t > 0.45 && t < 0.85 && flow > 0.55) out.lerp(C_FLOW, 0.45)
  out.lerp(C_ASH, smoothstep(0.82, 0.98, t) * 0.8)
  out.multiplyScalar(0.86 + 0.28 * hash)
  return out
}

const COLS = 128
const ROWS = 80

/**
 * The island as ONE closed surface of revolution.
 *
 * Because buildIslandArrays() wraps theta back on itself there is no
 * boundary column, so computeVertexNormals() shades continuously all the
 * way round — the seam/crack artifact is structurally impossible here.
 */
function buildIslandGeometry() {
  const { positions, indices, thetas, ts } = buildIslandArrays(COLS, ROWS)

  const colors = new Float32Array(positions.length)
  const c = new THREE.Color()
  for (let i = 0; i < thetas.length; i++) {
    rockColor(ts[i], thetas[i], i, c)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  geo.computeVertexNormals()
  return geo
}

/* ------------------------------------------------------------------ */
/* Volcano — the scroll-reactive island                                */
/* ------------------------------------------------------------------ */
export default function Volcano() {
  const island = useRef()
  const craterLight = useRef()
  const scroll = useScroll()

  const anim = useRef({ rot: 0, eruption: 0, flash: 0, lastE: 0 })

  const geo = useMemo(() => buildIslandGeometry(), [])

  // the secondary cinder cone on the upper flank, sampled straight off the
  // real surface so it sits exactly on the rock
  const sideVent = useMemo(() => {
    const surface = ringPoint(Math.PI * 0.22, 0.66, new THREE.Vector3())
    const radial = new THREE.Vector3(surface.x, 0, surface.z).normalize()
    const base = surface.clone().addScaledVector(radial, 0.05)
    const tip = surface.clone().addScaledVector(radial, 0.62).add(new THREE.Vector3(0, 0.35, 0))
    return {
      mid: base.clone().lerp(tip, 0.5),
      height: base.distanceTo(tip),
      quat: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        tip.clone().sub(base).normalize(),
      ),
    }
  }, [])

  const lavaMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uIntensity: { value: 0.6 } },
        vertexShader: LAVA_VERT,
        fragmentShader: LAVA_FRAG,
      }),
    [],
  )

  /**
   * The rock material. The eruption injects two things into the standard
   * shader via onBeforeCompile:
   *   vEmberMask — the crater rim glows
   *   vFlow      — lava rivulets that crawl DOWN the flanks over time
   */
  const eruptionU = useRef({
    uEruption: { value: 0 },
    uFlicker: { value: 1 },
    uTime: { value: 0 },
  })

  const rockMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.93,
      metalness: 0.05,
    })
    const H = ISLAND.height.toFixed(1)

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uEruption = eruptionU.current.uEruption
      shader.uniforms.uFlicker = eruptionU.current.uFlicker
      shader.uniforms.uTime = eruptionU.current.uTime

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\n\tvarying float vEmberMask;\n\tvarying float vFlow;\n\tuniform float uTime;',
        )
        .replace(
          '#include <begin_vertex>',
          /* glsl */ `#include <begin_vertex>
  // crater rim + upper cone — where the rock is hot enough to glow
  vEmberMask = smoothstep(0.70, 0.80, position.y / ${H});

  // lava rivulets: bright stripes that run down the flank, angled around
  // the cone so they read as individual flows drifting downhill in time
  float ang = atan(position.z, position.x);
  float hy = position.y / ${H};
  float rib = sin(ang * 9.0 + sin(ang * 2.3) * 2.0 - hy * 7.0 + uTime * 0.55);
  float ribMask = smoothstep(0.90, 0.995, rib);
  float hMask = smoothstep(0.30, 0.52, hy) * (1.0 - smoothstep(0.60, 0.76, hy));
  vFlow = ribMask * hMask;`,
        )

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\n\tvarying float vEmberMask;\n\tvarying float vFlow;\n\tuniform float uEruption;\n\tuniform float uFlicker;',
        )
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `#include <emissivemap_fragment>
  vec3 lavaCol = vec3(1.0, 0.40, 0.09);
  totalEmissiveRadiance += lavaCol * vEmberMask * uEruption * uFlicker * 1.15;
  totalEmissiveRadiance += lavaCol * vFlow * uEruption * uFlicker * 2.6;`,
        )
    }
    return mat
  }, [])

  useFrame((state, delta) => {
    const s = anim.current
    const t = state.clock.elapsedTime
    const offset = scroll.offset

    /* ── milestone 1 · rotation ─────────────────────────────────── */
    s.rot = THREE.MathUtils.damp(s.rot, offset * ROTATION_TOTAL, 3.5, delta)
    island.current.rotation.y = s.rot

    /* ── milestone 2 · eruption, building into the finale ───────── */
    const eTarget = eruptionAt(offset)
    if (eTarget > 0.002 && s.lastE <= 0.002) s.flash = 1
    s.lastE = eTarget
    s.flash = Math.max(0, s.flash - delta * 1.5)
    s.eruption = THREE.MathUtils.damp(s.eruption, eTarget, 4, delta)

    const flicker = 0.85 + 0.15 * Math.sin(t * 7.3) * Math.sin(t * 3.1)
    eruptionU.current.uEruption.value = s.eruption
    eruptionU.current.uFlicker.value = flicker
    eruptionU.current.uTime.value = t
    lavaMat.uniforms.uTime.value = t
    lavaMat.uniforms.uIntensity.value = (0.5 + 1.5 * s.eruption) * flicker + s.flash * 1.5
    craterLight.current.intensity = (1.4 + 9 * s.eruption) * flicker + s.flash * 6

    /* ── publish the world transform for the physics proxy ──────── */
    island.current.updateWorldMatrix(true, false)
    world.island.copy(island.current.matrixWorld)
    world.eruption = s.eruption
  })

  return (
    <group ref={island}>
      <mesh geometry={geo} material={rockMat} castShadow receiveShadow />

      {/* lava lake on the crater floor */}
      <mesh position={[0, ISLAND.craterFloor + 0.12, 0]} rotation-x={-Math.PI / 2} material={lavaMat}>
        <circleGeometry args={[1.7, 64]} />
      </mesh>

      {/* secondary cinder cone on the upper flank */}
      <mesh position={sideVent.mid} quaternion={sideVent.quat} castShadow receiveShadow>
        <coneGeometry args={[0.34, sideVent.height, 10]} />
        <meshStandardMaterial color="#333b44" roughness={0.95} metalness={0.03} flatShading />
      </mesh>

      <SmokePlume />
      <EmberSystem />

      {/* crater glow */}
      <pointLight ref={craterLight} position={[0, 6.3, 0]} color="#ff6a1f" intensity={1.4} distance={20} decay={2} />
    </group>
  )
}
