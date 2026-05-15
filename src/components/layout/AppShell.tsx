import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { type User } from 'firebase/auth';
import { BottomNav, type AppView } from './BottomNav';
import { SettingsSheet } from '../settings/SettingsSheet';
import { cn } from '@/lib/utils';

interface AppShellProps {
  user: User;
  onSignOut: () => void;
  children: (view: AppView, navigate: (v: AppView) => void) => React.ReactNode;
}

export function AppShell({ user, onSignOut, children }: AppShellProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<AppView>('logg');
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <header className="flex items-center justify-between px-5 h-14 bg-surface border-b border-divider shrink-0 z-[100]">
        <span className="text-[1.15rem] font-bold tracking-tight text-text font-display">
          BiteCheck
        </span>
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
      </header>

      <main className="flex-1 overflow-hidden relative">
        {children(view, setView)}
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
