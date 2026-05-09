import styles from './PageShell.module.css';

export function Kart() {
  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Kart</h2>
      <p className={styles.sub}>Fangster og hotspots på sjøkartet</p>
      <div className={styles.placeholder}>
        <span>🗺️</span>
        <p>MapLibre-kart kommer her</p>
      </div>
    </div>
  );
}
