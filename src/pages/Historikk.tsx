import styles from './PageShell.module.css';

export function Historikk() {
  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Historikk</h2>
      <p className={styles.sub}>Alle dine registrerte fangster</p>
      <div className={styles.placeholder}>
        <span>📋</span>
        <p>Fangstliste kommer her</p>
      </div>
    </div>
  );
}
