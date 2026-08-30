import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { NOISE_GLSL, SKY_GLSL } from '../lib/glsl'
import { ISLAND, waterlineRadius } from '../lib/island'

/**
 * The sea. One 150x150 plane, analytic wave stack, no textures and no
 * per-frame CPU writes — but now it does a great deal more:
 *
 *  - reflects the SAME analytic sky the dome draws (shared SKY_GLSL),
 *    so the water and the air agree about where the sun is
 *  - per-pixel gloss variation (noise-driven exponent) = real glitter,
 *    not a single hard specular blob
 *  - a shallow shelf + breaking surf ring placed from the island's
 *    ACTUAL waterline radius, so the surf always hugs the coastline
 *  - depth cueing, crest foam, fresnel and manual distance fog
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

const FRAG =
  NOISE_GLSL +
  SKY_GLSL +
  /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uShelf;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform vec3 uFogColor;
  uniform float uTime;
  uniform float uShore;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vElev;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec2 P = vWorldPos.xz;

    // ---- coastline: wobbled so the surf is never a perfect circle ----
    float wob = fbm(P * 0.16) - 0.5;
    float shore = uShore + wob * 2.4;
    float r = length(P);
    float shelf = 1.0 - smoothstep(shore, shore + 7.5, r);

    // ---- body colour: troughs dark, crests lit, shelf goes turquoise ----
    float crest = smoothstep(-0.25, 0.42, vElev);
    vec3 col = mix(uDeep, uShallow, 0.16 + 0.5 * crest);
    col = mix(col, uShelf, shelf * (0.55 + 0.45 * crest) * 0.9);

    // ---- sun glitter: vary the gloss per pixel, water is not a mirror ----
    vec3 H = normalize(normalize(uSunDir) + V);
    float gloss = mix(160.0, 780.0, vnoise(P * 0.85 + uTime * 0.13));
    float spec = pow(max(dot(N, H), 0.0), gloss);
    col += uSunColor * spec * (1.15 + 0.5 * shelf);

    // ---- fresnel reflection of the shared sky ----
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 R = reflect(-V, N);
    R.y = abs(R.y) + 0.02; // never sample below the horizon
    vec3 sky = skyColor(R, uSunDir);
    col = mix(col, sky, clamp(fres * 0.9, 0.0, 1.0));

    // ---- foam: crest flecks + a breaking band that runs up the beach ----
    float fleck = smoothstep(0.40, 0.58, vElev) * 0.20;
    float band  = 1.0 - smoothstep(0.0, 2.9, r - shore);
    float pulse = 0.5 + 0.5 * sin(r * 2.3 - uTime * 1.7 + wob * 7.0);
    float break_ = band * (0.30 + 0.55 * pulse) * smoothstep(0.28, 0.72, fbm(P * 0.55 + uTime * 0.06));
    float foam = max(fleck, break_);
    col = mix(col, vec3(0.78, 0.88, 0.95), clamp(foam, 0.0, 1.0) * 0.85);

    // ---- manual distance fog (ShaderMaterial ignores scene fog) ----
    float fog = smoothstep(55.0, 168.0, length(cameraPosition - vWorldPos));
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
      uDeep: { value: new THREE.Color('#03101b') },
      uShallow: { value: new THREE.Color('#0b3049') },
      uShelf: { value: new THREE.Color('#0d4a52') },
      uSunColor: { value: new THREE.Color('#ffb36b') },
      uSunDir: { value: new THREE.Vector3(26, 14, 18).normalize() }, // match the key light
      uFogColor: { value: new THREE.Color('#071019') },
      uShore: { value: waterlineRadius() }, // derived from the island geometry
    }),
    [],
  )

  useFrame((_, delta) => {
    mat.current.uniforms.uTime.value += delta
  })

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={ISLAND.seaLevel}>
      <planeGeometry args={[320, 320, 150, 150]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} />
    </mesh>
  )
}
