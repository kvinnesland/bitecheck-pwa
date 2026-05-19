import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Settings } from 'lucide-react';
import { type User } from 'firebase/auth';
import { BottomNav, type AppView } from './BottomNav';
import { SettingsSheet } from '../settings/SettingsSheet';
import { useNotifications } from '../../hooks/useNotifications';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getBiome } from '../../lib/biomes';
import { cn } from '@/lib/utils';

interface AppShellProps {
  user: User;
  onSignOut: () => void;
  children: (view: AppView, navigate: (v: AppView) => void, openSettings: () => void, unreadCount: number) => React.ReactNode;
}

const SCREENS_WITH_OWN_HEADER = new Set<AppView>(['profil', 'feed', 'varsler']);

export function AppShell({ user, onSignOut, children }: AppShellProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<AppView>('feed');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { unreadCount } = useNotifications(user.uid);
  const { profile } = useUserProfile(user.uid);
  const biomeDef = getBiome(profile?.biome);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      {!SCREENS_WITH_OWN_HEADER.has(view) && (
        <header
          className="bg-surface/90 backdrop-blur-sm shrink-0 z-[100]"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-between px-5 h-13">
            {/* Screen-specific title handled by page; header stays sparse */}
            <div />
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setView('varsler')}
                aria-label={t('notifs.title')}
                className={cn(
                  'relative w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)]',
                  'text-text-subtle transition-colors duration-150 hover:text-text-muted',
                )}
              >
                <Bell size={18} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 bg-accent text-bg text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                aria-label={t('settings.title')}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)]',
                  'text-text-subtle transition-colors duration-150 hover:text-text-muted',
                )}
              >
                <Settings size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          {/* Biome accent line */}
          <div className="h-[2px] opacity-60" style={{ background: biomeDef.gradient }} />
        </header>
      )}

      <main className="flex-1 overflow-hidden relative">
        {children(view, setView, () => setSettingsOpen(true), unreadCount)}
      </main>

      <BottomNav active={view} onChange={setView} unreadCount={unreadCount} />

      {settingsOpen && (
        <SettingsSheet
          user={user}
          onClose={() => setSettingsOpen(false)}
          onSignOut={onSignOut}
        />
      )}
    </div>
  );
}
