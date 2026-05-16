import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface FollowingUser {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
}

export function useMyFollowing(uid: string): FollowingUser[] {
  const [following, setFollowing] = useState<FollowingUser[]>([]);

  useEffect(() => {
    if (!uid) return;

    async function load() {
      const snap = await getDocs(collection(db, 'users', uid, 'following'));
      const active = snap.docs.filter(d => d.data().status === 'active');

      const users = await Promise.all(
        active.map(async d => {
          const profSnap = await getDoc(doc(db, 'users', d.id));
          if (!profSnap.exists()) return null;
          const pd = profSnap.data();
          return {
            uid: d.id,
            username: pd.username as string,
            displayName: pd.displayName as string,
            photoURL: (pd.photoURL as string | null) ?? null,
          };
        }),
      );

      setFollowing(users.filter((u): u is FollowingUser => u !== null));
    }

    load().catch(() => {});
  }, [uid]);

  return following;
}
