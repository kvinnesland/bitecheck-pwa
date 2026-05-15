export interface DemoPost {
  species: string;
  weight_kg: number | null;
  length_cm: number | null;
  lat: number;
  lng: number;
  hoursAgo: number;
}

export interface DemoProfile {
  id: string;
  name: string;
  posts: DemoPost[];
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 'demo-ola',
    name: 'Ola Nordmann',
    posts: [
      { species: 'Torsk',  weight_kg: 4.2,  length_cm: 68,  lat: 59.12, lng: 10.73, hoursAgo: 1.5 },
      { species: 'Sei',    weight_kg: 1.8,  length_cm: 52,  lat: 59.15, lng: 10.68, hoursAgo: 14  },
      { species: 'Hyse',   weight_kg: 0.9,  length_cm: 38,  lat: 59.08, lng: 10.71, hoursAgo: 36  },
    ],
  },
  {
    id: 'demo-kari',
    name: 'Kari Hansen',
    posts: [
      { species: 'Laks',     weight_kg: 6.1, length_cm: 82, lat: 59.92, lng: 10.74, hoursAgo: 3  },
      { species: 'Sjøørret', weight_kg: 1.4, length_cm: 49, lat: 59.88, lng: 10.79, hoursAgo: 28 },
    ],
  },
  {
    id: 'demo-bjorn',
    name: 'Bjørn Eriksen',
    posts: [
      { species: 'Makrell', weight_kg: 0.4,  length_cm: 33,  lat: 58.16, lng: 7.99,  hoursAgo: 6   },
      { species: 'Makrell', weight_kg: 0.5,  length_cm: 35,  lat: 58.16, lng: 7.99,  hoursAgo: 6.5 },
      { species: 'Kveite',  weight_kg: 18.5, length_cm: 112, lat: 70.07, lng: 25.52, hoursAgo: 52  },
    ],
  },
  {
    id: 'demo-anne',
    name: 'Anne Sørensen',
    posts: [
      { species: 'Ørret',  weight_kg: 0.8, length_cm: 36, lat: 60.47, lng: 8.47, hoursAgo: 10 },
      { species: 'Gjedde', weight_kg: 3.2, length_cm: 71, lat: 60.43, lng: 8.51, hoursAgo: 48 },
    ],
  },
];
