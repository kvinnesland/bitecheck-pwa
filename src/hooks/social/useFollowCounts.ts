import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function useFollowCounts(uid: string): { followersCount: number; followingCount: number } {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!uid) return;

    const unsubFollowers = onSnapshot(
      collection(db, 'users', uid, 'followers'),
      snap => setFollowersCount(snap.docs.filter(d => d.data().status === 'active').length),
      () => {},
    );
    const unsubFollowing = onSnapshot(
      collection(db, 'users', uid, 'following'),
      snap => setFollowingCount(snap.docs.filter(d => d.data().status === 'active').length),
      () => {},
    );

    return () => { unsubFollowers(); unsubFollowing(); };
  }, [uid]);

  return { followersCount, followingCount };
}
