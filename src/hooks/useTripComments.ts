import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { TripComment } from '../types';

export function useTripComments(tripId: string): {
  comments: TripComment[];
  loading: boolean;
} {
  const [comments, setComments] = useState<TripComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'trips', tripId, 'comments'), orderBy('createdAt', 'asc')),
      snap => {
        setComments(snap.docs.map(d => ({
          commentId: d.id,
          userId: d.data().userId as string,
          username: d.data().username as string,
          photoURL: (d.data().photoURL as string | null) ?? null,
          text: d.data().text as string,
          mentions: (d.data().mentions as string[]) ?? [],
          createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
          editedAt: (d.data().editedAt as string | null) ?? null,
        })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [tripId]);

  return { comments, loading };
}
