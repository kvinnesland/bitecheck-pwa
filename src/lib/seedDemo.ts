import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { CatchRecord } from '../types';
import type { DemoProfile } from './demoData';

function postId(profileId: string, idx: number) {
  return `${profileId}-post-${idx}`;
}

export async function seedProfile(profile: DemoProfile): Promise<void> {
  for (let i = 0; i < profile.posts.length; i++) {
    const post = profile.posts[i];
    const id = postId(profile.id, i);
    const ts = new Date(Date.now() - post.hoursAgo * 3_600_000).toISOString();

    // display_name is not part of CatchRecord but useFeedPosts reads it
    const doc_data: CatchRecord & { display_name: string } = {
      catch_id: id,
      user_id: profile.id,
      device_id: 'demo-device',
      created_at: ts,
      updated_at: ts,
      synced_at: ts,
      sync_status: 'synced',
      deleted: false,
      deleted_at: null,
      location: { lat: post.lat, lng: post.lng, accuracy_m: 15 },
      species: { name: post.species, weight_kg: post.weight_kg, length_cm: post.length_cm },
      environment: {
        bite_score: 0, confidence_score: 0.5,
        air_pressure_hpa: null, pressure_trend: null,
        water_temp: null, tide_phase: null, moon_phase: 0.5,
      },
      display_name: profile.name,
    };

    await setDoc(doc(db, 'catches', id), doc_data);
  }
}

export async function unseedProfile(profile: DemoProfile): Promise<void> {
  for (let i = 0; i < profile.posts.length; i++) {
    await deleteDoc(doc(db, 'catches', postId(profile.id, i)));
  }
}

export async function isProfileSeeded(profile: DemoProfile): Promise<boolean> {
  if (profile.posts.length === 0) return false;
  const snap = await getDoc(doc(db, 'catches', postId(profile.id, 0)));
  return snap.exists() && !snap.data()?.deleted;
}
