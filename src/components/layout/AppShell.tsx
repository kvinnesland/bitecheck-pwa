import { useState } from 'react';
import { type User } from 'firebase/auth';
import { BottomNav, type AppView } from './BottomNav';
import styles from './AppShell.module.css';

interface AppShellProps {
  user: User;
  onSignOut: () => void;
  children: (view: AppView) => React.ReactNode;
}

export function AppShell({ user, onSignOut, children }: AppShellProps) {
  const [view, setView] = useState<AppView>('logg');

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandName}>BiteCheck</span>
        </div>
        <div className={styles.userArea}>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'Bruker'}
              className={styles.avatar}
              referrerPolicy="no-referrer"
            />
          )}
          <span className={styles.displayName}>{user.displayName}</span>
          <button className={styles.signOutBtn} onClick={onSignOut}>
            Logg ut
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {children(view)}
      </main>

      <BottomNav active={view} onChange={setView} />
    </div>
  );
}
