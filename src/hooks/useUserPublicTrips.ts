import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { tripFromDoc } from './useFeedTrips';
import type { Trip } from '../types';

export function useUserPublicTrips(targetUid: string, isOwn: boolean): { trips: Trip[]; loading: boolean } {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = isOwn
      ? query(collection(db, 'trips'), where('uid', '==', targetUid))
      : query(collection(db, 'trips'), where('uid', '==', targetUid), where('visibility', '==', 'everyone'));

    getDocs(q)
      .then(snap => {
        const result = snap.docs
          .map(d => tripFromDoc(d.data() as Record<string, unknown>))
          .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        setTrips(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [targetUid, isOwn]);

  return { trips, loading };
}
