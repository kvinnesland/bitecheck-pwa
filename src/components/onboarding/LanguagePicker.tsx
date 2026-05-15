import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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
    <div
      className="min-h-[100dvh] flex items-center justify-center p-6"
      style={{ background: 'radial-gradient(ellipse at top, #0a2540 0%, #001529 60%)' }}
    >
      <div className="bg-surface border border-divider rounded-[var(--radius-lg)] py-12 px-10 w-full max-w-sm flex flex-col items-center gap-5 shadow-lg">
        <div className="mb-1">
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

        <h1 className="text-[2rem] font-bold tracking-tight text-text font-display">BiteCheck</h1>
        <p className="text-sm text-text-muted text-center">Choose your language · Velg språk</p>

        <div className="flex gap-3 w-full mt-1">
          {LANGS.map(({ code, label, sub }) => (
            <button
              key={code}
              onClick={() => setSelected(code)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-5 px-3',
                'rounded-[var(--radius-md)] border-2 transition-colors duration-150',
                selected === code
                  ? 'border-accent bg-accent/10'
                  : 'border-divider hover:border-accent',
              )}
            >
              <span className="text-[1.4rem] font-extrabold tracking-widest text-accent">
                {code.toUpperCase()}
              </span>
              <span className="text-[0.95rem] font-semibold text-text">{label}</span>
              <span className="text-xs text-text-muted">{sub}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleDone}
          className="mt-1 w-full rounded-[var(--radius-md)] bg-accent py-3.5 text-base font-semibold text-white transition-colors duration-150 hover:bg-accent/80"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
