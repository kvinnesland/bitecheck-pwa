import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Bell } from 'lucide-react';
import { type User } from 'firebase/auth';
import { BottomNav, type AppView } from './BottomNav';
import { SettingsSheet } from '../settings/SettingsSheet';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '@/lib/utils';

interface AppShellProps {
  user: User;
  onSignOut: () => void;
  children: (view: AppView, navigate: (v: AppView) => void, openSettings: () => void, unreadCount: number) => React.ReactNode;
}

export function AppShell({ user, onSignOut, children }: AppShellProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<AppView>('feed');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { unreadCount } = useNotifications(user.uid);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      {view !== 'profil' && view !== 'feed' && view !== 'varsler' && (
        <header
          className="bg-surface border-b border-divider shrink-0 z-[100]"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-between px-5 h-14">
            <span className="text-[1.15rem] font-bold tracking-tight text-text font-display">
              BiteCheck
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('varsler')}
                aria-label={t('notifs.title')}
                className={cn(
                  'relative w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)]',
                  'text-text-muted border border-divider',
                  'transition-colors duration-150 hover:text-text hover:border-accent',
                )}
              >
                <Bell size={18} strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                aria-label={t('settings.title')}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)]',
                  'text-text-muted border border-divider',
                  'transition-colors duration-150 hover:text-text hover:border-accent',
                )}
              >
                <Settings size={18} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-hidden relative">
        {children(view, setView, () => setSettingsOpen(true), unreadCount)}
      </main>

      <BottomNav active={view} onChange={setView} />

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
