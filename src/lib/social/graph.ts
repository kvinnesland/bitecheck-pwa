import {
  doc, getDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { writeNotification } from './notifications';

export type FollowStatus = 'none' | 'pending' | 'active';

async function getMyProfile(myUid: string): Promise<{ username: string; photoURL: string | null }> {
  const snap = await getDoc(doc(db, 'users', myUid));
  const d = snap.data();
  return { username: d?.username ?? '', photoURL: d?.photoURL ?? null };
}

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
  // followersCount / followingCount are maintained by Cloud Functions
  await batch.commit();

  const { username, photoURL } = await getMyProfile(myUid);
  writeNotification(targetUid, {
    type: targetIsPrivate ? 'follow_request' : 'follow',
    fromUid: myUid,
    fromUsername: username,
    fromPhotoURL: photoURL,
    tripId: null,
    emoji: null,
    commentSnippet: null,
  }).catch(() => {});
}

export async function unfollowUser(myUid: string, targetUid: string): Promise<void> {
  const followerRef = doc(db, 'users', targetUid, 'followers', myUid);
  const snap = await getDoc(followerRef);
  if (!snap.exists()) return;

  const batch = writeBatch(db);
  batch.delete(followerRef);
  batch.delete(doc(db, 'users', myUid, 'following', targetUid));
  // followersCount / followingCount are maintained by Cloud Functions
  await batch.commit();
}

export async function acceptFollowRequest(
  myUid: string,
  followerUid: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', myUid, 'followers', followerUid), { status: 'active' });
  batch.update(doc(db, 'users', followerUid, 'following', myUid), { status: 'active' });
  // followersCount / followingCount are maintained by Cloud Functions
  await batch.commit();

  const { username, photoURL } = await getMyProfile(myUid);
  writeNotification(followerUid, {
    type: 'follow_accepted',
    fromUid: myUid,
    fromUsername: username,
    fromPhotoURL: photoURL,
    tripId: null,
    emoji: null,
    commentSnippet: null,
  }).catch(() => {});
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
