import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function useFollowCounts(uid: string): { followersCount: number; followingCount: number } {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!uid) return;

    Promise.all([
      getDocs(collection(db, 'users', uid, 'followers')),
      getDocs(collection(db, 'users', uid, 'following')),
    ])
      .then(([followerSnap, followingSnap]) => {
        setFollowersCount(followerSnap.docs.filter(d => d.data().status === 'active').length);
        setFollowingCount(followingSnap.docs.filter(d => d.data().status === 'active').length);
      })
      .catch(() => {});
  }, [uid]);

  return { followersCount, followingCount };
}
