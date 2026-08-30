import { useMemo } from 'react'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/**
 * The film look.
 *
 *  Bloom       — the lava lake, ember cloud, magma chamber, sky sun disc
 *                (all > 1.0 on purpose) bleed light into their neighbours.
 *  ToneMapping — ACES filmic. The composer renders into a float target, so
 *                three's per-material tone mapping is skipped; this is where
 *                the highlight roll-off has to happen.
 *  Vignette    — closes the frame in.
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.15}
        luminanceThreshold={0.28}
        luminanceSmoothing={0.28}
        radius={0.78}
        mipmapBlur
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.3} darkness={0.58} />
    </EffectComposer>
  )
}
