import styles from './PageShell.module.css';

export function LoggFangst() {
  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Logg fangst</h2>
      <p className={styles.sub}>Registrer ny fangst med GPS, art og miljødata</p>
      <div className={styles.placeholder}>
        <span>🎣</span>
        <p>Fangstregistrering kommer her</p>
      </div>
    </div>
  );
}
