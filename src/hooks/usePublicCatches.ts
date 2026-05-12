import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PublicCatchRecord } from '../types';

export function usePublicCatches(userId: string) {
  const [catches, setCatches] = useState<PublicCatchRecord[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'catches'),
      where('user_id', '!=', userId),
      orderBy('user_id'),
      limit(200),
    );

    getDocs(q)
      .then((snapshot) => {
        const records: PublicCatchRecord[] = snapshot.docs
          .filter((d) => !d.data().deleted)
          .map((d) => {
            const data = d.data();
            return {
              catch_id: data.catch_id as string,
              user_id: data.user_id as string,
              created_at: data.created_at as string,
              location: data.location as PublicCatchRecord['location'],
              species: { name: data.species.name as string },
            };
          });
        setCatches(records);
      })
      .catch(() => {
        // Offline or permission error — public catches unavailable
      });
  }, [userId]);

  return catches;
}
