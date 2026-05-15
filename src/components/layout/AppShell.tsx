import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type User } from 'firebase/auth';
import { BottomNav, type AppView } from './BottomNav';
import { SettingsSheet } from '../settings/SettingsSheet';
import styles from './AppShell.module.css';

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
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandName}>BiteCheck</span>
        </div>
        <button
          className={styles.settingsBtn}
          onClick={() => setSettingsOpen(true)}
          aria-label={t('settings.title')}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      <main className={styles.main}>
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
