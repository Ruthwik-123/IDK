import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { ISLAND } from '../lib/island'
import { world } from '../state/worldState'

const MAX = 90

/**
 * Milestone 2 — ballistic lava bombs with real Rapier dynamics.
 *
 * A fixed pool of MAX rigid bodies is created ONCE and recycled in
 * place — zero allocations, zero React re-renders. Dead bombs are
 * disabled so the physics cost is O(active).
 *
 * ── API notes (Rapier 0.14+) ───────────────────────────────────
 *  RigidBodyDesc.dynamic()   → factory method (no `new`)
 *  ColliderDesc.ball(r)      → factory method (no `new`)
 *  desc.setTranslation(x,y,z) → three individual numbers
 *  body.setTranslation({x,y,z}, wake) → object + boolean
 *  body.addForce({x,y,z}, wake)       → all three components required
 */

const VERT = /* glsl */ `
  attribute float aHeat;
  varying float vHeat;
  varying vec3 vNrm;
  varying vec3 vLocal;

  void main() {
    vHeat = aHeat;
    vLocal = position;
    vNrm = normalize(mat3(modelViewMatrix) * (mat3(instanceMatrix) * normal));
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform float uEruption;
  varying float vHeat;
  varying vec3 vNrm;
  varying vec3 vLocal;

  void main() {
    float m = 0.5 + 0.5 * sin(vLocal.x * 11.0) * sin(vLocal.y * 8.0) * sin(vLocal.z * 9.0);
    float heat = clamp(vHeat, 0.0, 1.0);

    vec3 crust = vec3(0.045, 0.040, 0.046);
    vec3 hot   = vec3(1.00, 0.42, 0.09);
    vec3 white = vec3(1.00, 0.93, 0.74);

    float glow = smoothstep(0.22, 0.92, heat * (0.45 + 0.55 * m));
    vec3 col = mix(crust, hot, glow);
    col = mix(col, white, smoothstep(0.88, 1.0, glow));
    col += hot * glow * 0.55;

    float facing = max(vNrm.z, 0.0);
    float rim = pow(1.0 - facing, 2.5);
    col *= 0.45 + 0.6 * facing + rim * 0.25 * (0.4 + 0.6 * heat);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export default function LavaBombs() {
  const { world: rapierWorld, rapier } = useRapier()
  const meshRef = useRef()
  const spawnClock = useRef(0)

  const slots = useMemo(
    () =>
      Array.from({ length: MAX }, () => ({
        body: null,
        radius: 0.12,
        age: 0,
        life: 0,
        free: true,
      })),
    [],
  )

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uEruption: { value: 0 } },
        vertexShader: VERT,
        fragmentShader: FRAG,
      }),
    [],
  )

  // build the pool once the Rapier world exists
  useEffect(() => {
    if (!rapierWorld || !rapier) return
    for (const s of slots) {
      // Factory methods — no `new`
      const desc = rapier.RigidBodyDesc.dynamic()
        .setLinearDamping(0.04)
        .setAngularDamping(0.28)
        .setCcdEnabled(true)
      s.body = rapierWorld.createRigidBody(desc)
      s.radius = 0.09 + Math.random() * 0.2

      const col = rapier.ColliderDesc.ball(s.radius)
        .setRestitution(0.34)
        .setFriction(0.88)
        .setDensity(2.7)
      rapierWorld.createCollider(col, s.body)

      // park far below scene, disabled
      s.body.setTranslation({ x: 0, y: -999, z: 0 }, false)
      s.body.setEnabled(false)
    }
    return () => {
      for (const s of slots) {
        if (s.body) {
          try { rapierWorld.removeRigidBody(s.body) } catch (_) { /* world may already be gone */ }
        }
        s.body = null
      }
    }
  }, [rapierWorld, rapier, slots])

  const scratch = useMemo(
    () => ({
      p: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      dummy: new THREE.Object3D(),
    }),
    [],
  )

  // initialise the instanced mesh (park all instances below the scene)
  useEffect(() => {
    const m = meshRef.current
    if (!m) return
    const heat = m.geometry.getAttribute('aHeat')
    for (let i = 0; i < MAX; i++) {
      heat.setX(i, 0)
      scratch.dummy.position.set(0, -999, 0)
      scratch.dummy.scale.setScalar(0)
      scratch.dummy.updateMatrix()
      m.setMatrixAt(i, scratch.dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    heat.needsUpdate = true
  }, [scratch])

  /** Launch one bomb from the crater lip, in the island's own frame. */
  const spawn = (s) => {
    const b = s.body
    if (!b) return
    const a = Math.random() * Math.PI * 2
    const r = 0.35 + Math.random() * 1.15

    // crater lip in the island's local space → world
    scratch.p.set(Math.cos(a) * r, ISLAND.craterFloor + 0.45, Math.sin(a) * r)
    scratch.p.applyMatrix4(world.island)

    scratch.vel
      .set(
        Math.cos(a) * (0.3 + Math.random() * 0.55),
        1.15,
        Math.sin(a) * (0.3 + Math.random() * 0.55),
      )
      .normalize()
      .multiplyScalar(5.5 + Math.random() * 8.5)

    // rotate the launch velocity by the island's current yaw
    world.island.decompose(scratch.dummy.position, scratch.q, scratch.dummy.scale)
    scratch.vel.applyQuaternion(scratch.q)

    b.setEnabled(true)
    b.setTranslation(
      { x: scratch.p.x, y: scratch.p.y, z: scratch.p.z },
      true,
    )
    b.setLinvel(
      { x: scratch.vel.x, y: scratch.vel.y, z: scratch.vel.z },
      true,
    )
    b.setAngvel(
      {
        x: (Math.random() - 0.5) * 9,
        y: (Math.random() - 0.5) * 9,
        z: (Math.random() - 0.5) * 9,
      },
      true,
    )

    s.age = 0
    s.life = 3.5 + Math.random() * 3.5
    s.free = false
  }

  useFrame((state, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const eruption = world.eruption
    mat.uniforms.uEruption.value = eruption

    const heatAttr = mesh.geometry.getAttribute('aHeat')
    const dummy = scratch.dummy

    // spawn: rate ramps with the eruption curve (60% milestone)
    if (eruption > 0.02) {
      spawnClock.current += delta * 26 * eruption
      while (spawnClock.current >= 1) {
        spawnClock.current -= 1
        const s = slots.find((x) => x.free)
        if (s) spawn(s)
      }
    }

    // sync instanced mesh with physics + recycle dead bombs
    for (let i = 0; i < MAX; i++) {
      const s = slots[i]
      if (s.free || !s.body) continue

      s.age += delta
      const tr = s.body.translation()

      // recycle on expiry or when submerged
      if (s.age > s.life || tr.y < 0.1) {
        s.body.setEnabled(false)
        s.free = true
        dummy.position.set(0, -999, 0)
        dummy.scale.setScalar(0)
        dummy.quaternion.identity()
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        heatAttr.setX(i, 0)
        continue
      }

      const rot = s.body.rotation()
      dummy.position.set(tr.x, tr.y, tr.z)
      dummy.quaternion.set(rot.x, rot.y, rot.z, rot.w)
      const cool = Math.max(0, 1 - s.age / (s.life * 0.55))
      dummy.scale.setScalar(s.radius * (0.82 + 0.18 * cool))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      heatAttr.setX(i, cool * (0.55 + 0.45 * eruption))
    }

    mesh.instanceMatrix.needsUpdate = true
    heatAttr.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]}>
        <instancedBufferAttribute attach="attributes-aHeat" args={[new Float32Array(MAX), 1]} />
      </icosahedronGeometry>
      <primitive object={mat} attach="material" />
    </instancedMesh>
  )
}
