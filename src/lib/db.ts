import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CatchRecord } from '../types';

interface BiteCheckDB extends DBSchema {
  catches: {
    key: string;
    value: CatchRecord;
    indexes: {
      by_user: string;
      by_sync_status: string;
    };
  };
  tidal_constants: {
    key: string;
    value: {
      station_id: string;
      name: string;
      lat: number;
      lng: number;
      constants: Record<string, number>;
      cached_at: string;
    };
  };
}

let _db: IDBPDatabase<BiteCheckDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<BiteCheckDB>> {
  if (_db) return _db;

  _db = await openDB<BiteCheckDB>('bitecheck', 1, {
    upgrade(db) {
      const catchStore = db.createObjectStore('catches', { keyPath: 'catch_id' });
      catchStore.createIndex('by_user', 'user_id');
      catchStore.createIndex('by_sync_status', 'sync_status');

      db.createObjectStore('tidal_constants', { keyPath: 'station_id' });
    },
  });

  return _db;
}

export async function saveCatch(record: CatchRecord): Promise<void> {
  const db = await getDB();
  await db.put('catches', record);
}

export async function getCatch(catchId: string): Promise<CatchRecord | undefined> {
  const db = await getDB();
  return db.get('catches', catchId);
}

export async function getUserCatches(userId: string): Promise<CatchRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('catches', 'by_user', userId);
  return all.filter((c) => !c.deleted);
}

export async function getPendingCatches(): Promise<CatchRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('catches', 'by_sync_status', 'pending');
}

export async function clearUserData(userId: string): Promise<void> {
  const db = await getDB();
  const catches = await db.getAllFromIndex('catches', 'by_user', userId);
  const tx = db.transaction('catches', 'readwrite');
  await Promise.all(catches.map((c) => tx.store.delete(c.catch_id)));
  await tx.done;
}
