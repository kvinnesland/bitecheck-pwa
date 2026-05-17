import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LoginPageProps {
  onSignIn: () => void;
  error: string | null;
  loading?: boolean;
}

export function LoginPage({ onSignIn, error, loading }: LoginPageProps) {
  const { t } = useTranslation();
  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-6"
      style={{ background: 'radial-gradient(ellipse at top, #0a2540 0%, #001529 60%)' }}
    >
      <div className="bg-surface border border-divider rounded-[var(--radius-lg)] py-12 px-10 w-full max-w-sm flex flex-col items-center gap-4 shadow-lg">
        <div className="mb-2">
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
        <p className="text-[0.95rem] text-text-muted text-center mb-2">{t('auth.subtitle')}</p>

        {error && (
          <p className="bg-error/10 border border-error rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-error w-full text-center">
            {error}
          </p>
        )}

        <button
          onClick={onSignIn}
          disabled={loading}
          aria-label={t('auth.signIn')}
          className={cn(
            'flex items-center justify-center gap-3 mt-2 w-full',
            'bg-white text-gray-800 text-[0.95rem] font-medium',
            'py-3 px-6 rounded-[var(--radius-md)]',
            'transition-colors duration-150',
            'hover:bg-slate-100 hover:shadow-md',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
        >
          <GoogleIcon />
          <span>{loading ? t('auth.signingIn') : t('auth.signIn')}</span>
        </button>

        <p className="text-xs text-text-muted text-center leading-relaxed mt-2">{t('auth.gdpr')}</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.63 4.63 0 0 1-2 3.04v2.52h3.24c1.9-1.75 3-4.33 3-7.35Z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.97-.9 6.62-2.42l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H1.07v2.6A10 10 0 0 0 10 20Z"
        fill="#34A853"
      />
      <path
        d="M4.41 11.9A5.99 5.99 0 0 1 4.1 10c0-.66.11-1.3.31-1.9V5.5H1.07A10 10 0 0 0 0 10c0 1.61.39 3.13 1.07 4.5l3.34-2.6Z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.98c1.47 0 2.78.51 3.81 1.5l2.86-2.86A9.93 9.93 0 0 0 10 0 10 10 0 0 0 1.07 5.5l3.34 2.6C5.2 5.74 7.4 3.98 10 3.98Z"
        fill="#EA4335"
      />
    </svg>
  );
}
