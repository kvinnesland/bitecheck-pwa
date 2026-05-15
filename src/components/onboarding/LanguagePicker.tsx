import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguagePicker.module.css';

interface Props {
  onDone: () => void;
}

const LANGS = [
  { code: 'en', label: 'English', sub: 'English' },
  { code: 'nb', label: 'Norsk', sub: 'Norwegian' },
] as const;

export function LanguagePicker({ onDone }: Props) {
  const { i18n } = useTranslation();
  const [selected, setSelected] = useState<'en' | 'nb'>(
    i18n.language.startsWith('nb') ? 'nb' : 'en',
  );

  function handleDone() {
    i18n.changeLanguage(selected);
    onDone();
  }

  const continueLabel = selected === 'nb' ? 'Kom i gang' : 'Get started';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <circle cx="28" cy="28" r="28" fill="#0a2540" />
            <path
              d="M14 34c2-6 6-10 14-10s12 4 14 10"
              stroke="#0066CC"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="28" cy="20" r="5" fill="#0066CC" />
            <path d="M28 25v9" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className={styles.title}>BiteCheck</h1>
        <p className={styles.prompt}>Choose your language · Velg språk</p>

        <div className={styles.langOptions}>
          {LANGS.map(({ code, label, sub }) => (
            <button
              key={code}
              className={`${styles.langBtn} ${selected === code ? styles.langBtnActive : ''}`}
              onClick={() => setSelected(code)}
            >
              <span className={styles.langCode}>{code.toUpperCase()}</span>
              <span className={styles.langLabel}>{label}</span>
              <span className={styles.langSub}>{sub}</span>
            </button>
          ))}
        </div>

        <button className={styles.continueBtn} onClick={handleDone}>
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
