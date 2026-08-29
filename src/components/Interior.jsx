import { forwardRef, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { NOISE_GLSL } from '../lib/glsl'
import { eruptionAt } from '../lib/scroll'
import useSafeScroll from '../lib/useSafeScroll'

/**
 * The revealed interior — visible only while the cross-section is open
 * (Volcano toggles the group's `visible`). Everything is centred on the
 * island's x = 0 plane, i.e. inside the gap when the halves part.
 */

/* ---- magma chamber: a pulsing molten blob (fBm displacement) ---- */
const CHAMBER_VERT =
  NOISE_GLSL +
  /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  varying float vGlow;

  void main() {
    vec3 nrm = normalize(normal);
    float n = fbm(nrm.xz * 2.2 + uTime * 0.35) * 0.6
            + fbm(nrm.xy * 3.7 - uTime * 0.2) * 0.4;
    vGlow = n;
    vec3 p = position + nrm * (n - 0.5) * 0.35 * (0.7 + 0.5 * uPulse);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const CHAMBER_FRAG =
  NOISE_GLSL +
  /* glsl */ `
  uniform float uPulse;
  varying float vGlow;

  void main() {
    vec3 crust = vec3(0.35, 0.04, 0.01);
    vec3 hot   = vec3(1.00, 0.45, 0.10);
    vec3 white = vec3(1.00, 0.90, 0.62);

    vec3 col = mix(crust, hot, smoothstep(0.25, 0.75, vGlow));
    col = mix(col, white, smoothstep(0.72, 0.95, vGlow));
    col *= 1.15 + 0.9 * uPulse; // the chamber "breathes" harder while erupting

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/* ---- conduit: a pipe with an upward-flowing magma band ---- */
const CONDUIT_VERT = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNrm;
  varying vec3 vView;

  void main() {
    vLocal = position;
    vNrm = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const CONDUIT_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uEruption;
  varying vec3 vLocal;
  varying vec3 vNrm;
  varying vec3 vView;

  void main() {
    // bands travel UP the pipe — faster while erupting
    float flow = 0.5 + 0.5 * sin(vLocal.y * 8.0 - uTime * (2.5 + 5.5 * uEruption));
    vec3 col = mix(vec3(0.30, 0.05, 0.02), vec3(1.0, 0.55, 0.15), flow);

    // cheap cylindrical shading
    float facing = abs(dot(normalize(vNrm), normalize(vView)));
    col *= 0.55 + 0.45 * facing;
    col *= 0.8 + 0.6 * uEruption;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const Interior = forwardRef(function Interior(_props, ref) {
  const light = useRef()
  const scroll = useSafeScroll()

  const chamberMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPulse: { value: 0 } },
        vertexShader: CHAMBER_VERT,
        fragmentShader: CHAMBER_FRAG,
      }),
    [],
  )
  const conduitMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uEruption: { value: 0 } },
        vertexShader: CONDUIT_VERT,
        fragmentShader: CONDUIT_FRAG,
      }),
    [],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const e = eruptionAt(scroll.offset)
    chamberMat.uniforms.uTime.value = t
    chamberMat.uniforms.uPulse.value = e
    conduitMat.uniforms.uTime.value = t
    conduitMat.uniforms.uEruption.value = e
    light.current.intensity = 0.8 + 4.5 * e
  })

  return (
    <group ref={ref}>
      {/* magma chamber */}
      <mesh position={[0, 2.2, 0]}>
        <icosahedronGeometry args={[1.55, 3]} />
        <primitive object={chamberMat} attach="material" />
      </mesh>

      {/* conduit pipe: chamber → crater floor */}
      <mesh position={[0, 3.7, 0]}>
        <cylinderGeometry args={[0.34, 0.5, 4.4, 24, 6, true]} />
        <primitive object={conduitMat} attach="material" />
      </mesh>

      {/* fills the gap with heat so the stratified caps read */}
      <pointLight ref={light} position={[0, 2.4, 0]} color="#ff5a1f" intensity={0} distance={14} decay={2} />
    </group>
  )
})

export default Interior
