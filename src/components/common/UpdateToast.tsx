import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdateToast.module.css';

export function UpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className={styles.toast} role="alert">
      <span>Ny versjon tilgjengelig</span>
      <button onClick={() => updateServiceWorker(true)} className={styles.btn}>
        Oppdater
      </button>
    </div>
  );
}
