import { type User } from 'firebase/auth';
import styles from './Dashboard.module.css';

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  return (
    <div className={styles.container}>
      <div className={styles.welcome}>
        <h2>Velkommen, {user.displayName?.split(' ')[0]}!</h2>
        <p>Logg din første fangst for å komme i gang.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.cardIcon}>🎣</span>
          <h3>Logg fangst</h3>
          <p>Registrer ny fangst med GPS, art og miljødata</p>
        </div>
        <div className={styles.card}>
          <span className={styles.cardIcon}>🗺️</span>
          <h3>Kart</h3>
          <p>Se dine fangster og hotspots på sjøkartet</p>
        </div>
        <div className={styles.card}>
          <span className={styles.cardIcon}>📊</span>
          <h3>Bite Score</h3>
          <p>Artsspesifikke prediksjoner basert på miljødata</p>
        </div>
        <div className={styles.card}>
          <span className={styles.cardIcon}>📋</span>
          <h3>Historikk</h3>
          <p>Oversikt over alle dine registrerte fangster</p>
        </div>
      </div>
    </div>
  );
}
