import {
  doc, setDoc, updateDoc, getDocs,
  collection, query, where,
  increment, arrayUnion, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Trip, LocationPref, TripVisibility, WaterType, CatchLocation } from '../types';

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
}): string {
  const tripId = crypto.randomUUID();
  setDoc(doc(db, 'trips', tripId), {
    tripId,
    uid: params.uid,
    status: 'open',
    visibility: params.visibility,
    title: params.title,
    note: params.note,
    startedAt: serverTimestamp(),
    closedAt: null,
    location: params.location ? { lat: params.location.lat, lng: params.location.lng } : null,
    locationShare: params.locationShare,
    approximateLocationName: params.approximateLocationName,
    catchCount: 1,
    species: [params.firstSpecies],
    waterType: params.waterType,
  }).catch(() => {});
  return tripId;
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
    query(collection(db, 'trips'), where('uid', '==', uid)),
  );
  const open = snap.docs
    .map(d => d.data())
    .filter(d => d.status === 'open')
    .sort((a, b) => {
      const aMs = (a.startedAt as Timestamp)?.toMillis?.() ?? 0;
      const bMs = (b.startedAt as Timestamp)?.toMillis?.() ?? 0;
      return bMs - aMs;
    });

  if (open.length === 0) return null;
  const d = open[0];
  return {
    tripId: d.tripId as string,
    uid: d.uid as string,
    status: 'open',
    visibility: d.visibility as TripVisibility,
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
  };
}
