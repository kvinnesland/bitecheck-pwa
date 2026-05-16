import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search } from 'lucide-react';
import { searchUsers } from '../../lib/social/search';
import type { UserProfile } from '../../types';

interface Props {
  onClose: () => void;
  onUserClick: (uid: string) => void;
}

export function UserSearchSheet({ onClose, onUserClick }: Props) {
  const { t } = useTranslation();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = term.trim();
    if (!trimmed) { setResults([]); return; }

    const id = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchUsers(trimmed));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [term]);

  return (
    <div className="fixed inset-0 bg-bg z-[1200] flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Search bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-divider bg-surface shrink-0">
        <button onClick={onClose} className="text-text-muted shrink-0">
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full bg-bg border border-divider rounded-full pl-9 pr-4 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-surface rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && term.trim() && results.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm text-text-muted">{t('search.noResults', { term: term.trim() })}</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="divide-y divide-divider">
            {results.map(profile => (
              <button
                key={profile.uid}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-surface transition-colors"
                onClick={() => { onUserClick(profile.uid); onClose(); }}
              >
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white font-bold shrink-0">
                    {(profile.displayName ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text truncate">{profile.displayName}</p>
                  <p className="text-xs text-text-muted">@{profile.username}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-text-muted">{profile.followersCount}</p>
                  <p className="text-[10px] text-text-muted">{t('follow.followers')}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!term.trim() && (
          <div className="p-10 text-center">
            <Search size={36} className="mx-auto mb-3 text-text-muted opacity-30" />
            <p className="text-sm text-text-muted">{t('search.hint')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
