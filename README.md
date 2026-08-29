# Barren Island — Scroll-Driven 3D Presentation

A cinematic, scroll-driven 3D story of **Barren Island** — India's only active
volcano — built for an SST presentation.

Stack: **Vite · React 19 · @react-three/fiber · @react-three/drei · Tailwind CSS v4**

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```

## Architecture

```
src/
├── App.jsx                     # Stage: <Canvas> + <ScrollControls> + DOM HUD
├── main.jsx
├── index.css                   # Tailwind v4 @theme tokens (lava/abyss palette, grain)
├── content/sections.js         # All presentation copy (5 chapters)
├── state/scrollStore.js        # zustand bridge: R3F scroll → DOM HUD
├── lib/
│   ├── math.js                 # smoothstep / fract helpers
│   ├── island.js               # world-space island constants (shared, no cycles)
│   ├── scroll.js               # THE choreography: milestone curves + split distance
│   └── glsl.js                 # shared fBm noise chunk (lava / chamber shaders)
└── components/
    ├── Scene.jsx               # 3D world: bg, fog, stars, lights, island, ocean
    ├── Sections.jsx            # DOM story panels (<Scroll html>) — scroll-synced
    ├── Overlay.jsx             # HUD: title, chapter rail, progress bar, hint
    ├── CameraRig.jsx           # Scroll-driven dolly (2 CatmullRom splines + parallax)
    ├── Lighting.jsx            # Cinematic key / rim / hemisphere rig + shadows
    ├── IslandEnvironment.jsx   # Procedural IBL via Lightformers (offline-safe)
    ├── Ocean.jsx               # Animated plane: analytic waves + custom shader
    ├── Volcano.jsx             # Split-capable island: halves, caps, lava, orchestration
    ├── EmberSystem.jsx         # Milestone 2 — ballistic lava embers (GPU point cloud)
    ├── SmokePlume.jsx          # GPU point-cloud plume (no per-frame CPU writes)
    ├── Interior.jsx            # Milestone 3 — magma chamber + conduit pipe
    └── Annotations.jsx         # Milestone 3 — drei <Html> structural callouts
```

### Data flow — one source of scroll truth

```
ScrollControls (pages=5, damping)
   │  useScroll() — live, per-frame, inside the canvas
   ├──▶ CameraRig      damp(offset) → camera + look-at splines + mouse parallax
   ├──▶ Volcano        milestone orchestrator (see below)
   │      ├── rotation / split      damped group transform
   │      ├── eruption value        damped + one-shot flash
   │      │      ├──▶ lava shader uniforms + crater point light
   │      │      ├──▶ rock material emission (onBeforeCompile injection)
   │      │      ├──▶ EmberSystem.uEruption        (60% trigger)
   │      │      ├──▶ SmokePlume activity
   │      │      └──▶ Interior chamber/conduit pulses
   │      └──▶ Annotations   fade refs (no React re-renders)
   ├──▶ ScrollBridge   throttled copy → zustand
   │        └──▶ Overlay (DOM)  chapter rail, progress bar, page counter
   └──▶ <Scroll html>  DOM story panels riding the same virtual scroll
```

### The three scroll milestones (lib/scroll.js)

All curves live in one module so every consumer is locked to the same
choreography — retune the story by editing that single file.

| # | Milestone | Trigger | How it works |
|---|-----------|---------|--------------|
| 1 | **Rotation** | continuous | `damp(rot, offset · ROTATION_TOTAL, 3.5, dt)` — the island yaws −72° across the film, which by chapter 5 swings the cut plane to face the closing camera. |
| 2 | **Eruption** | 60% mark | `eruptionAt = smoothstep(0.58, 0.66, offset)`, damped. On the exact trigger frame a one-shot `flash` spikes the lava/crater light. The value drives: ballistic **ember point cloud** (vertex-shader parabolic flight `p₀ + v·τ + ½g·τ²`, additive blending, cools white→red), smoke plume density, lava shader intensity, a crater point light, and the **crater material itself** — an `onBeforeCompile` injection adds `totalEmissiveRadiance += emberMask · uEruption · flicker` to the standard material, with a height mask so only the rim glows. |
| 3 | **Cross-section** | 80% mark | `splitTargetAt = offset ≥ 0.8 ? 1 : 0`, damped. Two watertight half-geometries part along X (`±SPLIT_DISTANCE`). Each half is built from the **same** surface function (`ringPoint`) and both keep the θ=0/π boundary columns, so the pieces meet exactly when closed. Each is capped with an **earcut-triangulated cut face** (offset 1.2 cm into its half — invisible while closed, exposed when open) coloured by a stratigraphy function: banded tuff/basalt, ash lenses, a mafic dike. The gap exposes a shader-displaced **magma chamber** and a **conduit pipe** with upward-flow bands; three drei `<Html>` callouts (chamber / conduit / stratifications) fade in via frame-loop opacity refs. |

### Design notes

- **No runtime asset fetches.** Environment map from `<Lightformer>`s
  (`frames={1}`), ocean/lava/chamber/conduit/embers/smoke are hand-rolled
  GLSL, grain is an SVG data-URI. Works offline — classroom-safe.
- **Frame-by-frame, not gsap.** Every animation is `THREE.MathUtils.damp`
  in `useFrame` against the live scroll offset — same result as a gsap
  timeline for this use case, zero extra dependency, and it composes with
  ScrollControls' own damping instead of fighting it.
- **Placeholder-first.** The island is procedural (noised cone, carved
  crater, vertex-colour geology). Swapping in a real model is a
  one-component change — scroll behaviour only touches group transforms
  and uniform values.
- **Performance budget.** ~30k triangles, 620 GPU-resident particles
  (embers + smoke, zero per-frame CPU writes), 1 shadow-casting light with
  a tight 2048 map, `dpr={[1,2]}`, no post-processing.

## Swapping in a real Barren Island model

1. `npm i draco3d` (if the GLTF is Draco-compressed).
2. In `Volcano.jsx`, replace the two half-geometry meshes with a real
   `useGLTF` scene (clipping planes can reproduce the split on a full mesh
   if you prefer that over modelling pre-cut halves).
3. Wrap in `<Suspense fallback={null}>` and adjust `ISLAND.craterFloor` /
   light positions to the model's real crater. `CameraRig` splines may need
   re-blocking — everything else is untouched.

## Extension ideas

- `@react-three/postprocessing` — bloom sells the crater glow (add after
  the core works; it's the first thing to eat frame budget).
- `<AdaptiveDpr>` / `<Preload>` if assets are added.
- Ambient audio (surf + rumble) via drei `<Audio>`, cross-faded by the same
  eruption curve from `lib/scroll.js`.
- A "quizzing" chapter: pause scroll and fire questions from `sections.js`.

## Verified facts used in the copy

Source: Smithsonian Global Volcanism Program (Barren Island, vn 260010) and
corresponding field reports. First recorded eruption 1787; ~2 km caldera in a
~3 km island; 354 m highest point; ~135 km NE of Port Blair; volcano rises
from ~2,250 m depth; 20 eruptions since 1900; last recorded episode 2024.
