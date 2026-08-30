import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { buildColliderArrays } from '../lib/island'
import { world } from '../state/worldState'
import LavaBombs from './LavaBombs'

/**
 * The physics stage.
 *
 * ── ALIGNMENT ────────────────────────────────────────────────────────
 * The visible rock and the invisible collider are rigidly welded: every
 * frame the kinematic body is placed by decomposing the SAME world matrix
 * that <Volcano> publishes for the island.
 *
 * The collider mesh is built from buildColliderArrays(), which samples the
 * identical ringPoint() surface function, just at lower resolution
 * (physics doesn't need 20k tris).
 */
function IslandCollider() {
  const rb = useRef()

  const geo = useMemo(() => {
    const { positions, indices } = buildColliderArrays()
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setIndex(new THREE.BufferAttribute(indices, 1))
    g.computeVertexNormals()
    return g
  }, [])

  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
    }),
    [],
  )

  useFrame(() => {
    const body = rb.current
    if (!body) return
    world.island.decompose(tmp.pos, tmp.quat, tmp.scale)
    body.setNextKinematicTranslation({
      x: tmp.pos.x,
      y: tmp.pos.y,
      z: tmp.pos.z,
    })
    body.setNextKinematicRotation({
      x: tmp.quat.x,
      y: tmp.quat.y,
      z: tmp.quat.z,
      w: tmp.quat.w,
    })
  })

  return (
    <RigidBody ref={rb} type="kinematicPosition" colliders="trimesh">
      <mesh geometry={geo} visible={false} />
    </RigidBody>
  )
}

export default function PhysicsWorld() {
  return (
    <Suspense fallback={null}>
      <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
        {/* the island — built from the same ringPoint() surface as the
            render mesh AND welded to its live world matrix */}
        <IslandCollider />

        {/* dynamic bodies */}
        <LavaBombs />
      </Physics>
    </Suspense>
  )
}
