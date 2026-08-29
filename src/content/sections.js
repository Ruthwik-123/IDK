/**
 * Copy for the five scroll chapters.
 * Facts cross-checked against the Smithsonian Global Volcanism Program and
 * field reports — keep them presentation-safe.
 */
export const CHAPTERS = [
  { n: '01', label: 'Introduction' },
  { n: '02', label: 'Origin' },
  { n: '03', label: 'Anatomy' },
  { n: '04', label: 'Activity' },
  { n: '05', label: 'Cross-Section' },
]

export const SECTIONS = [
  {
    id: 'intro',
    n: '01',
    tag: 'Introduction',
    title: 'Barren Island',
    body: 'A smoking dome of black rock standing alone in the Andaman Sea — the only active volcano in India, and the only one still erupting in all of South Asia.',
    align: 'center',
    hero: true,
  },
  {
    id: 'origin',
    n: '02',
    tag: 'Origin',
    title: 'A Child of Two Colliding Plates',
    body:
      'Beneath the Andaman Sea, the Indian plate grinds under the Burma plate along one of Asia’s great subduction zones. Magma squeezed out of that engine rises two and a half kilometres and breaks the surface here — first witnessed erupting in 1787.',
    align: 'left',
    stats: [
      ['~135 km', 'NE of Port Blair'],
      ['2,250 m', 'of volcano under sea'],
      ['1787', 'first recorded eruption'],
    ],
  },
  {
    id: 'anatomy',
    n: '03',
    tag: 'Anatomy',
    title: 'A Caldera Inside a Caldera',
    body:
      'The 3-km-wide island is the rim of a roughly 2-km caldera — carved by a colossal late-Pleistocene eruption and open to the sea on the west. Inside it, a young stratovolcano with two small craters keeps rebuilding itself, reaching 354 m above the waves.',
    align: 'right',
    stats: [
      ['354 m', 'highest point'],
      ['~2 km', 'caldera width'],
      ['3 km', 'island across'],
    ],
  },
  {
    id: 'activity',
    n: '04',
    tag: 'Activity',
    title: 'It Is Still Breathing',
    body:
      'After a 150-year sleep, the 1990s awakened it. Strombolian bursts, fire fountains, glowing lava in the crater and ash plumes have followed for much of the decades since — the most recent episode was recorded in 2024. On active nights the whole island glows from sea level.',
    align: 'left',
    stats: [
      ['20', 'eruptions since 1900'],
      ['VEI 2', 'typical event'],
      ['2024', 'last recorded activity'],
    ],
  },
  {
    id: 'impact',
    n: '05',
    tag: 'Why It Matters',
    title: 'The Engine, Exposed',
    body:
      'Field geologists think in cutaways — so does this story. Slice the island and the engine appears: a magma chamber feeding a conduit pipe, wrapped in millions of years of stratified lava and ash. A reminder that subduction zones are not diagrams: they are machines, and this one still runs hot.',
    align: 'right',
    stats: [
      ['Chamber', 'melt reservoir'],
      ['Conduit', 'eruption pipe'],
      ['Strata', 'eruption history'],
    ],
  },
]

export const PAGES = SECTIONS.length
