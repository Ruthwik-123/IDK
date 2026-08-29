import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/**
 * Animated ocean — a single 150×150-segment plane with an analytic wave
 * stack (no GPU textures, no CPU vertex writes). Normals are derived
 * analytically in the vertex shader; the fragment does depth cueing,
 * Blinn-Phong sun glint, fresnel sky-mirror, crest foam and manual
 * distance fog (ShaderMaterial doesn't inherit scene fog).
 */

const VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vElev;

  float waveHeight(vec2 p) {
    float h = 0.0;
    h += sin(dot(p, normalize(vec2( 1.0,  0.35))) * 0.32 + uTime * 1.05) * 0.30;
    h += sin(dot(p, normalize(vec2(-0.75, 1.0))) * 0.52 + uTime * 1.55) * 0.18;
    h += sin(dot(p, normalize(vec2( 0.25,-1.0))) * 0.86 + uTime * 2.25) * 0.085;
    h += sin(dot(p, normalize(vec2( 1.0,  1.0))) * 1.70 + uTime * 3.05) * 0.035;
    return h;
  }

  void main() {
    vec3 pos = position; // plane's local Z is its normal
    float e   = waveHeight(pos.xy);
    float eps = 0.4;
    float ex  = waveHeight(pos.xy + vec2(eps, 0.0));
    float ey  = waveHeight(pos.xy + vec2(0.0, eps));
    vec3 n = normalize(vec3(-(ex - e) / eps, -(ey - e) / eps, 1.0));
    pos.z += e;

    vElev = e;
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * n);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform vec3 uFogColor;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vElev;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);

    // Depth cue: troughs darken, crests catch the light
    float crest = smoothstep(-0.25, 0.42, vElev);
    vec3 col = mix(uDeep, uShallow, 0.18 + 0.5 * crest);

    // The star of a dusk sea: a tight sun glint down the wave faces
    vec3 H = normalize(uSunDir + V);
    float spec = pow(max(dot(N, H), 0.0), 240.0);
    col += uSunColor * spec * 1.35;

    // Fresnel: grazing angles mirror the sky
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 sky = vec3(0.20, 0.19, 0.20);
    col = mix(col, sky, fres * 0.5);

    // Foam on the highest crests only — subtle, not a snowstorm
    float foam = smoothstep(0.38, 0.55, vElev) * 0.22;
    col = mix(col, vec3(0.75, 0.87, 0.95), foam);

    // Manual distance fog (matches the scene fog colour)
    float fog = smoothstep(55.0, 165.0, length(cameraPosition - vWorldPos));
    col = mix(col, uFogColor, fog);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export default function Ocean() {
  const mat = useRef()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#04121e') },
      uShallow: { value: new THREE.Color('#0d3550') },
      uSunColor: { value: new THREE.Color('#ffb36b') },
      uSunDir: { value: new THREE.Vector3(26, 14, 18).normalize() }, // match the key light
      uFogColor: { value: new THREE.Color('#071019') },
    }),
    [],
  )

  useFrame((_, delta) => {
    mat.current.uniforms.uTime.value += delta
  })

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.55}>
      <planeGeometry args={[320, 320, 150, 150]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} />
    </mesh>
  )
}
