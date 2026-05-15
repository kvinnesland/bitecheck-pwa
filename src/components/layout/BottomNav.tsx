import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './BottomNav.module.css';

export type AppView = 'logg' | 'kart' | 'score' | 'historikk';

interface BottomNavProps {
  active: AppView;
  onChange: (view: AppView) => void;
}

const NAV_ICONS: Record<AppView, ReactElement> = {
  logg: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  kart: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z" />
      <line x1="9" y1="4" x2="9" y2="17" />
      <line x1="15" y1="7" x2="15" y2="20" />
    </svg>
  ),
  score: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20a8 8 0 1 0-8-8" />
      <path d="M12 12l-4-2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  historikk: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
};

const NAV_ITEMS: { view: AppView; labelKey: string }[] = [
  { view: 'logg',      labelKey: 'nav.log' },
  { view: 'kart',      labelKey: 'nav.map' },
  { view: 'score',     labelKey: 'nav.biteScore' },
  { view: 'historikk', labelKey: 'nav.history' },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  const { t } = useTranslation();
  return (
    <nav className={styles.nav} aria-label={t('nav.ariaLabel')}>
      {NAV_ITEMS.map(({ view, labelKey }) => (
        <button
          key={view}
          className={`${styles.item} ${active === view ? styles.active : ''}`}
          onClick={() => onChange(view)}
          aria-current={active === view ? 'page' : undefined}
        >
          <span className={styles.icon}>{NAV_ICONS[view]}</span>
          <span className={styles.label}>{t(labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
