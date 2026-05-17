import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CatchRecord } from '../types';

export function useTripCatches(tripId: string | null): { catches: CatchRecord[]; loading: boolean } {
  const [catches, setCatches] = useState<CatchRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tripId) { setCatches([]); return; }
    setLoading(true);
    getDocs(query(collection(db, 'catches'), where('tripId', '==', tripId)))
      .then(snap => {
        const list = snap.docs
          .map(d => d.data() as CatchRecord)
          .filter(c => !c.deleted)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setCatches(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tripId]);

  return { catches, loading };
}
