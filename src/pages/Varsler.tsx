import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, UserCheck, MessageCircle, AtSign, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { useNotifications, type AppNotification } from '../hooks/useNotifications';
import { UserProfile } from './UserProfile';
import type { AppView } from '../components/layout/BottomNav';
import type { Trip } from '../types';
import { AppText } from '../components/ui/AppText';
import { QuietDivider } from '../components/ui/QuietDivider';
import { cn } from '@/lib/utils';

interface Props {
  uid: string;
  currentUser: User;
  onNavigate: (view: AppView) => void;
}

function formatRelativeTime(iso: string, t: (k: string) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifs.justNow');
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function notifIcon(type: AppNotification['type'], emoji: string | null) {
  if (type === 'reaction' && emoji) return <span className="text-base leading-none">{emoji}</span>;
  const p = { size: 16, strokeWidth: 1.5 };
  switch (type) {
    case 'follow':
    case 'follow_request': return <UserPlus {...p} className="text-accent" />;
    case 'follow_accepted': return <UserCheck {...p} className="text-success" />;
    case 'comment': return <MessageCircle {...p} className="text-accent" />;
    case 'mention': return <AtSign {...p} className="text-accent" />;
    default: return null;
  }
}

function notifText(n: AppNotification, t: (k: string, opts?: Record<string, string>) => string): string {
  const u = `@${n.fromUsername}`;
  switch (n.type) {
    case 'follow':          return t('notifs.follow', { user: u });
    case 'follow_request':  return t('notifs.follow_request', { user: u });
    case 'follow_accepted': return t('notifs.follow_accepted', { user: u });
    case 'reaction':        return t('notifs.reaction', { user: u, emoji: n.emoji ?? '👍' });
    case 'comment':         return n.commentSnippet ? t('notifs.comment_snippet', { user: u, snippet: n.commentSnippet }) : t('notifs.comment', { user: u });
    case 'mention':         return t('notifs.mention', { user: u });
    default:                return u;
  }
}

function NotifItem({ notif, onTap, onDelete }: { notif: AppNotification; onTap: (n: AppNotification) => void; onDelete: (id: string) => void }) {
  const { t } = useTranslation();
  const icon = notifIcon(notif.type, notif.emoji);

  return (
    <div className={cn('flex items-stretch', !notif.read && 'bg-accent-subtle/40')}>
      <button
        onClick={() => onTap(notif)}
        className={cn(
          'flex-1 flex items-start gap-3 px-5 py-4 text-left transition-opacity duration-150 min-w-0 active:opacity-60',
        )}
      >
        {/* Avatar / icon */}
        <div className="relative shrink-0 mt-0.5">
          {notif.fromPhotoURL ? (
            <img src={notif.fromPhotoURL} referrerPolicy="no-referrer" alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
              <AppText variant="labelM" color="secondary" as="span" className="normal-case text-[0.8rem] font-semibold">
                {notif.fromUsername.slice(0, 1).toUpperCase()}
              </AppText>
            </div>
          )}
          {icon && (
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-elevated flex items-center justify-center border border-divider">
              {icon}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <AppText variant="bodyM" color="primary" as="p" className="leading-snug">
            {notifText(notif, t as Parameters<typeof notifText>[1])}
          </AppText>
          <AppText variant="labelM" color="tertiary" as="p" className="mt-1 normal-case tracking-normal text-[0.68rem]">
            {formatRelativeTime(notif.createdAt, t)}
          </AppText>
        </div>

        {!notif.read && (
          <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-accent" />
        )}
      </button>

      <button
        onClick={() => onDelete(notif.id)}
        aria-label={t('notifs.delete')}
        className="shrink-0 flex items-center px-4 text-text-subtle hover:text-text-muted transition-colors duration-150"
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function PushPermissionBanner() {
  const { t } = useTranslation();
  if (!('Notification' in window) || Notification.permission === 'granted') return null;

  return (
    <div className="mx-5 mb-4 rounded-[var(--radius-md)] bg-surface border border-divider px-4 py-3.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <AppText variant="titleM" color="primary" as="p">{t('notifs.pushTitle')}</AppText>
        <AppText variant="bodyM" color="secondary" as="p" className="mt-0.5 leading-snug">{t('notifs.pushDesc')}</AppText>
      </div>
      <button
        onClick={() => Notification.requestPermission()}
        className="shrink-0 px-3 py-1.5 bg-accent-subtle text-accent text-[0.8rem] font-semibold rounded-full"
      >
        {t('notifs.pushEnable')}
      </button>
    </div>
  );
}

type NavEntry = { type: 'list' } | { type: 'profile'; uid: string };

export function Varsler({ uid, currentUser, onNavigate }: Props) {
  const { t } = useTranslation();
  const { notifications, loading, markRead, markAllRead, deleteNotification, deleteAllRead } = useNotifications(uid);
  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;
  const [navStack, setNavStack] = useState<NavEntry[]>([{ type: 'list' }]);
  const currentView = navStack[navStack.length - 1];

  const pushProfile = (targetUid: string) => setNavStack(s => [...s, { type: 'profile', uid: targetUid }]);
  const pop = () => setNavStack(s => s.length > 1 ? s.slice(0, -1) : s);

  async function handleTap(n: AppNotification) {
    if (!n.read) await markRead(n.id).catch(() => {});
    if (n.type === 'follow' || n.type === 'follow_request' || n.type === 'follow_accepted') {
      pushProfile(n.fromUid);
    } else if (n.tripId) {
      onNavigate('feed');
    }
  }

  if (currentView.type === 'profile') {
    return (
      <UserProfile
        targetUid={currentView.uid} currentUser={currentUser} onBack={pop}
        onTripClick={(_trip: Trip) => onNavigate('feed')} onUserClick={pushProfile}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 bg-surface border-b border-divider shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingBottom: 14 }}
      >
        <AppText variant="titleM" color="primary" as="h1">{t('notifs.title')}</AppText>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <button onClick={() => markAllRead().catch(() => {})} className="text-[0.8rem] font-medium text-accent">
              {t('notifs.markAllRead')}
            </button>
          )}
          {readCount > 0 && (
            <button onClick={() => deleteAllRead().catch(() => {})} className="text-[0.8rem] font-medium text-text-subtle hover:text-text-muted">
              {t('notifs.deleteAllRead')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="pt-4 shrink-0">
          <PushPermissionBanner />
        </div>

        {loading ? (
          <div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[72px] border-b border-divider animate-pulse bg-surface/50" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <AppText variant="titleL" color="primary" as="p" className="mb-3">
              Nothing new from the water.
            </AppText>
            <AppText variant="bodyM" color="secondary" as="p" className="max-w-[240px]">
              Quiet conditions. Reactions, follows, and comments will appear here.
            </AppText>
          </div>
        ) : (
          <div>
            {notifications.map((n, i) => (
              <div key={n.id}>
                <NotifItem notif={n} onTap={handleTap} onDelete={id => deleteNotification(id).catch(() => {})} />
                {i < notifications.length - 1 && <QuietDivider className="ml-[68px]" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
