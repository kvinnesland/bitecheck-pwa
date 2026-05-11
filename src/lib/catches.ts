import SunCalc from 'suncalc';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { saveCatch, getCatch } from './db';
import { compressImage } from './imageUtils';
import type { CatchRecord } from '../types';

interface GeoPosition { lat: number; lng: number; accuracy_m: number; }

function getDeviceId(): string {
  let id = localStorage.getItem('bc_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('bc_device_id', id);
  }
  return id;
}

export async function createCatch(params: {
  userId: string;
  species: string;
  weight_kg: number | null;
  length_cm: number | null;
  location: GeoPosition | null;
  photoFile?: File | null;
}): Promise<CatchRecord> {
  const now = new Date();
  const moonIllum = SunCalc.getMoonIllumination(now);

  const record: CatchRecord = {
    catch_id: crypto.randomUUID(),
    user_id: params.userId,
    device_id: getDeviceId(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    synced_at: null,
    sync_status: 'pending',
    deleted: false,
    deleted_at: null,
    location: params.location ?? { lat: 0, lng: 0, accuracy_m: -1 },
    species: {
      name: params.species,
      weight_kg: params.weight_kg,
      length_cm: params.length_cm,
      photo_url: null,
    },
    environment: {
      bite_score: 0,
      confidence_score: 0.3,
      air_pressure_hpa: null,
      pressure_trend: null,
      water_temp: null,
      tide_phase: null,
      moon_phase: moonIllum.phase,
    },
  };

  await saveCatch(record);
  syncToFirestore(record);

  if (params.photoFile) {
    uploadPhoto(record, params.photoFile);
  }

  return record;
}

async function uploadPhoto(record: CatchRecord, file: File): Promise<void> {
  try {
    const blob = await compressImage(file);
    const storageRef = ref(storage, `catches/${record.user_id}/${record.catch_id}.jpg`);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(storageRef);
    const updated: CatchRecord = {
      ...record,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
      species: { ...record.species, photo_url: url },
    };
    await saveCatch(updated);
    syncToFirestore(updated);
  } catch {
    // Photo upload failure is non-fatal — catch is already saved without photo
  }
}

export async function updateCatch(
  catchId: string,
  userId: string,
  updates: {
    species_name?: string;
    weight_kg?: number | null;
    length_cm?: number | null;
  },
): Promise<CatchRecord | null> {
  const existing = await getCatch(catchId);
  if (!existing || existing.user_id !== userId) return null;

  const updated: CatchRecord = {
    ...existing,
    updated_at: new Date().toISOString(),
    sync_status: 'pending',
    species: {
      name:      updates.species_name ?? existing.species.name,
      weight_kg: updates.weight_kg   !== undefined ? updates.weight_kg : existing.species.weight_kg,
      length_cm: updates.length_cm   !== undefined ? updates.length_cm : existing.species.length_cm,
      photo_url: existing.species.photo_url ?? null,
    },
  };

  await saveCatch(updated);
  syncToFirestore(updated);
  return updated;
}

export async function softDeleteCatch(
  catchId: string,
  userId: string,
): Promise<CatchRecord | null> {
  const existing = await getCatch(catchId);
  if (!existing || existing.user_id !== userId) return null;

  const deleted: CatchRecord = {
    ...existing,
    deleted:     true,
    deleted_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString(),
    sync_status: 'pending',
  };

  await saveCatch(deleted);
  syncToFirestore(deleted);
  return deleted;
}

export async function undoDeleteCatch(
  catchId: string,
  userId: string,
): Promise<void> {
  const existing = await getCatch(catchId);
  if (!existing || existing.user_id !== userId) return;

  const restored: CatchRecord = {
    ...existing,
    deleted:     false,
    deleted_at:  null,
    updated_at:  new Date().toISOString(),
    sync_status: 'pending',
  };

  await saveCatch(restored);
  syncToFirestore(restored);
}

function syncToFirestore(record: CatchRecord) {
  const ref = doc(db, 'catches', record.catch_id);
  setDoc(ref, record)
    .then(() => {
      saveCatch({
        ...record,
        sync_status: 'synced',
        synced_at: new Date().toISOString(),
      });
    })
    .catch(() => {
      saveCatch({ ...record, sync_status: 'failed' });
    });
}
