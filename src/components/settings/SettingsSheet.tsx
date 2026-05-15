import { useTranslation } from 'react-i18next';
import { type User } from 'firebase/auth';
import styles from './SettingsSheet.module.css';

interface Props {
  user: User;
  onClose: () => void;
  onSignOut: () => void;
}

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'nb', label: 'Norsk' },
] as const;

export function SettingsSheet({ user, onClose, onSignOut }: Props) {
  const { t, i18n } = useTranslation();
  const activeLang = i18n.language.startsWith('nb') ? 'nb' : 'en';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <h2 className={styles.title}>{t('settings.title')}</h2>

        <div className={styles.section}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>{t('settings.language')}</span>
            <div className={styles.toggle}>
              {LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  className={`${styles.toggleBtn} ${activeLang === code ? styles.toggleBtnActive : ''}`}
                  onClick={() => i18n.changeLanguage(code)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.userSection}>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName ?? ''}
              className={styles.avatar}
              referrerPolicy="no-referrer"
            />
          )}
          <span className={styles.userName}>{user.displayName ?? user.email}</span>
        </div>

        <div className={styles.signOutSection}>
          <button className={styles.signOutBtn} onClick={onSignOut}>
            {t('settings.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}
