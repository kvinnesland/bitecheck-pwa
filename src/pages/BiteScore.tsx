import styles from './PageShell.module.css';

export function BiteScore() {
  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Bite Score</h2>
      <p className={styles.sub}>Artsspesifikke prediksjoner basert på miljødata</p>
      <div className={styles.placeholder}>
        <span>📊</span>
        <p>Bite Score-algoritme kommer her</p>
      </div>
    </div>
  );
}
