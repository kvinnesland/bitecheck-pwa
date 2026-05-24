/**
 * Storage adapter — swap the implementation here to migrate providers.
 * Current: Firebase Storage (requires Blaze plan).
 * Future: Cloudflare R2 (zero egress) or similar.
 *
 * Call sites only import uploadPhoto / deletePhoto — they never touch the SDK directly.
 */

// ─── Provider: Firebase Storage ─────────────────────────────────────────────
// Uncomment once the Firebase project is on Blaze and a Storage bucket exists.
//
// import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
// import { app } from './firebase';
// const storage = getStorage(app);
//
// export async function uploadPhoto(blob: Blob, path: string): Promise<string> {
//   const r = ref(storage, path);
//   await uploadBytes(r, blob, { contentType: 'image/jpeg' });
//   return getDownloadURL(r);
// }
//
// export async function deletePhoto(path: string): Promise<void> {
//   await deleteObject(ref(storage, path));
// }

// ─── Stub (active until a provider is configured) ───────────────────────────
export async function uploadPhoto(_blob: Blob, _path: string): Promise<string> {
  throw new Error('Storage not configured. Enable a provider in src/lib/storage.ts.');
}

export async function deletePhoto(_path: string): Promise<void> {
  throw new Error('Storage not configured. Enable a provider in src/lib/storage.ts.');
}

// ─── Path helpers ────────────────────────────────────────────────────────────
export function catchPhotoPath(userId: string, catchId: string): string {
  return `photos/${userId}/${catchId}.jpg`;
}
