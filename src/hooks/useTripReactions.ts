import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { TripReaction } from '../types';

export function useTripReactions(tripId: string, currentUserId: string): {
  reactions: TripReaction[];
  myReaction: string | null;
  loading: boolean;
} {
  const [reactions, setReactions] = useState<TripReaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'trips', tripId, 'reactions'),
      snap => {
        setReactions(snap.docs.map(d => ({
          userId: d.data().userId as string,
          emoji: d.data().emoji as string,
          createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [tripId]);

  const myReaction = reactions.find(r => r.userId === currentUserId)?.emoji ?? null;

  return { reactions, myReaction, loading };
}
