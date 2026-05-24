/**
 * Storage adapter — swap the implementation here to migrate providers.
 * Current: Firebase Storage (Blaze plan, europe-west1).
 * Future: Cloudflare R2 (zero egress) — replace the four functions below,
 * nothing outside this file changes.
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

export async function uploadPhoto(blob: Blob, path: string): Promise<string> {
  const r = ref(storage, path);
  await uploadBytes(r, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(r);
}

export async function deletePhoto(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}

export function catchPhotoPath(userId: string, catchId: string): string {
  return `photos/${userId}/${catchId}.jpg`;
}
