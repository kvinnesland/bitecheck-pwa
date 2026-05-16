import { doc, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, LocationPref } from '../types';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export type UsernameError = 'tooShort' | 'tooLong' | 'invalid';

export function validateUsername(value: string): UsernameError | null {
  if (value.length < 3) return 'tooShort';
  if (value.length > 20) return 'tooLong';
  if (!USERNAME_RE.test(value)) return 'invalid';
  return null;
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'usernames', username));
  return snap.exists();
}

export async function claimUsername(
  uid: string,
  username: string,
  displayName: string,
  photoURL: string | null,
): Promise<void> {
  const usernameRef = doc(db, 'usernames', username);
  const userRef = doc(db, 'users', uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(usernameRef);
    if (snap.exists()) throw new Error('taken');

    tx.set(usernameRef, { uid });
    tx.set(userRef, {
      uid,
      username,
      displayName,
      photoURL,
      mainLocation: '',
      memberSince: serverTimestamp(),
      isPrivate: false,
      locationPref: (localStorage.getItem('bc_location_pref') as LocationPref) ?? 'approximate',
      followersCount: 0,
      followingCount: 0,
      catchCount: 0,
      speciesCount: 0,
    });
  });
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'mainLocation' | 'isPrivate' | 'locationPref'>>,
): Promise<void> {
  await setDoc(doc(db, 'users', uid), updates, { merge: true });
  if (updates.locationPref) {
    localStorage.setItem('bc_location_pref', updates.locationPref);
  }
}
