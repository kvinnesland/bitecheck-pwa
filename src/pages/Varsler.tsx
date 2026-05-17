import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, UserPlus, UserCheck, MessageCircle, AtSign } from 'lucide-react';
import type { User } from 'firebase/auth';
import { useNotifications, type AppNotification } from '../hooks/useNotifications';
import { UserProfile } from './UserProfile';
import type { AppView } from '../components/layout/BottomNav';
import type { Trip } from '../types';
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
  if (type === 'reaction' && emoji) {
    return <span className="text-lg leading-none">{emoji}</span>;
  }
  const iconProps = { size: 18, strokeWidth: 1.75 };
  switch (type) {
    case 'follow':
    case 'follow_request': return <UserPlus {...iconProps} className="text-accent" />;
    case 'follow_accepted': return <UserCheck {...iconProps} className="text-success" />;
    case 'comment': return <MessageCircle {...iconProps} className="text-accent" />;
    case 'mention': return <AtSign {...iconProps} className="text-accent" />;
    default: return <Bell {...iconProps} className="text-text-muted" />;
  }
}

function notifText(n: AppNotification, t: (k: string, opts?: Record<string, string>) => string): string {
  const u = `@${n.fromUsername}`;
  switch (n.type) {
    case 'follow':          return t('notifs.follow', { user: u });
    case 'follow_request':  return t('notifs.follow_request', { user: u });
    case 'follow_accepted': return t('notifs.follow_accepted', { user: u });
    case 'reaction':        return t('notifs.reaction', { user: u, emoji: n.emoji ?? '👍' });
    case 'comment':         return n.commentSnippet
      ? t('notifs.comment_snippet', { user: u, snippet: n.commentSnippet })
      : t('notifs.comment', { user: u });
    case 'mention':         return t('notifs.mention', { user: u });
    default:                return u;
  }
}

function NotifItem({
  notif,
  onTap,
}: {
  notif: AppNotification;
  onTap: (n: AppNotification) => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      onClick={() => onTap(notif)}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3.5 border-b border-divider last:border-0 text-left transition-colors duration-150',
        !notif.read ? 'bg-accent/5 hover:bg-accent/10' : 'bg-surface hover:bg-bg',
      )}
    >
      {/* Avatar / icon */}
      <div className="relative shrink-0 mt-0.5">
        {notif.fromPhotoURL ? (
          <img
            src={notif.fromPhotoURL}
            referrerPolicy="no-referrer"
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-divider flex items-center justify-center">
            <span className="text-sm font-bold text-text-muted uppercase">
              {notif.fromUsername.slice(0, 1)}
            </span>
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-surface flex items-center justify-center">
          {notifIcon(notif.type, notif.emoji)}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text leading-snug">{notifText(notif, t as Parameters<typeof notifText>[1])}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{formatRelativeTime(notif.createdAt, t)}</p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-accent" />
      )}
    </button>
  );
}

function PushPermissionButton() {
  const { t } = useTranslation();
  if (!('Notification' in window)) return null;
  if (Notification.permission === 'granted') return null;

  return (
    <div className="mx-4 mb-4 rounded-[var(--radius-md)] border border-divider bg-surface px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text">{t('notifs.pushTitle')}</p>
        <p className="text-xs text-text-muted leading-snug mt-0.5">{t('notifs.pushDesc')}</p>
      </div>
      <button
        onClick={() => Notification.requestPermission()}
        className="shrink-0 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-full"
      >
        {t('notifs.pushEnable')}
      </button>
    </div>
  );
}

type NavEntry = { type: 'list' } | { type: 'profile'; uid: string };

export function Varsler({ uid, currentUser, onNavigate }: Props) {
  const { t } = useTranslation();
  const { notifications, loading, markRead, markAllRead } = useNotifications(uid);
  const unreadCount = notifications.filter(n => !n.read).length;
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
        targetUid={currentView.uid}
        currentUser={currentUser}
        onBack={pop}
        onTripClick={(_trip: Trip) => onNavigate('feed')}
        onUserClick={pushProfile}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Fixed header */}
      <div
        className="flex items-center justify-between px-4 bg-surface border-b border-divider shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: 12 }}
      >
        <h1 className="text-[1.05rem] font-bold text-text">{t('notifs.title')}</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead().catch(() => {})}
            className="text-xs font-semibold text-accent"
          >
            {t('notifs.markAllRead')}
          </button>
        )}
      </div>

      {/* Push permission prompt */}
      <div className="shrink-0 pt-3">
        <PushPermissionButton />
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-surface border-b border-divider animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Bell size={32} strokeWidth={1.25} className="text-text-muted/40" />
            <p className="text-sm text-text-muted">{t('notifs.empty')}</p>
          </div>
        ) : (
          <div className="bg-surface border-y border-divider">
            {notifications.map(n => (
              <NotifItem key={n.id} notif={n} onTap={handleTap} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
