import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { UserProfile, LocationPref, Biome } from '../../types';

export interface FollowEntry {
  uid: string;
  status: 'pending' | 'active';
  profile: UserProfile | null;
}

export function useFollowList(
  uid: string,
  type: 'followers' | 'following',
): { entries: FollowEntry[]; loading: boolean; reload: () => void } {
  const [entries, setEntries] = useState<FollowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const snap = await getDocs(collection(db, 'users', uid, type));
      const raw = snap.docs.map(d => ({
        uid: d.id,
        status: d.data().status as 'pending' | 'active',
      }));

      const profiles = await Promise.all(
        raw.map(async ({ uid: targetUid }) => {
          const pSnap = await getDoc(doc(db, 'users', targetUid));
          if (!pSnap.exists()) return null;
          const d = pSnap.data();
          return {
            uid: d.uid as string,
            username: d.username as string,
            displayName: d.displayName as string,
            photoURL: (d.photoURL as string | null) ?? null,
            mainLocation: (d.mainLocation as string) ?? '',
            memberSince: d.memberSince?.toDate?.()?.toISOString() ?? new Date().toISOString(),
            isPrivate: (d.isPrivate as boolean) ?? false,
            locationPref: ((d.locationPref as LocationPref) ?? 'approximate'),
            biome: (d.biome as Biome | undefined) ?? undefined,
            followersCount: (d.followersCount as number) ?? 0,
            followingCount: (d.followingCount as number) ?? 0,
            catchCount: (d.catchCount as number) ?? 0,
            speciesCount: (d.speciesCount as number) ?? 0,
          } as UserProfile;
        }),
      );

      if (cancelled) return;
      setEntries(raw.map((r, i) => ({ ...r, profile: profiles[i] })));
      setLoading(false);
    }

    load().catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [uid, type, tick]);

  return { entries, loading, reload: () => setTick(t => t + 1) };
}
