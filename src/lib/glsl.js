/**
 * Shared GLSL chunks.
 *
 * NOISE_GLSL — one fBm field for everything molten, tuned in one place.
 * SKY_GLSL   — the analytic dusk sky. The dome AND the ocean include it,
 *              so the sea genuinely reflects the sky it sits under.
 */
export const NOISE_GLSL = /* glsl */ `
  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
`

/**
 * Analytic dusk sky, as a function of view direction only.
 * Kept in one place so the dome, the ocean reflection and (if you add
 * them later) cloud sprites cannot disagree about the colour of the air.
 */
export const SKY_GLSL = /* glsl */ `
  vec3 skyColor(vec3 dir, vec3 sunDir) {
    vec3 d = normalize(dir);
    vec3 s = normalize(sunDir);
    float h = clamp(d.y, -0.4, 1.0);
    float sun = clamp(dot(d, s), 0.0, 1.0);

    // vertical ramp: dusk haze at the horizon, cold indigo overhead
    vec3 zenith  = vec3(0.014, 0.032, 0.075);
    vec3 mid     = vec3(0.045, 0.085, 0.160);
    vec3 coolHzn = vec3(0.075, 0.105, 0.165);

    // the horizon burns only on the sun side
    vec3 warmHzn = vec3(0.52, 0.22, 0.11);
    float warmSide = pow(sun, 1.5);
    vec3 horizon = mix(coolHzn, warmHzn, warmSide);

    vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.26, h));
    col = mix(col, zenith, smoothstep(0.16, 0.85, h));

    // broad scatter halo around the sun
    col += vec3(1.00, 0.46, 0.20) * pow(sun, 9.0) * 0.35 * smoothstep(-0.1, 0.25, h);
    // tight bloom-generating disc (HDR value feeds the post bloom pass)
    col += vec3(1.00, 0.72, 0.42) * pow(sun, 320.0) * 14.0;
    col += vec3(1.00, 0.55, 0.28) * pow(sun, 48.0) * 0.9;

    // long banded cirrus, thickest near the horizon
    float band = sin(atan(d.z, d.x) * 7.0 + d.y * 22.0) * 0.5 + 0.5;
    float bandMask = smoothstep(0.55, 1.0, band) * smoothstep(0.62, 0.06, abs(h - 0.06));
    col += mix(vec3(0.16, 0.09, 0.08), vec3(0.55, 0.28, 0.16), warmSide) * bandMask * 0.55;

    // below the horizon: the sea haze the ocean fades into
    col = mix(col, vec3(0.012, 0.026, 0.042), smoothstep(0.0, -0.22, h));
    return col;
  }
`
