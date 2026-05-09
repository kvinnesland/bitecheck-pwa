import styles from './PageShell.module.css';

export function BiteScore() {
  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Bite Score</h2>
      <p className={styles.sub}>Artsspesifikke prediksjoner basert på miljødata</p>
      <div className={styles.placeholder}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20a8 8 0 1 0-8-8" />
          <path d="M12 12l-4-2" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
        <p>Bite Score-algoritme kommer her</p>
      </div>
    </div>
  );
}
