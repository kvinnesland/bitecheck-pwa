import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile, LocationPref, Biome } from '../types';

export function useUserProfile(uid: string): { profile: UserProfile | null; loading: boolean } {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setProfile({
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
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  return { profile, loading };
}
