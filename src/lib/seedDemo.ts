import { doc, getDoc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { CatchRecord } from '../types';
import type { DemoProfile } from './demoData';

export async function seedProfile(profile: DemoProfile): Promise<void> {
  const now = Date.now();

  const totalCatchCount = profile.trips.reduce(
    (sum, t) => sum + t.catches.filter(c => !c.isMoment).length,
    0,
  );
  const allSpecies = new Set(
    profile.trips.flatMap(t => t.catches.filter(c => !c.isMoment).map(c => c.species)),
  );

  // User + username in one batch
  const metaBatch = writeBatch(db);
  metaBatch.set(doc(db, 'users', profile.id), {
    uid: profile.id,
    username: profile.username,
    displayName: profile.name,
    photoURL: null,
    mainLocation: profile.mainLocation,
    memberSince: Timestamp.fromDate(new Date(now - 365 * 86_400_000)),
    isPrivate: false,
    locationPref: 'approximate',
    biome: profile.biome,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    catchCount: totalCatchCount,
    speciesCount: allSpecies.size,
  });
  metaBatch.set(doc(db, 'usernames', profile.username), { uid: profile.id });
  await metaBatch.commit();

  // Trips + catches (one batch per trip to stay well under the 500-op limit)
  for (const trip of profile.trips) {
    const startMs = now - trip.hoursAgo * 3_600_000;
    const tripSpecies = [...new Set(trip.catches.filter(c => !c.isMoment).map(c => c.species))];
    const tripCatchCount = trip.catches.filter(c => !c.isMoment).length;

    const tripBatch = writeBatch(db);

    tripBatch.set(doc(db, 'trips', trip.id), {
      tripId: trip.id,
      uid: profile.id,
      status: trip.status,
      visibility: 'everyone',
      title: trip.title,
      note: trip.note,
      startedAt: Timestamp.fromDate(new Date(startMs)),
      closedAt: trip.durationHours != null
        ? Timestamp.fromDate(new Date(startMs + trip.durationHours * 3_600_000))
        : null,
      location: { lat: trip.lat, lng: trip.lng },
      locationShare: 'approximate',
      approximateLocationName: trip.approximateLocationName,
      catchCount: tripCatchCount,
      species: tripSpecies,
      waterType: trip.waterType,
      biome: trip.biome,
    });

    trip.catches.forEach((c, ci) => {
      const catchTs = new Date(startMs + c.minutesIntoTrip * 60_000).toISOString();
      const catchDoc: CatchRecord = {
        catch_id: `${trip.id}-catch-${ci + 1}`,
        user_id: profile.id,
        device_id: 'demo-device',
        created_at: catchTs,
        updated_at: catchTs,
        synced_at: catchTs,
        sync_status: 'synced',
        deleted: false,
        deleted_at: null,
        location: { lat: c.lat, lng: c.lng, accuracy_m: 50 },
        species: { name: c.species, weight_kg: c.weight_kg, length_cm: c.length_cm },
        environment: {
          bite_score: 0,
          confidence_score: 0.5,
          air_pressure_hpa: null,
          pressure_trend: null,
          water_temp: null,
          tide_phase: null,
          moon_phase: 0.45,
        },
        tripId: trip.id,
        locationShare: 'approximate',
        approximateLocationName: trip.approximateLocationName,
        ...(c.caption && { caption: c.caption }),
        ...(c.isMoment && { isMoment: true }),
      };
      tripBatch.set(doc(db, 'catches', catchDoc.catch_id), catchDoc);
    });

    await tripBatch.commit();
  }
}

export async function unseedProfile(profile: DemoProfile): Promise<void> {
  // Catches and trips
  for (const trip of profile.trips) {
    for (let ci = 0; ci < trip.catches.length; ci++) {
      await deleteDoc(doc(db, 'catches', `${trip.id}-catch-${ci + 1}`));
    }
    await deleteDoc(doc(db, 'trips', trip.id));
  }
  await deleteDoc(doc(db, 'users', profile.id));
  await deleteDoc(doc(db, 'usernames', profile.username));
}

export async function isProfileSeeded(profile: DemoProfile): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', profile.id));
  return snap.exists();
}
