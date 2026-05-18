import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { NotificationData } from '../lib/social/notifications';

export interface AppNotification extends NotificationData {
  id: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications(uid: string): {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
} {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      query(
        collection(db, 'notifications', uid, 'items'),
        orderBy('createdAt', 'desc'),
        limit(50),
      ),
      snap => {
        setNotifications(
          snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              type: data.type,
              fromUid: data.fromUid,
              fromUsername: data.fromUsername,
              fromPhotoURL: data.fromPhotoURL ?? null,
              tripId: data.tripId ?? null,
              emoji: data.emoji ?? null,
              commentSnippet: data.commentSnippet ?? null,
              read: data.read ?? false,
              createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
            } as AppNotification;
          }),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  async function markRead(id: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', uid, 'items', id), { read: true });
  }

  async function markAllRead(): Promise<void> {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, 'notifications', uid, 'items', n.id), { read: true }));
    await batch.commit();
  }

  async function deleteNotification(id: string): Promise<void> {
    await deleteDoc(doc(db, 'notifications', uid, 'items', id));
  }

  async function deleteAllRead(): Promise<void> {
    const read = notifications.filter(n => n.read);
    if (read.length === 0) return;
    const batch = writeBatch(db);
    read.forEach(n => batch.delete(doc(db, 'notifications', uid, 'items', n.id)));
    await batch.commit();
  }

  return { notifications, unreadCount, loading, markRead, markAllRead, deleteNotification, deleteAllRead };
}
