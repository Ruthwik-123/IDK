/**
 * Copy for the five scroll beats — cinematic scrollytelling, modelled on the
 * reference "product story" rather than narrated Q&A slides. Four story beats
 * tease the four questions; a final "on paper" appendix lays out all 15 points
 * as a clean data sheet (the honest content for the exam).
 *
 * Facts cross-checked against the Smithsonian Global Volcanism Program
 * (Barren Island, vn 260010) and field reports.
 */

export const CHAPTERS = [
  { n: '01', label: 'The Only Volcano' },
  { n: '02', label: 'Caldera' },
  { n: '03', label: 'Awakening' },
  { n: '04', label: 'Type' },
  { n: '05', label: 'On the Record' },
]

export const SECTIONS = [
  {
    id: 'hero',
    n: '01',
    tag: 'The Only Volcano · Andaman Sea',
    title: 'One country. One volcano.',
    line: 'In the Andaman Sea a lone cone is on fire — the only volcano in India confirmed to be erupting. Scroll. The rest of the story is not on the face.',
    align: 'center',
    hero: true,
  },
  {
    id: 'caldera',
    n: '02',
    tag: 'A Caldera in a Caldera',
    title: '354 metres up. 2,250 down.',
    line: 'A stratovolcano nested inside a 2-km caldera, open to the sea on the west, built from layers of lava and ash.',
    align: 'left',
  },
  {
    id: 'awakening',
    n: '03',
    tag: '150 Years Silent',
    title: 'Asleep by 1852. Awake by 1991.',
    line: 'After a century and a half of quiet it stirred — and its most recent confirmed eruption ran through 2025–26.',
    align: 'right',
  },
  {
    id: 'type',
    n: '04',
    tag: 'Composite & Active',
    title: 'Not a cone. Not a shield. A pile of layers.',
    line: 'Composite — and living. The only active volcano on the whole Sumatra-to-Myanmar arc.',
    align: 'left',
  },
  {
    id: 'record',
    n: '05',
    tag: 'The Whole Brief on Paper',
    title: 'The 15 points, on the record.',
    line: 'Everything above was rendered in real time from procedural geometry. What follows is the part that stays on the exam sheet.',
    align: 'right',
    spec: true,
  },
]

/**
 * The appendix / data sheet — exactly 15 rows, grouped by question.
 * Renders as a clean label-value grid (like a specification sheet).
 */
export const SPEC = [
  {
    q: 'Q1',
    title: 'The Only Volcano',
    items: [
      ['Barren Island', 'Only active volcano in India'],
      ['~135 km NE of Port Blair', '12.28°N 93.86°E · Andaman Sea'],
      ['Only one in history', 'Only Indian volcano to erupt; the only one on the Sumatra–Myanmar arc'],
      ['354 m', 'Uninhabited summit above the waves'],
    ],
  },
  {
    q: 'Q2',
    title: 'Define & Surroundings',
    items: [
      ['A vent', 'Where magma, ash and gas erupt to the surface'],
      ['Stratovolcano', 'Nested inside a ~2 km caldera'],
      ['3 km island', 'Walls 250–350 m · breached open to the sea on the west'],
      ['~2,250 m', 'Rises from the seabed · basalt and basaltic andesite'],
    ],
  },
  {
    q: 'Q3',
    title: 'Its Last Eruption & Why',
    items: [
      ['2025–26', 'Most recent confirmed eruption period'],
      ['2024', 'An earlier large episode'],
      ['Subduction', 'Indian plate dives under the Burma plate; water lowers the melt point'],
      ['VEI 1–2', 'Small but frequent · 20+ since 1900'],
    ],
  },
  {
    q: 'Q4',
    title: 'Type & Activity',
    items: [
      ['COMPOSITE', 'Alternating lava, ash and pyroclastic layers'],
      ['ACTIVE', 'Reawoke in 1991 · still monitored as erupting'],
      ['Late-Pleistocene', 'The collapse that made the caldera it nests in'],
    ],
  },
]

export const TOTAL_POINTS = 15
export const PAGES = SECTIONS.length
