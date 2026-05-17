import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserCatches } from './useUserCatches';
import type { User } from 'firebase/auth';
import type { CatchLocation } from '../types';

export interface FeedPost {
  catch_id: string;
  user_id: string;
  display_name: string;
  photo_url: string | null;
  created_at: string;
  location: CatchLocation;
  species_name: string;
  weight_kg: number | null;
  length_cm: number | null;
  is_own: boolean;
}

export function useFeedPosts(user: User): FeedPost[] {
  const ownCatches = useUserCatches(user.uid);
  const [publicPosts, setPublicPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'catches'),
      orderBy('created_at', 'desc'),
      limit(60),
    );

    getDocs(q)
      .then(snapshot => {
        const posts: FeedPost[] = snapshot.docs
          .filter(d => !d.data().deleted && d.data().user_id !== user.uid)
          .map(d => {
            const data = d.data();
            return {
              catch_id: data.catch_id as string,
              user_id: data.user_id as string,
              display_name: '',
              photo_url: null,
              created_at: data.created_at as string,
              location: data.location as CatchLocation,
              species_name: (data.species?.name ?? '') as string,
              weight_kg: (data.species?.weight_kg ?? null) as number | null,
              length_cm: (data.species?.length_cm ?? null) as number | null,
              is_own: false,
            };
          });
        setPublicPosts(posts);
      })
      .catch(() => {});
  }, [user.uid]);

  const ownPosts = useMemo<FeedPost[]>(
    () =>
      ownCatches
        .filter(c => !c.deleted)
        .map(c => ({
          catch_id: c.catch_id,
          user_id: c.user_id,
          display_name: user.displayName ?? user.email?.split('@')[0] ?? '',
          photo_url: user.photoURL,
          created_at: c.created_at,
          location: c.location,
          species_name: c.species.name,
          weight_kg: c.species.weight_kg,
          length_cm: c.species.length_cm,
          is_own: true,
        })),
    [ownCatches, user],
  );

  return useMemo(
    () =>
      [...ownPosts, ...publicPosts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [ownPosts, publicPosts],
  );
}
