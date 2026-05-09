import type { ReactElement } from 'react';
import styles from './BottomNav.module.css';

export type AppView = 'logg' | 'kart' | 'score' | 'historikk';

interface BottomNavProps {
  active: AppView;
  onChange: (view: AppView) => void;
}

const ITEMS: { view: AppView; label: string; icon: ReactElement }[] = [
  {
    view: 'logg',
    label: 'Logg',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    view: 'kart',
    label: 'Kart',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z" />
        <line x1="9" y1="4" x2="9" y2="17" />
        <line x1="15" y1="7" x2="15" y2="20" />
      </svg>
    ),
  },
  {
    view: 'score',
    label: 'Bite Score',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20a8 8 0 1 0-8-8" />
        <path d="M12 12l-4-2" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    view: 'historikk',
    label: 'Historikk',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="Hovednavigasjon">
      {ITEMS.map(({ view, label, icon }) => (
        <button
          key={view}
          className={`${styles.item} ${active === view ? styles.active : ''}`}
          onClick={() => onChange(view)}
          aria-current={active === view ? 'page' : undefined}
        >
          <span className={styles.icon}>{icon}</span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
