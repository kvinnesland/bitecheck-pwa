export const KNOWN_SPECIES = new Set([
  'Torsk', 'Kveite', 'Sei', 'Hyse', 'Lange', 'Brosme',
  'Uer', 'Steinbit', 'Makrell', 'Rødspette', 'Lomre',
  'Sandflyndre', 'Sild', 'Laks', 'Sjøørret', 'Sjørøye',
  'Ørret', 'Røye', 'Abbor', 'Gjedde', 'Harr',
]);

// Salt/fresh classification — kept here so SpeciesCardHeader doesn't pull in biteScore (SunCalc)
export const SPECIES_WATER: ReadonlyMap<string, 'salt' | 'fresh'> = new Map([
  ['Torsk', 'salt'], ['Kveite', 'salt'], ['Sei', 'salt'], ['Hyse', 'salt'],
  ['Lange', 'salt'], ['Brosme', 'salt'], ['Uer', 'salt'], ['Steinbit', 'salt'],
  ['Makrell', 'salt'], ['Rødspette', 'salt'], ['Lomre', 'salt'],
  ['Sandflyndre', 'salt'], ['Sild', 'salt'], ['Laks', 'salt'],
  ['Sjøørret', 'salt'], ['Sjørøye', 'salt'],
  ['Ørret', 'fresh'], ['Røye', 'fresh'], ['Abbor', 'fresh'],
  ['Gjedde', 'fresh'], ['Harr', 'fresh'],
]);
