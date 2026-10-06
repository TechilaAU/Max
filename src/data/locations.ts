// Service areas. `draft: true` hides a location until confirmed (e.g. merging the Central Coast site).
export const locations = [
  { slug: 'adelaide', name: 'Adelaide', state: 'SA', draft: false,
    intro: 'Next-day delivery of hire and purchase equipment across metropolitan Adelaide, 7 days a week (select items on Sunday), with free delivery to Adelaide hospitals.',
    // TODO: confirm suburbs/regions covered and any outer-area fees.
    areas: ['Adelaide CBD', 'Eastern suburbs', 'Western suburbs', 'Northern suburbs', 'Southern suburbs', 'Adelaide Hills'] },
  { slug: 'central-coast-nsw', name: 'Central Coast NSW', state: 'NSW', draft: true,
    intro: 'Hire and purchase equipment with delivery across the Central Coast, Newcastle and Hunter.',
    areas: ['Central Coast', 'Newcastle', 'Hunter'] },
];
export const liveLocations = locations.filter((l) => !l.draft);
