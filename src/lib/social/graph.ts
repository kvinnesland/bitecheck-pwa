import {
  doc, getDoc, writeBatch, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../firebase';

export type FollowStatus = 'none' | 'pending' | 'active';

export async function followUser(
  myUid: string,
  targetUid: string,
  targetIsPrivate: boolean,
): Promise<void> {
  const status = targetIsPrivate ? 'pending' : 'active';
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', targetUid, 'followers', myUid), {
    status,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', myUid, 'following', targetUid), {
    status,
    createdAt: serverTimestamp(),
  });
  if (!targetIsPrivate) {
    batch.update(doc(db, 'users', targetUid), { followersCount: increment(1) });
    batch.update(doc(db, 'users', myUid), { followingCount: increment(1) });
  }
  await batch.commit();
}

export async function unfollowUser(myUid: string, targetUid: string): Promise<void> {
  const followerRef = doc(db, 'users', targetUid, 'followers', myUid);
  const snap = await getDoc(followerRef);
  const wasActive = snap.exists() && snap.data()?.status === 'active';

  const batch = writeBatch(db);
  batch.delete(followerRef);
  batch.delete(doc(db, 'users', myUid, 'following', targetUid));
  if (wasActive) {
    batch.update(doc(db, 'users', targetUid), { followersCount: increment(-1) });
    batch.update(doc(db, 'users', myUid), { followingCount: increment(-1) });
  }
  await batch.commit();
}

export async function acceptFollowRequest(
  myUid: string,
  followerUid: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', myUid, 'followers', followerUid), { status: 'active' });
  batch.update(doc(db, 'users', followerUid, 'following', myUid), { status: 'active' });
  batch.update(doc(db, 'users', myUid), { followersCount: increment(1) });
  batch.update(doc(db, 'users', followerUid), { followingCount: increment(1) });
  await batch.commit();
}

export async function denyFollowRequest(
  myUid: string,
  followerUid: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', myUid, 'followers', followerUid));
  batch.delete(doc(db, 'users', followerUid, 'following', myUid));
  await batch.commit();
}
