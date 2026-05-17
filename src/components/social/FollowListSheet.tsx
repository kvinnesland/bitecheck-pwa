import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFollowList } from '../../hooks/social/useFollowList';
import { acceptFollowRequest, denyFollowRequest } from '../../lib/social/graph';

interface Props {
  uid: string;
  type: 'followers' | 'following';
  isOwn: boolean;
  myUid: string;
  onClose: () => void;
  onUserClick: (uid: string) => void;
}

export function FollowListSheet({ uid, type, isOwn, myUid, onClose, onUserClick }: Props) {
  const { t } = useTranslation();
  const { entries, loading, reload } = useFollowList(uid, type);
  const [working, setWorking] = useState<string | null>(null);

  async function handleAccept(followerUid: string) {
    setWorking(followerUid);
    try {
      await acceptFollowRequest(myUid, followerUid);
      reload();
    } finally {
      setWorking(null);
    }
  }

  async function handleDeny(followerUid: string) {
    setWorking(followerUid);
    try {
      await denyFollowRequest(myUid, followerUid);
      reload();
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[1300] flex items-end" onClick={onClose}>
      <div
        className="bg-surface rounded-t-2xl w-full pb-10 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-divider rounded-full mx-auto mt-3 mb-2 shrink-0" />
        <div className="flex items-center justify-between px-5 pb-3 pt-2 border-b border-divider shrink-0">
          <h2 className="text-[1.05rem] font-bold text-text">
            {type === 'followers' ? t('follow.followers') : t('follow.following')}
          </h2>
          <button onClick={onClose} className="text-text-muted">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-bg rounded-lg animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-text-muted">
                {type === 'followers' ? t('follow.noFollowers') : t('follow.noFollowing')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-divider">
              {entries.map(({ uid: entryUid, status, profile }) => (
                <div key={entryUid} className="flex items-center gap-3 px-5 py-3">
                  <button
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    onClick={() => { onUserClick(entryUid); onClose(); }}
                  >
                    {profile?.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {(profile?.displayName ?? '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text truncate">
                        {profile?.displayName ?? entryUid}
                      </p>
                      {profile?.username && (
                        <p className="text-xs text-text-muted">@{profile.username}</p>
                      )}
                    </div>
                  </button>

                  {isOwn && type === 'followers' && status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleAccept(entryUid)}
                        disabled={working === entryUid}
                        aria-label={t('follow.accept')}
                        className={cn(
                          'w-8 h-8 flex items-center justify-center rounded-full bg-accent/10 text-accent transition-colors hover:bg-accent/20',
                          working === entryUid && 'opacity-40 pointer-events-none',
                        )}
                      >
                        <Check size={15} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleDeny(entryUid)}
                        disabled={working === entryUid}
                        aria-label={t('follow.deny')}
                        className={cn(
                          'w-8 h-8 flex items-center justify-center rounded-full bg-error/10 text-error transition-colors hover:bg-error/20',
                          working === entryUid && 'opacity-40 pointer-events-none',
                        )}
                      >
                        <X size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}

                  {type === 'following' && status === 'pending' && (
                    <span className="shrink-0 text-[11px] text-text-muted border border-divider rounded-full px-2 py-0.5">
                      {t('follow.requested')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
