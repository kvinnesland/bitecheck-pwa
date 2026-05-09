import styles from './BottomNav.module.css';

export type AppView = 'logg' | 'kart' | 'score' | 'historikk';

interface BottomNavProps {
  active: AppView;
  onChange: (view: AppView) => void;
}

const ITEMS: { view: AppView; label: string; icon: string }[] = [
  { view: 'logg',      label: 'Logg fangst', icon: '🎣' },
  { view: 'kart',      label: 'Kart',        icon: '🗺️' },
  { view: 'score',     label: 'Bite Score',  icon: '📊' },
  { view: 'historikk', label: 'Historikk',   icon: '📋' },
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
          <span className={styles.icon} aria-hidden="true">{icon}</span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
