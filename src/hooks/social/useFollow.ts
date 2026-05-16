import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { FollowStatus } from '../../lib/social/graph';
import { followUser, unfollowUser } from '../../lib/social/graph';

export function useFollow(
  myUid: string,
  targetUid: string,
  targetIsPrivate: boolean,
): {
  status: FollowStatus | 'loading';
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
} {
  const [status, setStatus] = useState<FollowStatus | 'loading'>('loading');

  useEffect(() => {
    if (myUid === targetUid) {
      setStatus('none');
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'users', targetUid, 'followers', myUid),
      (snap) => {
        if (!snap.exists()) {
          setStatus('none');
        } else {
          setStatus((snap.data()?.status ?? 'none') as FollowStatus);
        }
      },
    );
    return unsub;
  }, [myUid, targetUid]);

  const follow = useCallback(
    () => followUser(myUid, targetUid, targetIsPrivate),
    [myUid, targetUid, targetIsPrivate],
  );

  const unfollow = useCallback(
    () => unfollowUser(myUid, targetUid),
    [myUid, targetUid],
  );

  return { status, follow, unfollow };
}
