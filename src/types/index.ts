export type SyncStatus = 'pending' | 'synced' | 'failed';

export type LocationPref = 'exact' | 'approximate' | 'hidden';

export type Biome =
  | 'arctic_salt'
  | 'arctic_fresh'
  | 'ice'
  | 'tropical_fresh'
  | 'tropical_salt'
  | 'temperate_fresh'
  | 'temperate_salt';

export type TripVisibility = 'everyone' | 'followers' | 'only_me';
export type WaterType = 'salt' | 'fresh';

export interface Trip {
  tripId: string;
  uid: string;
  status: 'open' | 'closed';
  visibility: TripVisibility;
  isMultiDay?: boolean;
  title: string | null;
  note: string | null;
  startedAt: string;       // ISO string
  closedAt: string | null;
  location: CatchLocation | null;
  locationShare: LocationPref;
  approximateLocationName: string | null;
  catchCount: number;
  species: string[];
  waterType: WaterType;
  biome?: Biome;
  reactionCounts?: Record<string, number>;
  commentCount?: number;
  lastUpdated?: string;
  latestComment?: string;
  latestPhoto?: string;
}

export interface TripReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface TripComment {
  commentId: string;
  userId: string;
  username: string;
  photoURL: string | null;
  text: string;
  mentions: string[];
  createdAt: string;
  editedAt: string | null;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
  mainLocation: string;
  memberSince: string;       // ISO string, converted from Firestore Timestamp on read
  isPrivate: boolean;
  locationPref: LocationPref;
  biome?: Biome;
  followersCount: number;
  followingCount: number;
  catchCount: number;
  speciesCount: number;
}

export type CurrentStrength = 'stille' | 'moderat' | 'sterk' | 'sterkest';

export type PressureTrend =
  | 'falling_rapidly'
  | 'falling'
  | 'stable'
  | 'rising'
  | 'rising_rapidly';

export type TidePhase = 'rising' | 'high' | 'falling' | 'low' | 'slack';

export interface CatchLocation {
  lat: number;
  lng: number;
  accuracy_m: number;
}

export interface CatchSpecies {
  name: string;
  weight_kg: number | null;
  length_cm: number | null;
}

export interface CatchEnvironment {
  bite_score: number;
  confidence_score: number;
  air_pressure_hpa: number | null;
  pressure_trend: PressureTrend | null;
  water_temp: number | null;
  tide_phase: TidePhase | null;
  moon_phase: number | null;
}

export interface CatchRecord {
  catch_id: string;
  user_id: string;
  device_id: string;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  sync_status: SyncStatus;
  deleted: boolean;
  deleted_at: string | null;
  location: CatchLocation;
  species: CatchSpecies;
  environment: CatchEnvironment;
  // V3 trip fields — optional for backward compat with pre-V3 records
  tripId?: string;
  locationShare?: LocationPref;
  approximateLocationName?: string | null;
  photoRefs?: string[];
  caption?: string;
  isMoment?: boolean;
}

export interface PublicCatchRecord {
  catch_id: string;
  user_id: string;
  created_at: string;
  location: CatchLocation;
  species: Pick<CatchSpecies, 'name'>;
}

