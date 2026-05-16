import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from 'firebase/auth';
import { validateUsername, isUsernameTaken, claimUsername } from '../../lib/userProfile';
import { cn } from '@/lib/utils';

interface Props {
  user: User;
}

type CheckState = 'idle' | 'checking' | 'taken' | 'available';

export function UsernameModal({ user }: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [claiming, setClaiming] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validationError = validateUsername(value);
  const canSubmit = checkState === 'available' && !claiming;

  useEffect(() => {
    if (validationError || value.length < 3) {
      setCheckState('idle');
      return;
    }

    setCheckState('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const taken = await isUsernameTaken(value);
      setCheckState(taken ? 'taken' : 'available');
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, validationError]);

  async function handleSubmit() {
    if (!canSubmit) return;
    setClaiming(true);
    setServerError(null);
    try {
      await claimUsername(user.uid, value, user.displayName ?? value, user.photoURL ?? null);
      // onSnapshot in useUserProfile will detect the new doc and ungate the app automatically
    } catch (err) {
      if (err instanceof Error && err.message === 'taken') {
        setCheckState('taken');
      } else {
        setServerError(t('username.error'));
      }
      setClaiming(false);
    }
  }

  const statusText = (() => {
    if (value.length === 0) return null;
    if (validationError) return t(`username.${validationError}`);
    if (checkState === 'checking') return t('username.checking');
    if (checkState === 'taken') return t('username.taken');
    if (checkState === 'available') return t('username.available', { username: value });
    return t('username.hint');
  })();

  const statusColor =
    checkState === 'available' ? 'text-success' :
    (checkState === 'taken' || validationError) ? 'text-error' :
    'text-text-muted';

  const borderColor =
    checkState === 'available' ? 'border-success' :
    (checkState === 'taken' || validationError) ? 'border-error' :
    'border-divider focus:border-accent';

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">

        <div className="text-center flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-text">{t('username.title')}</h1>
          <p className="text-sm text-text-muted">{t('username.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-semibold pointer-events-none select-none">
              @
            </span>
            <input
              className={cn(
                'w-full bg-surface border rounded-[var(--radius-md)] text-text text-[1.1rem] font-semibold px-4 py-3.5 pl-9 outline-none transition-colors duration-150 placeholder:text-text-muted placeholder:font-normal',
                borderColor,
              )}
              type="text"
              placeholder={t('username.placeholder')}
              value={value}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => {
                setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                setServerError(null);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>

          {statusText && (
            <p className={cn('text-sm px-1', statusColor)}>{statusText}</p>
          )}
          {!statusText && (
            <p className="text-sm text-text-muted px-1">{t('username.hint')}</p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-error text-center">{serverError}</p>
        )}

        <button
          className="bg-accent text-white text-base font-semibold py-[15px] rounded-[var(--radius-md)] w-full transition-[background,opacity] duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-accent/80"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {claiming ? t('username.claiming') : t('username.confirm')}
        </button>
      </div>
    </div>
  );
}
