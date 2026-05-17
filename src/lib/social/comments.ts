import { addDoc, deleteDoc, doc, getDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { writeNotification } from './notifications';

export async function addComment(params: {
  tripId: string;
  tripOwnerId: string;
  userId: string;
  username: string;
  photoURL: string | null;
  text: string;
  mentionedUids: string[];
}): Promise<string> {
  const ref = await addDoc(collection(db, 'trips', params.tripId, 'comments'), {
    userId: params.userId,
    username: params.username,
    photoURL: params.photoURL,
    text: params.text,
    mentions: params.mentionedUids,
    createdAt: serverTimestamp(),
    editedAt: null,
  });

  const snippet = params.text.slice(0, 80);

  if (params.userId !== params.tripOwnerId) {
    writeNotification(params.tripOwnerId, {
      type: 'comment',
      fromUid: params.userId,
      fromUsername: params.username,
      fromPhotoURL: params.photoURL,
      tripId: params.tripId,
      emoji: null,
      commentSnippet: snippet,
    }).catch(() => {});
  }

  for (const uid of params.mentionedUids) {
    if (uid !== params.userId) {
      writeNotification(uid, {
        type: 'mention',
        fromUid: params.userId,
        fromUsername: params.username,
        fromPhotoURL: params.photoURL,
        tripId: params.tripId,
        emoji: null,
        commentSnippet: snippet,
      }).catch(() => {});
    }
  }

  return ref.id;
}

export async function deleteComment(tripId: string, commentId: string, userId: string): Promise<void> {
  const ref = doc(db, 'trips', tripId, 'comments', commentId);
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data().userId === userId) {
    await deleteDoc(ref);
  }
}
