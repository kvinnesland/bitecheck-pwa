import {
  doc, setDoc, updateDoc, getDocs,
  collection, query, where,
  increment, arrayUnion, serverTimestamp, Timestamp, orderBy, limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Trip, LocationPref, TripVisibility, WaterType, CatchLocation, Biome } from '../types';

export function startTrip(params: {
  uid: string;
  title: string | null;
  note: string | null;
  location: CatchLocation | null;
  locationShare: LocationPref;
  approximateLocationName: string | null;
  firstSpecies: string;
  waterType: WaterType;
  visibility: TripVisibility;
  isMultiDay?: boolean;
  biome?: Biome;
}): string {
  const tripId = crypto.randomUUID();
  setDoc(doc(db, 'trips', tripId), {
    tripId,
    uid: params.uid,
    status: 'open',
    visibility: params.visibility,
    isMultiDay: params.isMultiDay ?? false,
    title: params.title,
    note: params.note,
    startedAt: serverTimestamp(),
    closedAt: null,
    location: params.location ? { lat: params.location.lat, lng: params.location.lng } : null,
    locationShare: params.locationShare,
    approximateLocationName: params.approximateLocationName,
    catchCount: 1,
    species: params.firstSpecies ? [params.firstSpecies] : [],
    waterType: params.waterType,
    ...(params.biome && { biome: params.biome }),
  }).catch(() => {});
  return tripId;
}

export async function setTripMultiDay(tripId: string, isMultiDay: boolean): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId), { isMultiDay });
}

export async function setTripVisibility(tripId: string, visibility: TripVisibility): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId), { visibility });
}

export function addCatchToTrip(tripId: string, species: string): void {
  updateDoc(doc(db, 'trips', tripId), {
    catchCount: increment(1),
    species: arrayUnion(species),
  }).catch(() => {});
}

export async function closeTrip(tripId: string): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId), {
    status: 'closed',
    closedAt: serverTimestamp(),
  });
}

export async function fetchOpenTrip(uid: string): Promise<Trip | null> {
  const snap = await getDocs(
    query(
      collection(db, 'trips'),
      where('uid', '==', uid),
      where('status', '==', 'open'),
      orderBy('startedAt', 'desc'),
      limit(1),
    ),
  );

  if (snap.empty) return null;
  const d = snap.docs[0].data();
  return {
    tripId: d.tripId as string,
    uid: d.uid as string,
    status: 'open',
    visibility: d.visibility as TripVisibility,
    isMultiDay: (d.isMultiDay as boolean) ?? false,
    title: (d.title as string | null) ?? null,
    note: (d.note as string | null) ?? null,
    startedAt: (d.startedAt as Timestamp)?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    closedAt: null,
    location: (d.location as CatchLocation | null) ?? null,
    locationShare: (d.locationShare as LocationPref) ?? 'approximate',
    approximateLocationName: (d.approximateLocationName as string | null) ?? null,
    catchCount: (d.catchCount as number) ?? 0,
    species: (d.species as string[]) ?? [],
    waterType: (d.waterType as WaterType) ?? 'salt',
    biome: (d.biome as Biome | undefined) ?? undefined,
  };
}
