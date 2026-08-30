/**
 * Copy for the four scroll chapters.
 *
 * Chapter 1 carries no text overlay at all — it opens on the bare 3D model,
 * blurs, and settles on a photographic reference of the real island before
 * the story continues (see IntroReveal.jsx).
 *
 * All 15 required narrative points are distributed across chapters 2–4;
 * each is tagged inline with the category it belongs to. (The ecology and
 * access points, #13 and #14, previously lived in the removed cross-section
 * chapter and now close out chapter 4.)
 *
 * Facts cross-checked against the Smithsonian Global Volcanism Program and
 * field reports — keep them presentation-safe.
 */
export const CHAPTERS = [
  { n: '01', label: 'Introduction' },
  { n: '02', label: 'Origin' },
  { n: '03', label: 'Anatomy' },
  { n: '04', label: 'Activity' },
]

export const SECTIONS = [
  {
    id: 'intro',
    n: '01',
    tag: 'Introduction',
    hero: true, // no text panel — the 3D → photo transition IS chapter 1
  },
  {
    id: 'origin',
    n: '02',
    tag: 'Origin',
    title: 'Andaman Sea, 12.28° N',
    body:
      // Location: Andaman Sea (#4) · precise coordinates (#5) · 138 km NE of
      // Port Blair / Sri Vijaya Puram (#6) · northernmost of the Indonesian
      // arc (#15) · first recorded eruption, 1787 (#7)
      'Barren Island sits alone in the Andaman Sea at roughly 12.28°N, 93.86°E — about 138 km northeast of Port Blair (Sri Vijaya Puram). It is the northernmost active volcano of the Indonesian volcanic arc, the same subduction chain that runs south through Sumatra and Java. It was first seen erupting in 1787, the earliest eruption on record here.',
    align: 'left',
    stats: [
      ['138 km', 'NE of Port Blair (Sri Vijaya Puram)'],
      ['12.28°N 93.86°E', 'precise coordinates'],
      ['1787', 'first recorded eruption'],
    ],
  },
  {
    id: 'anatomy',
    n: '03',
    tag: 'Anatomy',
    title: 'A Cone Inside a Caldera',
    body:
      // Visual: 8 sq km caldera (#1) · dark basaltic lava fields (#2) ·
      // central active cinder cone (#3) · composite/stratovolcano (#10) ·
      // nested cone inside the older caldera (#11)
      'Seen from above, the island is an 8 sq km circular caldera landscape — the collapsed rim of a much older volcano. Its floor is blanketed in dark grey and black cooled basaltic lava fields, and rising from the centre is a young, active cinder cone that keeps rebuilding itself with every eruption. Geologically it is a composite volcano, or stratovolcano: layer upon layer of lava and ash, with this newer cone nested inside the shell of the original caldera.',
    align: 'right',
    stats: [
      ['~8 km²', 'circular caldera floor'],
      ['Stratovolcano', 'composite structure'],
      ['Nested cone', 'inside the older caldera'],
    ],
  },
  {
    id: 'activity',
    n: '04',
    tag: 'Activity',
    title: 'It Is Still Breathing',
    body:
      // History: reactivation 1991/1995/2005 (#8) · 2004 Sumatra megathrust
      // trigger (#9) · status: only confirmed active volcano in India /
      // South Asia (#12) · ecology: uninhabited (#13) · access: restricted,
      // maritime-authority governed (#14)
      'After roughly 150 years of quiet, Barren Island reawakened through modern reactivation phases in 1991, 1995 and 2005 — the 2005 episode following closely on the 2004 Sumatra–Andaman megathrust earthquake, which is thought to have helped re-open its plumbing. It remains the only confirmed active volcano in India and in all of South Asia. No one lives here: the island is completely uninhabited, and landing is restricted, governed by the Indian Coast Guard and maritime authorities.',
    align: 'left',
    stats: [
      ['1991 · 1995 · 2005', 'reactivation phases'],
      ['2004', 'Sumatra megathrust trigger'],
      ['Uninhabited', 'restricted, maritime-controlled access'],
    ],
  },
]

export const PAGES = SECTIONS.length
