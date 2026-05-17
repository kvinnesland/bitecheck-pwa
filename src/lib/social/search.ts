import {
  collection, query, where, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile, LocationPref, Biome } from '../../types';

export async function searchUsers(term: string): Promise<UserProfile[]> {
  if (!term) return [];
  const lower = term.toLowerCase();
  const snap = await getDocs(
    query(
      collection(db, 'users'),
      where('username', '>=', lower),
      where('username', '<=', lower + ''),
      orderBy('username'),
      limit(20),
    ),
  );
  return snap.docs.map(d => {
    const data = d.data();
    return {
      uid: data.uid as string,
      username: data.username as string,
      displayName: data.displayName as string,
      photoURL: (data.photoURL as string | null) ?? null,
      mainLocation: (data.mainLocation as string) ?? '',
      memberSince: data.memberSince?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      isPrivate: (data.isPrivate as boolean) ?? false,
      locationPref: ((data.locationPref as LocationPref) ?? 'approximate'),
      biome: (data.biome as Biome | undefined) ?? undefined,
      followersCount: (data.followersCount as number) ?? 0,
      followingCount: (data.followingCount as number) ?? 0,
      catchCount: (data.catchCount as number) ?? 0,
      speciesCount: (data.speciesCount as number) ?? 0,
    } as UserProfile;
  });
}
