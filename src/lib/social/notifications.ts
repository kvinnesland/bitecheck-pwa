import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface NotificationData {
  type: 'follow' | 'follow_request' | 'follow_accepted' | 'reaction' | 'comment' | 'mention';
  fromUid: string;
  fromUsername: string;
  fromPhotoURL: string | null;
  tripId: string | null;
  emoji: string | null;
  commentSnippet: string | null;
}

export function writeNotification(toUid: string, data: NotificationData): Promise<void> {
  return addDoc(collection(db, 'notifications', toUid, 'items'), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  }).then(() => undefined);
}
