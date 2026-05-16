import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Trip, LocationPref, TripVisibility, WaterType, CatchLocation, Biome } from '../types';

export function tripFromDoc(d: Record<string, unknown>): Trip {
  return {
    tripId: d.tripId as string,
    uid: d.uid as string,
    status: d.status as 'open' | 'closed',
    visibility: (d.visibility as TripVisibility) ?? 'everyone',
    isMultiDay: (d.isMultiDay as boolean) ?? false,
    title: (d.title as string | null) ?? null,
    note: (d.note as string | null) ?? null,
    startedAt: (d.startedAt as Timestamp)?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    closedAt: (d.closedAt as Timestamp | null)?.toDate?.()?.toISOString() ?? null,
    location: (d.location as CatchLocation | null) ?? null,
    locationShare: (d.locationShare as LocationPref) ?? 'approximate',
    approximateLocationName: (d.approximateLocationName as string | null) ?? null,
    catchCount: (d.catchCount as number) ?? 0,
    species: (d.species as string[]) ?? [],
    waterType: (d.waterType as WaterType) ?? 'salt',
    biome: (d.biome as Biome | undefined) ?? undefined,
    reactionCounts: (d.reactionCounts as Record<string, number> | undefined) ?? undefined,
    commentCount: (d.commentCount as number | undefined) ?? undefined,
  };
}

export function useFeedTrips(uid: string): { trips: Trip[]; loading: boolean } {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ownQ = getDocs(query(collection(db, 'trips'), where('uid', '==', uid)));
    const publicQ = getDocs(query(collection(db, 'trips'), where('visibility', '==', 'everyone'), limit(50)));

    Promise.all([ownQ, publicQ])
      .then(([ownSnap, publicSnap]) => {
        const seen = new Set<string>();
        const merged: Trip[] = [];

        for (const snap of [ownSnap, publicSnap]) {
          for (const doc of snap.docs) {
            if (!seen.has(doc.id)) {
              seen.add(doc.id);
              merged.push(tripFromDoc(doc.data() as Record<string, unknown>));
            }
          }
        }

        merged.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        setTrips(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  return { trips, loading };
}
