import SunCalc from 'suncalc';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { saveCatch } from './db';
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
  return record;
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
