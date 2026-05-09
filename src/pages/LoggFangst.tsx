import styles from './PageShell.module.css';

export function LoggFangst() {
  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Logg fangst</h2>
      <p className={styles.sub}>Registrer ny fangst med GPS, art og miljødata</p>
      <div className={styles.placeholder}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <p>Fangstregistrering kommer her</p>
      </div>
    </div>
  );
}
