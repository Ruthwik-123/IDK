import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { smoothstep, fract } from '../lib/math'
import { NOISE_GLSL } from '../lib/glsl'
import { ISLAND } from '../lib/island'
import {
  ROTATION_TOTAL,
  eruptionAt,
  splitTargetAt,
  annotationAt,
  SPLIT_DISTANCE,
} from '../lib/scroll'
import SmokePlume from './SmokePlume'
import EmberSystem from './EmberSystem'
import Interior from './Interior'
import { Callout } from './Annotations'

/* ------------------------------------------------------------------ */
/* Lava lake — split into two half-discs so each crater keeps its lava */
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

    float edge = smoothstep(0.0, 0.2, distance(vUv, vec2(0.5)) * 2.0);
    col *= mix(0.3, 1.0, edge);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/* ------------------------------------------------------------------ */
/* The island surface — one function, sampled by both halves + caps   */
/* ------------------------------------------------------------------ */

/**
 * One point on the (undivided) island surface at (theta, t):
 * layered angular noise, a flared coastline skirt, a carved crater.
 * Because both half-geometries sample this same function — and both
 * keep the theta = 0 and theta = PI boundary columns — the pieces meet
 * exactly on the x = 0 plane when the split is closed.
 */
function ringPoint(theta, t, out) {
  const { baseRadius, height, craterFloor, craterRadius } = ISLAND
  const r0 = baseRadius * (1 - t)

  const n1 = Math.sin(theta * 3.1 + 1.7) * Math.sin(t * 9.0 + theta * 2.0)
  const n2 = Math.sin(theta * 7.3 - 0.8) * Math.sin(t * 17.0 + theta * 1.1)
  const n3 = Math.sin(theta * 15.1 + 3.3) * Math.sin(t * 31.0)
  const n = 0.55 * n1 + 0.3 * n2 + 0.15 * n3

  let x, y, z
  if (t < 0.14) {
    // coastline skirt flares out below the sea line
    const k = 1 - t / 0.14
    const R = r0 * (1 + 1.9 * Math.pow(k, 1.6))
    x = Math.sin(theta) * R
    z = Math.cos(theta) * R
    y = t * height * 0.6
  } else {
    // rocky relief, faded to zero near the apex so the crater stays clean
    const relief =
      n *
      (0.45 + 1.1 * Math.sin(Math.min(t * 1.6, 1) * Math.PI)) *
      Math.min(1, r0 / 0.9)
    const R = r0 + relief
    x = Math.sin(theta) * R
    z = Math.cos(theta) * R
    y = t * height + n * 0.3
  }

  // carve the crater: flatten everything above the floor inside the opening
  const r = Math.hypot(x, z)
  if (y > craterFloor && r < craterRadius + (y - craterFloor) * 0.12) {
    y = craterFloor + Math.sin(theta * 5.0) * 0.05
  }

  out.set(x, y, z)
  return out
}

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

/* ---------------- cut-face stratigraphy ---------------- */
const C_BASALT = new THREE.Color('#262d34')
const C_TUFF = new THREE.Color('#5c6570')
const C_ASH_LENS = new THREE.Color('#9aa2ab')
const C_DIKE = new THREE.Color('#6e3a20')

/** Banded tuff/basalt, pale ash lenses, one mafic dike — the "story" of the cut face. */
function strataColor(y, z, out) {
  const wob = Math.sin(z * 0.9) * 0.4 + Math.sin(y * 1.3) * 0.25
  const band = Math.sin(y * 3.4 + wob)
  out.copy(C_BASALT).lerp(C_TUFF, smoothstep(-0.35, 0.65, band))

  const lens = smoothstep(0.8, 0.97, Math.sin(y * 1.7 + 2.1 + Math.sin(z * 0.6) * 0.5))
  out.lerp(C_ASH_LENS, lens * 0.7)

  const dike = 1 - smoothstep(0.0, 0.05, Math.abs(Math.sin(z * 2.1 - y * 0.9 + 0.7)))
  out.lerp(C_DIKE, dike * 0.85)

  out.multiplyScalar(0.62 + 0.38 * THREE.MathUtils.clamp(y / ISLAND.craterFloor, 0, 1))
  return out
}

/* ------------------------------------------------------------------ */
/* Half-geometry builder (rock shell + earcut cut cap)                 */
/* ------------------------------------------------------------------ */
const COLS = 97
const ROWS = 73
const CAP_OFFSET = 0.012

function dedupe(pts) {
  return pts.filter(
    (pt, i) => i === 0 || Math.hypot(pt.x - pts[i - 1].x, pt.y - pts[i - 1].y) > 1e-4,
  )
}

/**
 * One half of the island. side = +1 → x ≥ 0, side = −1 → x ≤ 0.
 *
 * The cap is earcut-triangulated from the TRUE surface cross-section at
 * x = 0 (two boundary columns + implicit bottom edge), so the diorama
 * reveals real stratigraphy instead of a hollow mesh — and it is offset
 * 1.2 cm into its own half, so the caps are invisible while closed and
 * snap into view when the halves separate.
 */
function buildHalfGeometry(side) {
  const thetaA = side === 1 ? 0 : Math.PI
  const thetaB = side === 1 ? Math.PI : Math.PI * 2

  const positions = []
  const colors = []
  const p = new THREE.Vector3()
  const c = new THREE.Color()

  // rock shell
  for (let i = 0; i < ROWS; i++) {
    const t = i / (ROWS - 1)
    for (let j = 0; j < COLS; j++) {
      const theta = thetaA + (j / (COLS - 1)) * (thetaB - thetaA)
      ringPoint(theta, t, p)
      positions.push(p.x, p.y, p.z)
      rockColor(t, theta, i * COLS + j, c)
      colors.push(c.r, c.g, c.b)
    }
  }

  const indices = []
  for (let i = 0; i < ROWS - 1; i++) {
    for (let j = 0; j < COLS - 1; j++) {
      const a = i * COLS + j
      const b = a + 1
      const up = a + COLS
      const d = up + 1
      indices.push(a, d, up) // outward winding (θ × t frame)
      indices.push(a, b, d)
    }
  }

  // cut cap — 2D loop in the (z, y) plane
  // NOTE: triangulateShape requires THREE.Vector2 (it calls .equals on them)
  const back = [] // theta = 0 column → +z side
  const front = [] // theta = PI column → -z side
  const pb = new THREE.Vector3()
  const pf = new THREE.Vector3()
  for (let i = 0; i < ROWS; i++) {
    const t = i / (ROWS - 1)
    ringPoint(0, t, pb)
    ringPoint(Math.PI, t, pf)
    back.push(new THREE.Vector2(pb.z, pb.y))
    front.push(new THREE.Vector2(pf.z, pf.y))
  }
  const loop = dedupe([...back, ...front.slice().reverse()]) // CCW in (z, y)

  const base = ROWS * COLS
  const tris = THREE.ShapeUtils.triangulateShape(loop, [])
  for (const [ia, ib, ic] of tris) {
    if (side === 1) indices.push(base + ia, base + ib, base + ic) // → −x normal
    else indices.push(base + ia, base + ic, base + ib) // flipped → +x normal
  }
  for (const pt of loop) {
    positions.push(side * CAP_OFFSET, pt.y, pt.x)
    strataColor(pt.y, pt.x, c)
    colors.push(c.r, c.g, c.b)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  // crisp normals on the cut face (computeVertexNormals would average them)
  const normals = geo.attributes.normal
  const nx = side === 1 ? -1 : 1
  for (let k = 0; k < loop.length; k++) normals.setXYZ(base + k, nx, 0, 0)

  return geo
}

/* ------------------------------------------------------------------ */
/* Volcano — the scroll-reactive island                                */
/* ------------------------------------------------------------------ */
/**
 * Three scroll milestones, all frame-by-frame (damped, no extra deps):
 *
 *  1. ROTATION        — island yaw follows scroll with critical damping
 *  2. ERUPTION @ 60%  — one-shot flash + damped "eruption" value that
 *                       drives embers, smoke, lava intensity, the crater
 *                       point light and an emissive injection into the
 *                       rock material (onBeforeCompile, height-masked)
 *  3. SPLIT @ 80%     — halves damped apart along X, exposing the
 *                       interior (chamber, conduit, stratified caps);
 *                       <Html> callouts fade in with the opening
 */
export default function Volcano() {
  const island = useRef()
  const rightRef = useRef()
  const leftRef = useRef()
  const interior = useRef()
  const craterLight = useRef()
  const scroll = useScroll()

  // per-frame animation state — lives outside React, never re-renders
  const anim = useRef({ rot: 0, split: 0, eruption: 0, flash: 0, lastE: 0 })
  const annRef = useRef(0)
  const [calloutsOn, setCalloutsOn] = useState(false)
  const calloutsOnRef = useRef(false)

  // debug handle (also handy in your own tooling)
  useMemo(() => {
    if (typeof window !== 'undefined') {
      window.__volcano = { anim, annRef, isCalloutsOn: () => calloutsOnRef.current }
    }
  }, [])

  const rightGeo = useMemo(() => buildHalfGeometry(1), [])
  const leftGeo = useMemo(() => buildHalfGeometry(-1), [])

  const lavaMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uIntensity: { value: 0.6 } },
        vertexShader: LAVA_VERT,
        fragmentShader: LAVA_FRAG,
      }),
    [],
  )

  // Milestone 2: make the CRATER MATERIAL EMISSIVE — inject a height-masked
  // emission term into the standard material. Everything below y/9 ≈ 0.7
  // (the rim and above) burns; the body stays inert.
  const eruptionU = useRef({ uEruption: { value: 0 }, uFlicker: { value: 1 } })
  const rockMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.93,
      metalness: 0.05,
    })
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uEruption = eruptionU.current.uEruption
      shader.uniforms.uFlicker = eruptionU.current.uFlicker
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n\tvarying float vEmberMask;')
        .replace(
          '#include <begin_vertex>',
          // ISLAND.height = 9 — keep in sync
          '#include <begin_vertex>\n\tvEmberMask = smoothstep(0.70, 0.80, position.y / 9.0);',
        )
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\n\tvarying float vEmberMask;\n\tuniform float uEruption;\n\tuniform float uFlicker;',
        )
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += vec3(1.0, 0.42, 0.10) * vEmberMask * uEruption * uFlicker;',
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

    /* ── milestone 2 · eruption @ 60% ───────────────────────────── */
    const eTarget = eruptionAt(offset)
    if (eTarget > 0.002 && s.lastE <= 0.002) s.flash = 1 // one-shot on trigger
    s.lastE = eTarget
    s.flash = Math.max(0, s.flash - delta * 1.5)
    s.eruption = THREE.MathUtils.damp(s.eruption, eTarget, 4, delta)

    const flicker = 0.85 + 0.15 * Math.sin(t * 7.3) * Math.sin(t * 3.1)
    eruptionU.current.uEruption.value = s.eruption
    eruptionU.current.uFlicker.value = flicker
    lavaMat.uniforms.uTime.value = t
    lavaMat.uniforms.uIntensity.value =
      (0.5 + 1.5 * s.eruption) * flicker + s.flash * 1.5
    craterLight.current.intensity = (1.4 + 9 * s.eruption) * flicker + s.flash * 6

    /* ── milestone 3 · cross-section @ 80% ──────────────────────── */
    s.split = THREE.MathUtils.damp(s.split, splitTargetAt(offset), 2.2, delta)
    rightRef.current.position.x = SPLIT_DISTANCE * s.split
    leftRef.current.position.x = -SPLIT_DISTANCE * s.split
    interior.current.visible = s.split > 0.02

    // callouts fade in as the rock opens (opacity is a ref — no re-renders)
    annRef.current = annotationAt(offset)
    const on = offset > 0.78
    calloutsOnRef.current = on
    if (on !== calloutsOn) setCalloutsOn(on)
  })

  return (
    <group ref={island}>
      {/* right half (x ≥ 0) — carries the eruption: embers + smoke stay
          with this crater when the island splits */}
      <group ref={rightRef}>
        <mesh geometry={rightGeo} material={rockMat} castShadow receiveShadow />
        <mesh position={[0, ISLAND.craterFloor + 0.12, 0]} rotation-x={-Math.PI / 2} material={lavaMat}>
          <circleGeometry args={[1.5, 40, -Math.PI / 2, Math.PI]} />
        </mesh>
        <SmokePlume />
        <EmberSystem />
      </group>

      {/* left half (x ≤ 0) */}
      <group ref={leftRef}>
        <mesh geometry={leftGeo} material={rockMat} castShadow receiveShadow />
        <mesh position={[0, ISLAND.craterFloor + 0.12, 0]} rotation-x={-Math.PI / 2} material={lavaMat}>
          <circleGeometry args={[1.5, 40, Math.PI / 2, Math.PI]} />
        </mesh>
        <Callout
          anchor={[0, 3.3, 0.4]}
          index="03"
          label="STRATIFICATIONS"
          side="left"
          progress={annRef}
          on={calloutsOn}
        />
      </group>

      {/* interior — revealed by the split (stays on the centreline) */}
      <Interior ref={interior} />

      {/* crater glow — sits in the gap, lights both caps when open */}
      <pointLight ref={craterLight} position={[0, 6.3, 0]} color="#ff6a1f" intensity={1.4} distance={20} decay={2} />

      {/* callouts on the centred structures */}
      <Callout anchor={[0, 2.1, 0]} index="01" label="MAGMA CHAMBER" side="right" progress={annRef} on={calloutsOn} />
      <Callout anchor={[0, 4.55, 0]} index="02" label="CONDUIT PIPE" side="right" progress={annRef} on={calloutsOn} />
    </group>
  )
}
