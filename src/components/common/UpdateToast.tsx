import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdateToast() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      r && setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 whitespace-nowrap rounded-[var(--radius-md)] border border-accent bg-surface px-5 py-3 text-[0.9rem] shadow-lg"
    >
      <span>{t('update.available')}</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-[var(--radius-sm)] bg-accent px-3.5 py-1.5 text-[0.85rem] font-semibold text-white transition-colors duration-150 hover:bg-accent/80"
      >
        {t('update.update')}
      </button>
    </div>
  );
}
