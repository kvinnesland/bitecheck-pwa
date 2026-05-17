import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc, limit, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { rankTrips } from '../lib/feedRanking';
import type { Trip, LocationPref, TripVisibility, WaterType, CatchLocation, Biome } from '../types';

export type FeedTrip = Trip & {
  authorDisplayName: string;
  authorPhotoURL: string | null;
  authorUsername: string;
};

interface AuthorInfo {
  displayName: string;
  photoURL: string | null;
  username: string;
}

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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function useFeedTrips(uid: string): {
  trips: FeedTrip[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
} {
  const [allTrips, setAllTrips] = useState<FeedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Baseline — parallel, same queries that always worked in V4
      const [ownSnap, publicSnap] = await Promise.all([
        getDocs(query(collection(db, 'trips'), where('uid', '==', uid))),
        getDocs(query(collection(db, 'trips'), where('visibility', '==', 'everyone'), limit(50))),
      ]);

      // Attempt to load following-based pool; fail gracefully if rules reject
      let followedUids: string[] = [];
      try {
        const followSnap = await getDocs(collection(db, 'users', uid, 'following'));
        followedUids = followSnap.docs
          .filter(d => d.data().status === 'active')
          .map(d => d.id)
          .filter(id => id !== uid);
      } catch {
        // following list unavailable — fall back to baseline only
      }

      // Query following trips (only public — avoids permission errors on followers-only trips)
      let followingTrips: Trip[] = [];
      if (followedUids.length > 0) {
        try {
          const snaps = await Promise.all(
            chunk(followedUids, 30).map(batch =>
              getDocs(query(
                collection(db, 'trips'),
                where('uid', 'in', batch),
                where('visibility', '==', 'everyone'),
                limit(50),
              )),
            ),
          );
          followingTrips = snaps.flatMap(s =>
            s.docs.map(d => tripFromDoc(d.data() as Record<string, unknown>)),
          );
        } catch {
          // following trips unavailable — proceed with baseline
        }
      }

      // Merge + deduplicate
      const seen = new Set<string>();
      const merged: Trip[] = [];

      for (const d of ownSnap.docs) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          merged.push(tripFromDoc(d.data() as Record<string, unknown>));
        }
      }

      for (const trip of followingTrips) {
        if (!seen.has(trip.tripId)) {
          seen.add(trip.tripId);
          merged.push(trip);
        }
      }

      for (const d of publicSnap.docs) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          merged.push(tripFromDoc(d.data() as Record<string, unknown>));
        }
      }

      // Batch-fetch author profiles for non-self trips
      const nonSelfUids = [...new Set(merged.filter(t => t.uid !== uid).map(t => t.uid))];
      const profileEntries = await Promise.all(
        nonSelfUids.map(async targetUid => {
          try {
            const snap = await getDoc(doc(db, 'users', targetUid));
            if (!snap.exists()) return [targetUid, null] as const;
            const pd = snap.data();
            return [targetUid, {
              displayName: (pd.displayName as string) ?? 'Angler',
              photoURL: (pd.photoURL as string | null) ?? null,
              username: (pd.username as string) ?? '',
            }] as [string, AuthorInfo];
          } catch {
            return [targetUid, null] as const;
          }
        }),
      );

      const profileMap = new Map<string, AuthorInfo>(
        profileEntries.filter((e): e is [string, AuthorInfo] => e[1] !== null),
      );

      const viewedIds = new Set<string>(
        JSON.parse(localStorage.getItem(`bc_seen_trips_${uid}`) ?? '[]'),
      );

      const feedTrips: FeedTrip[] = merged.map(trip => {
        const author = profileMap.get(trip.uid);
        return {
          ...trip,
          authorDisplayName: author?.displayName ?? 'Angler',
          authorPhotoURL: author?.photoURL ?? null,
          authorUsername: author?.username ?? '',
        };
      });

      const ranked = rankTrips(feedTrips, viewedIds);

      if (!cancelled) setAllTrips(ranked);
    }

    load().catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [uid]);

  return {
    trips: allTrips.slice(0, visibleCount),
    loading,
    hasMore: visibleCount < allTrips.length,
    loadMore: () => setVisibleCount(v => v + 15),
  };
}
