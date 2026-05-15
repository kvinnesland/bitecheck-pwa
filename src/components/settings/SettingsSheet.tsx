import { useTranslation } from 'react-i18next';
import { type User } from 'firebase/auth';
import { useUnits } from '../../contexts/UnitsContext';
import { cn } from '@/lib/utils';

interface Props {
  user: User;
  onClose: () => void;
  onSignOut: () => void;
}

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'nb', label: 'Norsk' },
] as const;

function Toggle<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: (v: T) => string;
}) {
  return (
    <div className="flex gap-0.5 bg-bg rounded-[var(--radius-sm)] p-0.5">
      {options.map(({ value: v }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            'px-4 py-1.5 rounded-[6px] text-sm font-medium transition-colors duration-150',
            value === v ? 'bg-surface text-text shadow-sm' : 'text-text-muted',
          )}
        >
          {label(v)}
        </button>
      ))}
    </div>
  );
}

export function SettingsSheet({ user, onClose, onSignOut }: Props) {
  const { t, i18n } = useTranslation();
  const activeLang = i18n.language.startsWith('nb') ? 'nb' : 'en';
  const { prefs, update } = useUnits();

  return (
    <div className="fixed inset-0 bg-black/60 z-[1200] flex items-end" onClick={onClose}>
      <div className="bg-surface rounded-t-2xl w-full pb-10 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="w-9 h-1 bg-divider rounded-full mx-auto mt-3 mb-2 shrink-0" />
        <h2 className="text-[1.05rem] font-bold px-5 pb-3.5 pt-2 text-text border-b border-divider">
          {t('settings.title')}
        </h2>

        <div className="px-5 py-4 border-b border-divider">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[0.95rem] text-text">{t('settings.language')}</span>
            <Toggle
              options={LANGS.map((l) => ({ value: l.code, label: l.label }))}
              value={activeLang}
              onChange={(code) => i18n.changeLanguage(code)}
              label={(v) => LANGS.find((l) => l.code === v)?.label ?? v}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-b border-divider flex flex-col gap-2.5">
          <div className="text-[0.75rem] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">
            {t('settings.units')}
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[0.95rem] text-text">{t('settings.weight')}</span>
            <Toggle
              options={(['kg', 'lb'] as const).map((v) => ({ value: v, label: v }))}
              value={prefs.weight}
              onChange={(v) => update({ weight: v })}
              label={(v) => v}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[0.95rem] text-text">{t('settings.length')}</span>
            <Toggle
              options={(['cm', 'in'] as const).map((v) => ({ value: v, label: v }))}
              value={prefs.length}
              onChange={(v) => update({ length: v })}
              label={(v) => v}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[0.95rem] text-text">{t('settings.temperature')}</span>
            <Toggle
              options={(['c', 'f'] as const).map((v) => ({ value: v, label: v }))}
              value={prefs.temp}
              onChange={(v) => update({ temp: v })}
              label={(v) => (v === 'c' ? '°C' : '°F')}
            />
          </div>
        </div>

        <div className="px-5 py-4 flex items-center gap-3 border-b border-divider">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName ?? ''}
              className="w-[38px] h-[38px] rounded-full border-2 border-divider shrink-0"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="text-[0.9rem] text-text-muted overflow-hidden text-ellipsis whitespace-nowrap">
            {user.displayName ?? user.email}
          </span>
        </div>

        <div className="px-5 pt-4">
          <button
            onClick={onSignOut}
            className="w-full py-3 bg-transparent text-error text-[0.95rem] font-medium rounded-[var(--radius-md)] border border-error transition-colors duration-150 hover:bg-error/10"
          >
            {t('settings.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}
