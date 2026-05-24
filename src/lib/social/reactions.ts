import { setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { writeNotification } from './notifications';

export const REACTION_EMOJI = '❤️' as const;
export type ReactionEmoji = typeof REACTION_EMOJI;

export async function addReaction(params: {
  tripId: string;
  userId: string;
  tripOwnerId: string;
  fromUsername: string;
  fromPhotoURL: string | null;
  emoji: ReactionEmoji;
}): Promise<void> {
  await setDoc(doc(db, 'trips', params.tripId, 'reactions', params.userId), {
    userId: params.userId,
    emoji: params.emoji,
    createdAt: serverTimestamp(),
  });

  if (params.userId !== params.tripOwnerId) {
    writeNotification(params.tripOwnerId, {
      type: 'reaction',
      fromUid: params.userId,
      fromUsername: params.fromUsername,
      fromPhotoURL: params.fromPhotoURL,
      tripId: params.tripId,
      emoji: params.emoji,
      commentSnippet: null,
    }).catch(() => {});
  }
}

export async function removeReaction(tripId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, 'trips', tripId, 'reactions', userId));
}
