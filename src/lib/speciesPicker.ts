export type WaterType = 'salt' | 'fresh';

export const SALT_SPECIES = [
  'Torsk', 'Kveite', 'Sei', 'Hyse', 'Lange', 'Brosme', 'Uer', 'Steinbit',
  'Makrell', 'Rødspette', 'Lomre', 'Sandflyndre', 'Sild', 'Laks', 'Sjøørret', 'Sjørøye',
];

export const FRESH_SPECIES = ['Ørret', 'Røye', 'Abbor', 'Gjedde', 'Harr'];

export const UNKNOWN_SPECIES_NAME = "I don't know what kind of fish this is";
export const NOT_LISTED_SPECIES_NAME = 'Not listed (add manually)';

export type FixedSpeciesChoiceId = 'no_fish' | 'unknown' | 'not_listed';
export type FixedSpeciesChoiceAction = 'moment' | 'species';

export interface FixedSpeciesChoice {
  id: FixedSpeciesChoiceId;
  action: FixedSpeciesChoiceAction;
  speciesName?: string;
  labelKey: string;
  descriptionKey?: string;
}

export function getFixedSpeciesChoices(): FixedSpeciesChoice[] {
  return [
    {
      id: 'no_fish',
      action: 'moment',
      labelKey: 'log.noFishChoice',
      descriptionKey: 'log.noFishChoiceHint',
    },
    {
      id: 'unknown',
      action: 'species',
      speciesName: UNKNOWN_SPECIES_NAME,
      labelKey: 'log.unknownFishChoice',
    },
    {
      id: 'not_listed',
      action: 'species',
      speciesName: NOT_LISTED_SPECIES_NAME,
      labelKey: 'log.notListedChoice',
    },
  ];
}

export function getSpeciesForWaterType(waterType: WaterType): string[] {
  return waterType === 'salt' ? SALT_SPECIES : FRESH_SPECIES;
}

export function getSearchSpeciesResults(
  query: string,
  waterType: WaterType,
  translateSpeciesName: (name: string) => string = (name) => name,
): string[] {
  const searchQuery = query.trim().toLowerCase();
  if (!searchQuery) return [];

  return getSpeciesForWaterType(waterType).filter((species) => {
    return species.toLowerCase().includes(searchQuery)
      || translateSpeciesName(species).toLowerCase().includes(searchQuery);
  });
}
