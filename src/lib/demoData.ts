import type { Biome } from '../types';

export interface DemoCatch {
  species: string;
  weight_kg: number | null;
  length_cm: number | null;
  lat: number;
  lng: number;
  minutesIntoTrip: number;
  caption?: string;
  isMoment?: boolean;
}

export interface DemoTrip {
  id: string;
  title: string | null;
  note: string | null;
  status: 'open' | 'closed';
  waterType: 'salt' | 'fresh';
  biome: Biome;
  lat: number;
  lng: number;
  approximateLocationName: string;
  hoursAgo: number;
  durationHours: number | null;
  catches: DemoCatch[];
}

export interface DemoProfile {
  id: string;
  username: string;
  name: string;
  mainLocation: string;
  biome: Biome;
  followersCount: number;
  followingCount: number;
  trips: DemoTrip[];
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 'demo-ola',
    username: 'demo-ola',
    name: 'Ola Nordmann',
    mainLocation: 'Oslofjorden',
    biome: 'temperate_salt',
    followersCount: 14,
    followingCount: 9,
    trips: [
      {
        id: 'demo-ola-trip-1',
        title: 'Fjordtur utenfor Bastøy',
        note: 'God sørvestlig bris og fin strøm. Torsken biter alltid godt her ved Bastøy.',
        status: 'closed',
        waterType: 'salt',
        biome: 'temperate_salt',
        lat: 59.37,
        lng: 10.62,
        approximateLocationName: 'Oslofjorden, Bastøya',
        hoursAgo: 75,
        durationHours: 4,
        catches: [
          { species: 'Torsk',  weight_kg: 4.2, length_cm: 68, lat: 59.37, lng: 10.62, minutesIntoTrip: 30 },
          { species: 'Sei',    weight_kg: 1.8, length_cm: 52, lat: 59.36, lng: 10.63, minutesIntoTrip: 90 },
          { species: 'Hyse',   weight_kg: 0.9, length_cm: 38, lat: 59.38, lng: 10.61, minutesIntoTrip: 155 },
        ],
      },
      {
        id: 'demo-ola-trip-2',
        title: 'Morgenfiske fra Horten brygge',
        note: null,
        status: 'open',
        waterType: 'salt',
        biome: 'temperate_salt',
        lat: 59.41,
        lng: 10.48,
        approximateLocationName: 'Oslofjorden, Horten',
        hoursAgo: 5,
        durationHours: null,
        catches: [
          { species: 'Torsk', weight_kg: 2.1, length_cm: 55, lat: 59.41, lng: 10.48, minutesIntoTrip: 20 },
        ],
      },
    ],
  },

  {
    id: 'demo-kari',
    username: 'demo-kari',
    name: 'Kari Hansen',
    mainLocation: 'Trøndelag',
    biome: 'arctic_fresh',
    followersCount: 22,
    followingCount: 11,
    trips: [
      {
        id: 'demo-kari-trip-1',
        title: 'Laksetur i Namsen',
        note: 'Vannet hadde perfekt temperatur og strøm. Beste dag i år – endelig laks!',
        status: 'closed',
        waterType: 'fresh',
        biome: 'arctic_fresh',
        lat: 64.46,
        lng: 11.92,
        approximateLocationName: 'Namsen, Grong',
        hoursAgo: 200,
        durationHours: 7,
        catches: [
          { species: 'Laks',     weight_kg: 6.1, length_cm: 82, lat: 64.46, lng: 11.92, minutesIntoTrip: 45 },
          { species: '',         weight_kg: null, length_cm: null, lat: 64.46, lng: 11.93, minutesIntoTrip: 120, caption: 'Utsikten her er helt magisk ✨', isMoment: true },
          { species: 'Sjøørret', weight_kg: 1.4, length_cm: 49, lat: 64.47, lng: 11.91, minutesIntoTrip: 280 },
        ],
      },
      {
        id: 'demo-kari-trip-2',
        title: 'Ørretfiske Snåsavatnet',
        note: null,
        status: 'closed',
        waterType: 'fresh',
        biome: 'arctic_fresh',
        lat: 64.01,
        lng: 11.49,
        approximateLocationName: 'Snåsavatnet',
        hoursAgo: 52,
        durationHours: 3,
        catches: [
          { species: 'Ørret', weight_kg: 0.7, length_cm: 34, lat: 64.01, lng: 11.49, minutesIntoTrip: 40 },
          { species: 'Ørret', weight_kg: 0.3, length_cm: 28, lat: 64.00, lng: 11.50, minutesIntoTrip: 82 },
        ],
      },
    ],
  },

  {
    id: 'demo-bjorn',
    username: 'demo-bjorn',
    name: 'Bjørn Eriksen',
    mainLocation: 'Lofoten',
    biome: 'arctic_salt',
    followersCount: 41,
    followingCount: 18,
    trips: [
      {
        id: 'demo-bjorn-trip-1',
        title: 'Kveite-jakt Vestfjorden',
        note: 'Endelig storkveita!! Tre år med forsøk og den tok endelig. 147 cm og 42,5 kg – det er drømmefisken.',
        status: 'closed',
        waterType: 'salt',
        biome: 'arctic_salt',
        lat: 68.30,
        lng: 14.80,
        approximateLocationName: 'Vestfjorden, Lofoten',
        hoursAgo: 316,
        durationHours: 9,
        catches: [
          { species: 'Kveite', weight_kg: 42.5, length_cm: 147, lat: 68.30, lng: 14.80, minutesIntoTrip: 220 },
          { species: 'Sei',    weight_kg: 2.8,  length_cm: 61,  lat: 68.31, lng: 14.79, minutesIntoTrip: 385 },
        ],
      },
      {
        id: 'demo-bjorn-trip-2',
        title: 'Makrellen biter 🔥',
        note: null,
        status: 'closed',
        waterType: 'salt',
        biome: 'arctic_salt',
        lat: 67.28,
        lng: 14.38,
        approximateLocationName: 'Saltfjorden, Bodø',
        hoursAgo: 122,
        durationHours: 3,
        catches: [
          { species: 'Makrell', weight_kg: 0.4, length_cm: 33, lat: 67.28, lng: 14.38, minutesIntoTrip: 8  },
          { species: 'Makrell', weight_kg: 0.5, length_cm: 35, lat: 67.28, lng: 14.38, minutesIntoTrip: 11 },
          { species: 'Makrell', weight_kg: 0.4, length_cm: 31, lat: 67.29, lng: 14.37, minutesIntoTrip: 13 },
          { species: 'Makrell', weight_kg: 0.6, length_cm: 36, lat: 67.29, lng: 14.37, minutesIntoTrip: 22 },
          { species: '',        weight_kg: null, length_cm: null, lat: 67.28, lng: 14.38, minutesIntoTrip: 28, caption: 'De biter på absolutt alt som er kastelangt nå 😂', isMoment: true },
          { species: 'Makrell', weight_kg: 0.3, length_cm: 29, lat: 67.28, lng: 14.39, minutesIntoTrip: 44 },
        ],
      },
    ],
  },

  {
    id: 'demo-anne',
    username: 'demo-anne',
    name: 'Anne Sørensen',
    mainLocation: 'Telemark',
    biome: 'temperate_fresh',
    followersCount: 8,
    followingCount: 15,
    trips: [
      {
        id: 'demo-anne-trip-1',
        title: 'Fjellørret i Telemark',
        note: 'Fjellet i høst er noe helt for seg selv. Klarvann, null vind og null folk.',
        status: 'closed',
        waterType: 'fresh',
        biome: 'temperate_fresh',
        lat: 59.77,
        lng: 8.65,
        approximateLocationName: 'Bandak, Kviteseid',
        hoursAgo: 128,
        durationHours: 5,
        catches: [
          { species: 'Ørret', weight_kg: 0.8, length_cm: 36, lat: 59.77, lng: 8.65, minutesIntoTrip: 35 },
          { species: 'Ørret', weight_kg: 0.5, length_cm: 31, lat: 59.76, lng: 8.66, minutesIntoTrip: 110 },
          { species: '',      weight_kg: null, length_cm: null, lat: 59.77, lng: 8.65, minutesIntoTrip: 195, caption: 'Solnedgangen her er helt fantastisk 🌅', isMoment: true },
        ],
      },
      {
        id: 'demo-anne-trip-2',
        title: 'Abborfiske Norsjø',
        note: null,
        status: 'open',
        waterType: 'fresh',
        biome: 'temperate_fresh',
        lat: 59.24,
        lng: 9.07,
        approximateLocationName: 'Norsjø, Telemark',
        hoursAgo: 2,
        durationHours: null,
        catches: [
          { species: 'Abbor', weight_kg: 0.4, length_cm: 28, lat: 59.24, lng: 9.07, minutesIntoTrip: 15 },
          { species: 'Abbor', weight_kg: 0.6, length_cm: 32, lat: 59.25, lng: 9.06, minutesIntoTrip: 40 },
        ],
      },
    ],
  },
];
