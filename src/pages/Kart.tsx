import styles from './PageShell.module.css';

export function Kart() {
  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Kart</h2>
      <p className={styles.sub}>Fangster og hotspots på sjøkartet</p>
      <div className={styles.placeholder}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z" />
          <line x1="9" y1="4" x2="9" y2="17" />
          <line x1="15" y1="7" x2="15" y2="20" />
        </svg>
        <p>MapLibre-kart kommer her</p>
      </div>
    </div>
  );
}
