import styles from './PageShell.module.css';

export function Historikk() {
  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Historikk</h2>
      <p className={styles.sub}>Alle dine registrerte fangster</p>
      <div className={styles.placeholder}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
        <p>Fangstliste kommer her</p>
      </div>
    </div>
  );
}
