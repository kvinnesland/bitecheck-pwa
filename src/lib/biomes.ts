import type { Biome, WaterType } from '../types';

export interface BiomeDef {
  id: Biome;
  gradient: string;
  image: string;
  waterType: WaterType | 'both';
}

// Arctic Saltwater reuses the existing default banner until real photos are supplied.
// All others point to /assets/biomes/{id}.jpg; BiomeBanner hides broken images so the
// gradient fallback always shows when files aren't there yet.
export const BIOMES: BiomeDef[] = [
  {
    id: 'arctic_salt',
    gradient: 'linear-gradient(150deg, #0c2330 0%, #1a4a5e 45%, #2d7a8a 80%, #3a9aaa 100%)',
    image: '/banner-default.jpg',
    waterType: 'salt',
  },
  {
    id: 'arctic_fresh',
    gradient: 'linear-gradient(150deg, #0d2436 0%, #1c3f60 45%, #245e7a 80%, #2d7a9a 100%)',
    image: '/assets/biomes/arctic_fresh.jpg',
    waterType: 'fresh',
  },
  {
    id: 'ice',
    gradient: 'linear-gradient(150deg, #7ab8d0 0%, #a0cfdf 30%, #c8e8f2 60%, #e0f4ff 100%)',
    image: '/assets/biomes/ice.jpg',
    waterType: 'both',
  },
  {
    id: 'tropical_fresh',
    gradient: 'linear-gradient(150deg, #0f3320 0%, #1a5c32 40%, #228a45 70%, #2ab858 100%)',
    image: '/assets/biomes/tropical_fresh.jpg',
    waterType: 'fresh',
  },
  {
    id: 'tropical_salt',
    gradient: 'linear-gradient(150deg, #003a5c 0%, #0060a0 40%, #0090c0 70%, #00b8d0 100%)',
    image: '/assets/biomes/tropical_salt.jpg',
    waterType: 'salt',
  },
  {
    id: 'temperate_fresh',
    gradient: 'linear-gradient(150deg, #1a2e18 0%, #2d5028 40%, #3d7038 70%, #4d9248 100%)',
    image: '/assets/biomes/temperate_fresh.jpg',
    waterType: 'fresh',
  },
  {
    id: 'temperate_salt',
    gradient: 'linear-gradient(150deg, #1a2a3a 0%, #2d4d6a 40%, #3d6d8a 70%, #4d8daa 100%)',
    image: '/assets/biomes/temperate_salt.jpg',
    waterType: 'salt',
  },
];

export const DEFAULT_BIOME: Biome = 'arctic_salt';
export const DEFAULT_FRESH_BIOME: Biome = 'temperate_fresh';

export function getBiome(id: Biome | undefined | null): BiomeDef {
  return BIOMES.find(b => b.id === id) ?? BIOMES.find(b => b.id === DEFAULT_BIOME)!;
}

export function getBiomesForWaterType(waterType: WaterType): BiomeDef[] {
  return BIOMES.filter(b => b.waterType === waterType || b.waterType === 'both');
}

export function defaultBiomeForWaterType(waterType: WaterType): Biome {
  return waterType === 'salt' ? DEFAULT_BIOME : DEFAULT_FRESH_BIOME;
}
